using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Core.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/platform-admin")]
public sealed class PlatformAdminAuthController : ControllerBase
{
    private readonly PlatformAdminAuthService _authService;
    private readonly ITokenService _tokenService;

    public PlatformAdminAuthController(PlatformAdminAuthService authService, ITokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public ActionResult<UsersController.AuthResponse> Login([FromBody] PlatformAdminLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest("Username is required.");

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        var account = _authService.Authenticate(request.Username, request.Password);
        if (account is null)
            return Unauthorized();

        var user = new UserAccount
        {
            Email = account.Username.Trim(),
            Role = UserRole.PlatformAdmin,
            FirstName = account.DisplayName,
            LastName = null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var token = _tokenService.CreateToken(user);
        return Ok(UsersController.AuthResponse.From(user, token));
    }

    public sealed record PlatformAdminLoginRequest(string Username, string Password);
}
