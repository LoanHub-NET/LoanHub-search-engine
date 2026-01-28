using Microsoft.AspNetCore.Authorization;

namespace LoanHub.Search.Api.Authorization;

/// <summary>
/// Requirement that blocks admin users but allows anonymous and regular users.
/// Used for endpoints that should be accessible to guests and users but not admins.
/// </summary>
public sealed class NotAdminRequirement : IAuthorizationRequirement
{
}
