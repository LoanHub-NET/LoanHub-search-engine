using LoanHub.Search.Core.Models.Notifications;

namespace LoanHub.Search.Core.Abstractions.Notifications;

public interface IRealtimeNotifier
{
    Task NotifyApplicantAsync(ApplicationNotification notification, CancellationToken ct);
}
