namespace LoanHub.Search.Core.Services.Applications;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Notifications;

public sealed class ApplicationService
{
    private readonly IApplicationRepository _repo;
    private readonly IEmailSender _emailSender;
    private readonly IProviderContactResolver _providerContactResolver;

    public ApplicationService(
        IApplicationRepository repo,
        IEmailSender emailSender,
        IProviderContactResolver providerContactResolver)
    {
        _repo = repo;
        _emailSender = emailSender;
        _providerContactResolver = providerContactResolver;
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

    public async Task<LoanApplication?> CancelAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        if (application.Status is ApplicationStatus.Accepted or ApplicationStatus.Granted)
            return application;

        application.AddStatus(ApplicationStatus.Cancelled, "Cancelled by user");
        return await _repo.UpdateAsync(application, ct);
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
        await NotifyStatusAsync(updated, "Zaakceptowany - kontrakt gotowy", ct);
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

    private async Task NotifySubmittedAsync(LoanApplication application, CancellationToken ct)
    {
        var subject = $"LoanHub: Złożono wniosek {application.Id}";
        var body =
            $"Twój wniosek został złożony.\n" +
            $"Provider: {application.OfferSnapshot.Provider}\n" +
            $"Kwota: {application.OfferSnapshot.Amount}\n" +
            $"Okres (mies.): {application.OfferSnapshot.DurationMonths}\n";

        await SendToApplicantAsync(application, subject, body, ct);
        await SendToProviderAsync(application, subject, body, ct);
    }

    private async Task NotifyStatusAsync(LoanApplication application, string statusLabel, CancellationToken ct)
    {
        var subject = $"LoanHub: Status wniosku {application.Id}";
        var body =
            $"Status wniosku: {statusLabel}\n" +
            $"Provider: {application.OfferSnapshot.Provider}\n" +
            $"Kwota: {application.OfferSnapshot.Amount}\n" +
            $"Okres (mies.): {application.OfferSnapshot.DurationMonths}\n";

        await SendToApplicantAsync(application, subject, body, ct);
        await SendToProviderAsync(application, subject, body, ct);
    }

    private Task SendToApplicantAsync(LoanApplication application, string subject, string body, CancellationToken ct)
    {
        var message = new EmailMessage(application.ApplicantEmail, subject, body);
        return _emailSender.SendAsync(message, ct);
    }

    private Task SendToProviderAsync(LoanApplication application, string subject, string body, CancellationToken ct)
    {
        var email = _providerContactResolver.GetContactEmail(application.OfferSnapshot.Provider);
        if (string.IsNullOrWhiteSpace(email))
            return Task.CompletedTask;

        var message = new EmailMessage(email, subject, body);
        return _emailSender.SendAsync(message, ct);
    }
}
