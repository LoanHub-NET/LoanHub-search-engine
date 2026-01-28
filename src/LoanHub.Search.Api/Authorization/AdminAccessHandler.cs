using System.Security.Claims;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Authorization;

namespace LoanHub.Search.Api.Authorization;

public sealed class AdminAccessHandler : AuthorizationHandler<AdminAccessRequirement>
{
    private readonly IUserRepository _users;

    public AdminAccessHandler(IUserRepository users)
        => _users = users;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminAccessRequirement requirement)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return;

        if (context.User.IsInRole(UserRole.Admin.ToString()))
        {
            context.Succeed(requirement);
            return;
        }

        var isAdminClaim = context.User.FindFirst("is_admin")?.Value;
        if (string.Equals(isAdminClaim, "true", StringComparison.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return;
        }

        var email = context.User.FindFirstValue(ClaimTypes.Email) ??
                    context.User.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
            return;

        var user = await _users.GetByEmailAsync(email, CancellationToken.None);
        if (user is not null && user.Role == UserRole.Admin)
        {
            context.Succeed(requirement);
        }
    }
}
