namespace LoanHub.Search.Core.Services.Applications;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Core.Models.Pagination;
using LoanHub.Search.Core.Services.Notifications;

public sealed class ApplicationService
{
    private readonly IApplicationRepository _repo;
    private readonly IContractStorage _contractStorage;
    private readonly IContractDocumentGenerator _contractDocumentGenerator;
    private readonly IContractLinkGenerator _contractLinkGenerator;
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _emailTemplateRenderer;
    private readonly IProviderContactResolver _providerContactResolver;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public ApplicationService(
        IApplicationRepository repo,
        IContractStorage contractStorage,
        IContractDocumentGenerator contractDocumentGenerator,
        IContractLinkGenerator contractLinkGenerator,
        IEmailSender emailSender,
        IEmailTemplateRenderer emailTemplateRenderer,
        IProviderContactResolver providerContactResolver,
        IRealtimeNotifier realtimeNotifier)
    {
        _repo = repo;
        _contractStorage = contractStorage;
        _contractDocumentGenerator = contractDocumentGenerator;
        _contractLinkGenerator = contractLinkGenerator;
        _emailSender = emailSender;
        _emailTemplateRenderer = emailTemplateRenderer;
        _providerContactResolver = providerContactResolver;
        _realtimeNotifier = realtimeNotifier;
    }

    public async Task<LoanApplication> CreateAsync(LoanApplication application, CancellationToken ct)
    {
        application.AddStatus(ApplicationStatus.New, null);
        var created = await _repo.AddAsync(application, ct);
        await NotifySubmittedAsync(created, ct);
        return created;
    }

    public Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct)
        => _repo.GetAsync(id, ct);

    public Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct)
        => _repo.ListAsync(ct);

    public Task<IReadOnlyList<LoanApplication>> ListByUserIdAsync(Guid userId, CancellationToken ct)
        => _repo.ListByUserIdAsync(userId, ct);

    public Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct)
        => _repo.ListAdminAsync(query.Normalize(), ct);

    public async Task<CancellationResult> CancelAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return new CancellationResult(
                CancellationOutcome.NotFound,
                null,
                "Nie znaleziono wniosku.");

        return application.Status switch
        {
            ApplicationStatus.New => await CancelInternalAsync(application, ct),
            ApplicationStatus.PreliminarilyAccepted => await CancelInternalAsync(application, ct),
            ApplicationStatus.Cancelled => new CancellationResult(
                CancellationOutcome.AlreadyCancelled,
                application,
                "Wniosek został już anulowany."),
            ApplicationStatus.Rejected => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po odrzuceniu wniosku."),
            ApplicationStatus.Accepted => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po akceptacji wniosku."),
            ApplicationStatus.Granted => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po przyznaniu wniosku."),
            ApplicationStatus.ContractReady => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po przygotowaniu kontraktu."),
            ApplicationStatus.SignedContractReceived => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po przesłaniu podpisanego kontraktu."),
            ApplicationStatus.FinalApproved => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować po finalnej akceptacji."),
            _ => new CancellationResult(
                CancellationOutcome.NotAllowed,
                application,
                "Nie można zrezygnować w obecnym statusie wniosku.")
        };
    }

    public async Task<LoanApplication?> PreliminarilyAcceptAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.PreliminarilyAccepted, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Wstępnie zaakceptowany", ct);
        return updated;
    }

    public async Task<LoanApplication?> AcceptAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.Accepted, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Zaakceptowany", ct);
        return updated;
    }

    public async Task<LoanApplication?> GrantAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.Granted, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Przyznany", ct);
        return updated;
    }

    public async Task<LoanApplication?> MarkContractReadyAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.ContractReadyAt = DateTimeOffset.UtcNow;
        application.AddStatus(ApplicationStatus.ContractReady, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Kontrakt gotowy do podpisu", ct);
        return updated;
    }

    public async Task<LoanApplication?> UploadSignedContractAsync(
        Guid id,
        Stream content,
        string fileName,
        string? contentType,
        CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        var stored = await _contractStorage.UploadSignedContractAsync(
            application.Id,
            content,
            fileName,
            contentType,
            ct);

        application.SignedContractFileName = stored.FileName;
        application.SignedContractBlobName = stored.BlobName;
        application.SignedContractContentType = stored.ContentType;
        application.SignedContractReceivedAt = DateTimeOffset.UtcNow;
        application.AddStatus(ApplicationStatus.SignedContractReceived, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Podpisany kontrakt przesłany", ct);
        return updated;
    }

    public async Task<LoanApplication?> FinalApproveAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.FinalApprovedAt = DateTimeOffset.UtcNow;
        application.AddStatus(ApplicationStatus.FinalApproved, null);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, "Finalna akceptacja", ct);
        return updated;
    }

    public async Task<LoanApplication?> RejectAsync(Guid id, string reason, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.Rejected, reason);
        var updated = await _repo.UpdateAsync(application, ct);
        await NotifyStatusAsync(updated, $"Odrzucony ({reason})", ct);
        return updated;
    }

    public async Task<ContractDocument?> GetPreliminaryContractDocumentAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        if (application.Status is ApplicationStatus.New or ApplicationStatus.Rejected or ApplicationStatus.Cancelled)
            return null;

        return _contractDocumentGenerator.GeneratePreliminaryContract(application);
    }

    public async Task<IReadOnlyList<LoanApplication>> ListRecentAsync(
        string applicantEmail,
        ApplicationStatus? status,
        int days,
        CancellationToken ct)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-days);
        var applications = await _repo.ListAsync(ct);
        var filtered = applications
            .Where(application => application.CreatedAt >= cutoff)
            .Where(application => application.ApplicantEmail.Equals(applicantEmail, StringComparison.OrdinalIgnoreCase));

        if (status is not null)
            filtered = filtered.Where(application => application.Status == status);

        return filtered
            .OrderByDescending(application => application.CreatedAt)
            .ToList();
    }

    public async Task<IReadOnlyList<LoanApplication>> ListRecentByUserIdAsync(
        Guid userId,
        ApplicationStatus? status,
        int days,
        CancellationToken ct)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-days);
        var applications = await _repo.ListByUserIdAsync(userId, ct);
        var filtered = applications
            .Where(application => application.CreatedAt >= cutoff);

        if (status is not null)
            filtered = filtered.Where(application => application.Status == status);

        return filtered
            .OrderByDescending(application => application.CreatedAt)
            .ToList();
    }

    private async Task NotifySubmittedAsync(LoanApplication application, CancellationToken ct)
    {
        var tokens = BuildTemplateTokens(application);
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedSubject, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedBody, tokens);

        await SendToApplicantAsync(application, subject, body, null, ct);
        await SendToProviderAsync(application, subject, body, null, ct);
    }

    private async Task NotifyStatusAsync(LoanApplication application, string statusLabel, CancellationToken ct)
    {
        var tokens = BuildTemplateTokens(application);
        tokens["StatusLabel"] = statusLabel;
        tokens["RejectReasonLine"] = string.IsNullOrWhiteSpace(application.RejectReason)
            ? string.Empty
            : $"Powód odrzucenia: {application.RejectReason}\n";

        if (application.Status == ApplicationStatus.PreliminarilyAccepted)
        {
            var preliminaryTokens = new Dictionary<string, string>(tokens, StringComparer.OrdinalIgnoreCase)
            {
                ["ContractLink"] = _contractLinkGenerator.GetContractLink(application.Id)
            };
            await NotifyPreliminaryAcceptedAsync(application, preliminaryTokens, ct);
            await NotifyStatusForProviderAsync(application, tokens, ct);
        }
        else
        {
            await NotifyStatusForApplicantAsync(application, tokens, ct);
            await NotifyStatusForProviderAsync(application, tokens, ct);
        }

        await _realtimeNotifier.NotifyApplicantAsync(
            new ApplicationNotification(
                application.Id,
                application.ApplicantEmail,
                statusLabel,
                application.RejectReason,
                DateTimeOffset.UtcNow),
            ct);
    }

    private Task SendToApplicantAsync(
        LoanApplication application,
        string subject,
        string body,
        IReadOnlyList<EmailAttachment>? attachments,
        CancellationToken ct)
    {
        var message = new EmailMessage(application.ApplicantEmail, subject, body, attachments);
        return _emailSender.SendAsync(message, ct);
    }

    private Task SendToProviderAsync(
        LoanApplication application,
        string subject,
        string body,
        IReadOnlyList<EmailAttachment>? attachments,
        CancellationToken ct)
    {
        var email = _providerContactResolver.GetContactEmail(application.OfferSnapshot.Provider);
        if (string.IsNullOrWhiteSpace(email))
            return Task.CompletedTask;

        var message = new EmailMessage(email, subject, body, attachments);
        return _emailSender.SendAsync(message, ct);
    }

    private Task NotifyStatusForApplicantAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusSubject, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusBody, tokens);
        return SendToApplicantAsync(application, subject, body, null, ct);
    }

    private Task NotifyStatusForProviderAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusSubject, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusBody, tokens);
        return SendToProviderAsync(application, subject, body, null, ct);
    }

    private Task NotifyPreliminaryAcceptedAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.PreliminaryAcceptedSubject, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.PreliminaryAcceptedBody, tokens);
        var contract = _contractDocumentGenerator.GeneratePreliminaryContract(application);
        var attachments = new List<EmailAttachment>
        {
            new(contract.FileName, contract.ContentType, contract.Content)
        };
        return SendToApplicantAsync(application, subject, body, attachments, ct);
    }

    private Dictionary<string, string> BuildTemplateTokens(LoanApplication application)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["ApplicationId"] = application.Id.ToString(),
            ["FirstName"] = application.ApplicantDetails.FirstName,
            ["LastName"] = application.ApplicantDetails.LastName,
            ["ApplicantEmail"] = application.ApplicantEmail,
            ["Provider"] = application.OfferSnapshot.Provider,
            ["Amount"] = application.OfferSnapshot.Amount.ToString("N2"),
            ["DurationMonths"] = application.OfferSnapshot.DurationMonths.ToString(),
            ["Installment"] = application.OfferSnapshot.Installment.ToString("N2"),
            ["Apr"] = application.OfferSnapshot.Apr.ToString("N2"),
            ["TotalCost"] = application.OfferSnapshot.TotalCost.ToString("N2"),
            ["RejectReasonLine"] = string.Empty,
            ["ContractLink"] = string.Empty,
            ["StatusLabel"] = string.Empty
        };
    }

    private async Task<CancellationResult> CancelInternalAsync(LoanApplication application, CancellationToken ct)
    {
        application.AddStatus(ApplicationStatus.Cancelled, "Cancelled by user");
        var updated = await _repo.UpdateAsync(application, ct);
        return new CancellationResult(
            CancellationOutcome.Cancelled,
            updated,
            "Wniosek został anulowany.");
    }
}
