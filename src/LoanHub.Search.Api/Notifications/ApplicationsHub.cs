using Microsoft.AspNetCore.SignalR;

namespace LoanHub.Search.Api.Notifications;

public sealed class ApplicationsHub : Hub
{
    public Task Subscribe(string applicantEmail)
        => Groups.AddToGroupAsync(Context.ConnectionId, applicantEmail);

    public Task Unsubscribe(string applicantEmail)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, applicantEmail);
}
