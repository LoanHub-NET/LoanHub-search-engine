namespace LoanHub.Search.Core.Services.Applications;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Core.Models.Pagination;
using LoanHub.Search.Core.Services.Notifications;
using Microsoft.Extensions.Options;

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
    private readonly EmailBrandingOptions _brandingOptions;
    private readonly EmailAttachment? _logoInlineAttachment;

    public ApplicationService(
        IApplicationRepository repo,
        IContractStorage contractStorage,
        IContractDocumentGenerator contractDocumentGenerator,
        IContractLinkGenerator contractLinkGenerator,
        IEmailSender emailSender,
        IEmailTemplateRenderer emailTemplateRenderer,
        IProviderContactResolver providerContactResolver,
        IRealtimeNotifier realtimeNotifier,
        IOptions<EmailBrandingOptions> brandingOptions)
    {
        _repo = repo;
        _contractStorage = contractStorage;
        _contractDocumentGenerator = contractDocumentGenerator;
        _contractLinkGenerator = contractLinkGenerator;
        _emailSender = emailSender;
        _emailTemplateRenderer = emailTemplateRenderer;
        _providerContactResolver = providerContactResolver;
        _realtimeNotifier = realtimeNotifier;
        _brandingOptions = brandingOptions.Value ?? new EmailBrandingOptions();
        _logoInlineAttachment = _brandingOptions.DisableInlineLogo
            ? null
            : BuildLogoInlineAttachment(_brandingOptions);
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

        return await CancelAsync(application, ct);
    }

    public async Task<CancellationResult> CancelAsync(LoanApplication application, CancellationToken ct)
    {
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

    public async Task<LoanApplication?> PreliminarilyAcceptAsync(Guid id, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.AddStatus(ApplicationStatus.PreliminarilyAccepted, null);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Wstępnie zaakceptowany", ct);
        return updated;
    }

    public async Task<LoanApplication?> AcceptAsync(Guid id, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.AddStatus(ApplicationStatus.Accepted, null);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Zaakceptowany", ct);
        return updated;
    }

    public async Task<LoanApplication?> GrantAsync(Guid id, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.AddStatus(ApplicationStatus.Granted, null);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Przyznany", ct);
        return updated;
    }

    public async Task<LoanApplication?> MarkContractReadyAsync(Guid id, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.ContractReadyAt = DateTimeOffset.UtcNow;
        application.AddStatus(ApplicationStatus.ContractReady, null);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
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
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Podpisany kontrakt przesłany", ct);
        return updated;
    }

    public async Task<LoanApplication?> FinalApproveAsync(Guid id, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.FinalApprovedAt = DateTimeOffset.UtcNow;
        application.AddStatus(ApplicationStatus.FinalApproved, null);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Finalna akceptacja", ct);
        return updated;
    }

    public async Task<LoanApplication?> RejectAsync(Guid id, string reason, Guid? adminId, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        AssignAdminIfMissing(application, adminId);
        application.AddStatus(ApplicationStatus.Rejected, reason);
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
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
        var subjectApplicant = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedSubjectApplicant, tokens);
        var bodyApplicant = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedTextApplicant, tokens);
        var htmlApplicant = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedHtmlApplicant, tokens);

        var subjectProvider = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedSubjectProvider, tokens);
        var bodyProvider = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedTextProvider, tokens);
        var htmlProvider = _emailTemplateRenderer.Render(ApplicationEmailTemplates.SubmittedHtmlProvider, tokens);

        await SendToApplicantAsync(application, subjectApplicant, bodyApplicant, htmlApplicant, null, ct);
        if (ShouldNotifyProvider(application))
        {
            await SendToProviderAsync(application, subjectProvider, bodyProvider, htmlProvider, null, ct);
        }
    }

    private async Task NotifyStatusAsync(LoanApplication application, string statusLabel, CancellationToken ct)
    {
        var tokens = BuildTemplateTokens(application);
        tokens["StatusLabel"] = statusLabel;
        tokens["RejectReasonLine"] = string.IsNullOrWhiteSpace(application.RejectReason)
            ? string.Empty
            : $"Powód odrzucenia: {application.RejectReason}\n";
        tokens["RejectReasonBlock"] = string.IsNullOrWhiteSpace(application.RejectReason)
            ? string.Empty
            : $"""
<div style="margin:12px 0; padding:12px 14px; border-radius:12px; background:#fee2e2; color:#991b1b; font-size:13px;">
  <strong>Powód odrzucenia:</strong> {application.RejectReason}
</div>
""";

        if (application.Status == ApplicationStatus.PreliminarilyAccepted)
        {
            var preliminaryTokens = new Dictionary<string, string>(tokens, StringComparer.OrdinalIgnoreCase)
            {
                ["ContractLink"] = _contractLinkGenerator.GetContractLink(application.Id)
            };
            await NotifyPreliminaryAcceptedAsync(application, preliminaryTokens, ct);
            if (ShouldNotifyProvider(application))
            {
                await NotifyStatusForProviderAsync(application, tokens, ct);
            }
        }
        else
        {
            await NotifyStatusForApplicantAsync(application, tokens, ct);
            if (ShouldNotifyProvider(application))
            {
                await NotifyStatusForProviderAsync(application, tokens, ct);
            }
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
        string? htmlBody,
        IReadOnlyList<EmailAttachment>? attachments,
        CancellationToken ct)
    {
        var useHtml = ShouldUseHtml(application.ApplicantEmail);
        var mergedAttachments = MergeAttachments(attachments, useHtml);
        var message = new EmailMessage(
            application.ApplicantEmail,
            subject,
            body,
            useHtml ? htmlBody : null,
            mergedAttachments);
        return _emailSender.SendAsync(message, ct);
    }

    private Task SendToProviderAsync(
        LoanApplication application,
        string subject,
        string body,
        string? htmlBody,
        IReadOnlyList<EmailAttachment>? attachments,
        CancellationToken ct)
    {
        var email = _providerContactResolver.GetContactEmail(application);
        if (string.IsNullOrWhiteSpace(email))
            return Task.CompletedTask;

        var useHtml = ShouldUseHtml(email);
        var mergedAttachments = MergeAttachments(attachments, useHtml);
        var message = new EmailMessage(
            email,
            subject,
            body,
            useHtml ? htmlBody : null,
            mergedAttachments);
        return _emailSender.SendAsync(message, ct);
    }

    private Task NotifyStatusForApplicantAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusSubjectApplicant, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusTextApplicant, tokens);
        var html = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusHtmlApplicant, tokens);
        return SendToApplicantAsync(application, subject, body, html, null, ct);
    }

    private Task NotifyStatusForProviderAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusSubjectProvider, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusTextProvider, tokens);
        var html = _emailTemplateRenderer.Render(ApplicationEmailTemplates.StatusHtmlProvider, tokens);
        return SendToProviderAsync(application, subject, body, html, null, ct);
    }

    private bool ShouldNotifyProvider(LoanApplication application)
    {
        var providerEmail = _providerContactResolver.GetContactEmail(application);
        if (string.IsNullOrWhiteSpace(providerEmail))
            return false;

        if (string.IsNullOrWhiteSpace(application.ApplicantEmail))
            return true;

        return !string.Equals(providerEmail, application.ApplicantEmail, StringComparison.OrdinalIgnoreCase);
    }

    private Task NotifyPreliminaryAcceptedAsync(
        LoanApplication application,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken ct)
    {
        var subject = _emailTemplateRenderer.Render(ApplicationEmailTemplates.PreliminaryAcceptedSubjectApplicant, tokens);
        var body = _emailTemplateRenderer.Render(ApplicationEmailTemplates.PreliminaryAcceptedTextApplicant, tokens);
        var html = _emailTemplateRenderer.Render(ApplicationEmailTemplates.PreliminaryAcceptedHtmlApplicant, tokens);
        var contract = _contractDocumentGenerator.GeneratePreliminaryContract(application);
        var attachments = new List<EmailAttachment>
        {
            new(contract.FileName, contract.ContentType, contract.Content)
        };
        return SendToApplicantAsync(application, subject, body, html, attachments, ct);
    }

    private static void AssignAdminIfMissing(LoanApplication application, Guid? adminId)
    {
        if (!adminId.HasValue)
            return;

        if (application.AssignedAdminId.HasValue)
            return;

        application.AssignedAdminId = adminId.Value;
        application.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private Dictionary<string, string> BuildTemplateTokens(LoanApplication application)
    {
        var productName = string.IsNullOrWhiteSpace(_brandingOptions.ProductName)
            ? "LoanHub"
            : _brandingOptions.ProductName;
        var accentColor = string.IsNullOrWhiteSpace(_brandingOptions.AccentColor)
            ? "#2d5a87"
            : _brandingOptions.AccentColor;
        var logoBlock = BuildLogoBlock(
            productName,
            _brandingOptions.LogoUrl,
            _brandingOptions.PortalUrl,
            _logoInlineAttachment?.ContentId);
        var portalLinkBlock = BuildLinkBlock(_brandingOptions.PortalUrl, "Przejdź do panelu klienta", accentColor);
        var adminPortalLinkBlock = BuildLinkBlock(_brandingOptions.AdminPortalUrl, "Otwórz panel administracyjny", accentColor);
        var portalLinkLine = string.IsNullOrWhiteSpace(_brandingOptions.PortalUrl)
            ? string.Empty
            : $"Panel klienta: {_brandingOptions.PortalUrl}";
        var adminPortalLinkLine = string.IsNullOrWhiteSpace(_brandingOptions.AdminPortalUrl)
            ? string.Empty
            : $"Panel administracyjny: {_brandingOptions.AdminPortalUrl}";
        var assignedAdminId = application.AssignedAdminId?.ToString() ?? string.Empty;
        var assignedAdminEmail = application.AssignedAdminId.HasValue
            ? _providerContactResolver.GetContactEmail(application) ?? string.Empty
            : string.Empty;
        var assignedAdminLine = string.IsNullOrWhiteSpace(assignedAdminId)
            ? string.Empty
            : string.IsNullOrWhiteSpace(assignedAdminEmail)
                ? $"Opiekun wniosku: {assignedAdminId}\n"
                : $"Opiekun wniosku: {assignedAdminEmail} (ID: {assignedAdminId})\n";
        var assignedAdminBlock = string.IsNullOrWhiteSpace(assignedAdminId)
            ? string.Empty
            : $"""
<div style="margin:16px 0; padding:12px 14px; border-radius:12px; background:#f1f5f9; border:1px solid #e2e8f0;">
  <strong style="display:block; font-size:12px; text-transform:uppercase; color:#64748b; margin-bottom:6px;">Opiekun wniosku</strong>
  <div style="font-size:13px; color:#0f172a; font-weight:600;">{(string.IsNullOrWhiteSpace(assignedAdminEmail) ? assignedAdminId : assignedAdminEmail)}</div>
  <div style="font-size:12px; color:#64748b;">ID: {assignedAdminId}</div>
</div>
""";

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["ApplicationId"] = application.Id.ToString(),
            ["FirstName"] = application.ApplicantDetails.FirstName,
            ["LastName"] = application.ApplicantDetails.LastName,
            ["ApplicantFullName"] = $"{application.ApplicantDetails.FirstName} {application.ApplicantDetails.LastName}".Trim(),
            ["ApplicantEmail"] = application.ApplicantEmail,
            ["ApplicantAge"] = application.ApplicantDetails.Age.ToString(),
            ["ApplicantJobTitle"] = application.ApplicantDetails.JobTitle,
            ["ApplicantAddress"] = application.ApplicantDetails.Address,
            ["ApplicantIdDocument"] = application.ApplicantDetails.IdDocumentNumber,
            ["Provider"] = application.OfferSnapshot.Provider,
            ["Amount"] = application.OfferSnapshot.Amount.ToString("N2"),
            ["DurationMonths"] = application.OfferSnapshot.DurationMonths.ToString(),
            ["Installment"] = application.OfferSnapshot.Installment.ToString("N2"),
            ["Apr"] = application.OfferSnapshot.Apr.ToString("N2"),
            ["TotalCost"] = application.OfferSnapshot.TotalCost.ToString("N2"),
            ["RejectReasonLine"] = string.Empty,
            ["RejectReasonBlock"] = string.Empty,
            ["ContractLink"] = string.Empty,
            ["StatusLabel"] = string.Empty,
            ["ProductName"] = productName,
            ["AccentColor"] = accentColor,
            ["LogoBlock"] = logoBlock,
            ["PortalLinkBlock"] = portalLinkBlock,
            ["AdminPortalLinkBlock"] = adminPortalLinkBlock,
            ["PortalLinkLine"] = portalLinkLine,
            ["AdminPortalLinkLine"] = adminPortalLinkLine,
            ["SupportEmail"] = _brandingOptions.SupportEmail ?? string.Empty,
            ["AssignedAdminId"] = assignedAdminId,
            ["AssignedAdminEmail"] = assignedAdminEmail,
            ["AssignedAdminLine"] = assignedAdminLine,
            ["AssignedAdminBlock"] = assignedAdminBlock
        };
    }

    private static string BuildLogoBlock(string productName, string? logoUrl, string? portalUrl, string? inlineContentId)
    {
        if (!string.IsNullOrWhiteSpace(inlineContentId))
        {
            return $"""
<img src="cid:{inlineContentId}" alt="{productName}" style="height:32px; display:block;" />
""";
        }

        var resolvedLogoUrl = logoUrl;
        if (string.IsNullOrWhiteSpace(resolvedLogoUrl) && !string.IsNullOrWhiteSpace(portalUrl))
        {
            var trimmed = portalUrl.TrimEnd('/');
            resolvedLogoUrl = $"{trimmed}/LoanHub_logo.png";
        }

        if (string.IsNullOrWhiteSpace(resolvedLogoUrl))
        {
            return $"""
<span style="font-weight:700; font-size:20px; color:#ffffff; letter-spacing:0.5px;">{productName}</span>
""";
        }

        return $"""
<img src="{resolvedLogoUrl}" alt="{productName}" style="height:32px; display:block;" />
""";
    }

    private static EmailAttachment? BuildLogoInlineAttachment(EmailBrandingOptions branding)
    {
        if (string.IsNullOrWhiteSpace(branding.LogoInlineBase64))
            return null;

        try
        {
            var bytes = Convert.FromBase64String(branding.LogoInlineBase64);
            var contentId = string.IsNullOrWhiteSpace(branding.LogoInlineContentId)
                ? "loanhub-logo"
                : branding.LogoInlineContentId;
            var contentType = string.IsNullOrWhiteSpace(branding.LogoInlineContentType)
                ? "image/png"
                : branding.LogoInlineContentType;
            return new EmailAttachment("loanhub-logo.png", contentType, bytes, "inline", contentId);
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private IReadOnlyList<EmailAttachment>? MergeAttachments(
        IReadOnlyList<EmailAttachment>? attachments,
        bool includeInlineLogo)
    {
        if (!includeInlineLogo || _logoInlineAttachment is null)
            return attachments;

        if (attachments is null || attachments.Count == 0)
            return new[] { _logoInlineAttachment };

        var merged = new List<EmailAttachment>(attachments.Count + 1) { _logoInlineAttachment };
        merged.AddRange(attachments);
        return merged;
    }

    private bool ShouldUseHtml(string? recipientEmail)
    {
        if (_brandingOptions.DisableHtml)
            return false;

        if (string.IsNullOrWhiteSpace(recipientEmail))
            return true;

        var atIndex = recipientEmail.LastIndexOf('@');
        var domain = atIndex >= 0 ? recipientEmail[(atIndex + 1)..] : recipientEmail;
        if (string.IsNullOrWhiteSpace(domain))
            return true;

        foreach (var candidate in _brandingOptions.PlainTextDomains)
        {
            if (string.IsNullOrWhiteSpace(candidate))
                continue;

            var normalized = candidate.Trim().TrimStart('@');
            if (string.IsNullOrWhiteSpace(normalized))
                continue;

            if (domain.Equals(normalized, StringComparison.OrdinalIgnoreCase) ||
                domain.EndsWith($".{normalized}", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static string BuildLinkBlock(string? url, string label, string accentColor)
    {
        if (string.IsNullOrWhiteSpace(url))
            return string.Empty;

        return $"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;">
  <tr>
    <td>
      <a href="{url}" style="display:inline-block; padding:10px 18px; background:{accentColor}; color:#ffffff; text-decoration:none; border-radius:999px; font-size:13px; font-weight:700;">
        {label}
      </a>
    </td>
  </tr>
</table>
""";
    }

    private async Task<CancellationResult> CancelInternalAsync(LoanApplication application, CancellationToken ct)
    {
        application.AddStatus(ApplicationStatus.Cancelled, "Anulowany przez klienta");
        var updated = await _repo.UpdateAsync(application, ct) ?? application;
        await NotifyStatusAsync(updated, "Anulowany przez klienta", ct);
        return new CancellationResult(
            CancellationOutcome.Cancelled,
            updated,
            "Wniosek został anulowany.");
    }
}
