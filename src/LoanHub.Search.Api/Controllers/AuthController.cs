using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Services.Auth;
using LoanHub.Search.Core.Services.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly GoogleOAuthOptions _googleOptions;
    private readonly IGoogleOAuthService _googleOAuthService;
    private readonly IExternalTokenValidator _externalTokenValidator;
    private readonly UserService _userService;
    private readonly ITokenService _tokenService;

    public AuthController(
        IOptions<GoogleOAuthOptions> googleOptions,
        IGoogleOAuthService googleOAuthService,
        IExternalTokenValidator externalTokenValidator,
        UserService userService,
        ITokenService tokenService)
    {
        _googleOptions = googleOptions.Value;
        _googleOAuthService = googleOAuthService;
        _externalTokenValidator = externalTokenValidator;
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpGet("google/config")]
    public ActionResult<GoogleOAuthConfigResponse> GetGoogleConfig()
    {
        if (string.IsNullOrWhiteSpace(_googleOptions.ClientId))
            return NotFound("Google OAuth is not configured.");

        return Ok(new GoogleOAuthConfigResponse(
            _googleOptions.ClientId,
            _googleOptions.RedirectUri,
            _googleOptions.AuthorizationEndpoint,
            _googleOptions.Scope));
    }

    [HttpPost("google/login")]
    public async Task<ActionResult<UsersController.AuthResponse>> LoginWithGoogle(
        [FromBody] GoogleOAuthLoginRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest("Authorization code is required.");

        var idToken = await _googleOAuthService.ExchangeCodeForIdTokenAsync(
            request.Code,
            request.RedirectUri,
            ct);

        if (string.IsNullOrWhiteSpace(idToken))
            return Unauthorized("Invalid Google authorization code.");

        var result = await _externalTokenValidator.ValidateAsync(idToken, ct);
        if (result is null)
            return Unauthorized();

        var user = await _userService.LoginExternalAsync(result.Provider, result.Subject, ct);
        if (user is null)
        {
            if (string.IsNullOrWhiteSpace(result.Email))
                return BadRequest("Email is required for external registration.");

            var profile = new UserService.UserProfile(
                result.GivenName,
                result.FamilyName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);

            user = await _userService.RegisterExternalAsync(
                result.Provider,
                result.Subject,
                result.Email,
                profile,
                ct);
        }

        return Ok(UsersController.AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    public sealed record GoogleOAuthLoginRequest(string Code, string? RedirectUri);

    public sealed record GoogleOAuthConfigResponse(
        string ClientId,
        string RedirectUri,
        string AuthorizationEndpoint,
        string Scope);
}
