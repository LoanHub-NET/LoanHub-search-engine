using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Notifications;
using Microsoft.AspNetCore.SignalR;

namespace LoanHub.Search.Api.Notifications;

public sealed class SignalRApplicationNotifier : IRealtimeNotifier
{
    private readonly IHubContext<ApplicationsHub> _hubContext;

    public SignalRApplicationNotifier(IHubContext<ApplicationsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyApplicantAsync(ApplicationNotification notification, CancellationToken ct)
        => _hubContext
            .Clients
            .Group(notification.ApplicantEmail)
            .SendAsync("applicationStatusUpdated", notification, ct);
}
