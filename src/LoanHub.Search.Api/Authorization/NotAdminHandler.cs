using System.Security.Claims;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Authorization;

namespace LoanHub.Search.Api.Authorization;

/// <summary>
/// Authorization handler that allows anonymous users and regular users,
/// but denies access to admins. This is used for user-facing features
/// like loan search that admins should not access.
/// </summary>
public sealed class NotAdminHandler : AuthorizationHandler<NotAdminRequirement>
{
    private readonly IUserRepository _users;

    public NotAdminHandler(IUserRepository users)
        => _users = users;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        NotAdminRequirement requirement)
    {
        // Anonymous users are allowed
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            context.Succeed(requirement);
            return;
        }

        // Check if user is admin via role claim - if so, deny access
        if (context.User.IsInRole(UserRole.Admin.ToString()))
            return;

        if (context.User.IsInRole(UserRole.PlatformAdmin.ToString()))
            return;

        // Check is_admin claim
        var isAdminClaim = context.User.FindFirst("is_admin")?.Value;
        if (string.Equals(isAdminClaim, "true", StringComparison.OrdinalIgnoreCase))
            return;

        var isPlatformAdminClaim = context.User.FindFirst("platform_admin")?.Value;
        if (string.Equals(isPlatformAdminClaim, "true", StringComparison.OrdinalIgnoreCase))
            return;

        // Double-check against the database
        var email = context.User.FindFirstValue(ClaimTypes.Email) ??
                    context.User.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
        {
            // No email claim but authenticated - allow (probably a user)
            context.Succeed(requirement);
            return;
        }

        var user = await _users.GetByEmailAsync(email, CancellationToken.None);
        
        // If user not found in DB or is not admin, allow access
        if (user is null || (user.Role != UserRole.Admin && user.Role != UserRole.PlatformAdmin))
        {
            context.Succeed(requirement);
        }
        // If user is admin in DB, don't succeed - they should not access these endpoints
    }
}
