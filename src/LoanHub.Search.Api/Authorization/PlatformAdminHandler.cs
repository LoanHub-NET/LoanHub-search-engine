using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Authorization;

namespace LoanHub.Search.Api.Authorization;

public sealed class PlatformAdminHandler : AuthorizationHandler<PlatformAdminRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PlatformAdminRequirement requirement)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Task.CompletedTask;

        if (context.User.IsInRole(UserRole.PlatformAdmin.ToString()))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var roleClaim = context.User.FindFirst("role")?.Value;
        if (string.Equals(roleClaim, UserRole.PlatformAdmin.ToString(), StringComparison.OrdinalIgnoreCase) ||
            string.Equals(roleClaim, "2", StringComparison.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var platformClaim = context.User.FindFirst("platform_admin")?.Value;
        if (string.Equals(platformClaim, "true", StringComparison.OrdinalIgnoreCase))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
