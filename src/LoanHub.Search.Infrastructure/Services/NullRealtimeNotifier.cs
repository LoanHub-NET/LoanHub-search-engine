using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Notifications;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class NullRealtimeNotifier : IRealtimeNotifier
{
    public Task NotifyApplicantAsync(ApplicationNotification notification, CancellationToken ct)
        => Task.CompletedTask;
}
