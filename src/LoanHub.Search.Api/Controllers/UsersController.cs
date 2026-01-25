using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Core.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly UserService _service;
    private readonly ITokenService _tokenService;
    private readonly IExternalTokenValidator _externalTokenValidator;

    public UsersController(
        UserService service,
        ITokenService tokenService,
        IExternalTokenValidator externalTokenValidator)
    {
        _service = service;
        _tokenService = tokenService;
        _externalTokenValidator = externalTokenValidator;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        try
        {
            var created = await _service.RegisterLocalAsync(
                request.Email,
                request.Password,
                request.Profile,
                ct);

            return Ok(AuthResponse.From(created, _tokenService.CreateToken(created)));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        var user = await _service.LoginAsync(request.Email, request.Password, ct);
        if (user is null)
            return Unauthorized();

        return Ok(AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    [HttpPost("external/register")]
    public async Task<ActionResult<AuthResponse>> RegisterExternal([FromBody] ExternalRegisterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Provider))
            return BadRequest("Provider is required.");

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest("Subject is required.");

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email is required.");

        try
        {
            var created = await _service.RegisterExternalAsync(
                request.Provider,
                request.Subject,
                request.Email,
                request.Profile,
                ct);

            return Ok(AuthResponse.From(created, _tokenService.CreateToken(created)));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("external/login")]
    public async Task<ActionResult<AuthResponse>> LoginExternal([FromBody] ExternalLoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Provider))
            return BadRequest("Provider is required.");

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest("Subject is required.");

        var user = await _service.LoginExternalAsync(request.Provider, request.Subject, ct);
        if (user is null)
            return Unauthorized();

        return Ok(AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    [HttpPost("external/oidc/login")]
    public async Task<ActionResult<AuthResponse>> LoginOidc([FromBody] OidcLoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return BadRequest("Token is required.");

        var result = await _externalTokenValidator.ValidateAsync(request.Token, ct);
        if (result is null)
            return Unauthorized();

        var user = await _service.LoginExternalAsync(result.Provider, result.Subject, ct);
        if (user is null)
        {
            if (!request.AutoRegister)
                return Unauthorized();

            var email = result.Email ?? request.Email;
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest("Email is required for external registration.");

            var profile = request.Profile ?? new UserService.UserProfile(
                result.GivenName,
                result.FamilyName,
                null,
                null,
                null,
                null);

            user = await _service.RegisterExternalAsync(
                result.Provider,
                result.Subject,
                email,
                profile,
                ct);
        }

        return Ok(AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AuthResponse>> Get(Guid id, CancellationToken ct)
    {
        var user = await _service.GetAsync(id, ct);
        if (user is null)
            return NotFound();

        return Ok(AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AuthResponse>> Update(Guid id, [FromBody] UserService.UserProfile profile, CancellationToken ct)
    {
        var user = await _service.UpdateProfileAsync(id, profile, ct);
        if (user is null)
            return NotFound();

        return Ok(AuthResponse.From(user, _tokenService.CreateToken(user)));
    }

    public sealed record RegisterRequest(
        string Email,
        string Password,
        UserService.UserProfile Profile
    );

    public sealed record LoginRequest(string Email, string Password);

    public sealed record ExternalRegisterRequest(
        string Provider,
        string Subject,
        string Email,
        UserService.UserProfile Profile
    );

    public sealed record ExternalLoginRequest(string Provider, string Subject);

    public sealed record OidcLoginRequest(
        string Token,
        string? Email,
        UserService.UserProfile? Profile,
        bool AutoRegister = true);

    public sealed record AuthResponse(
        Guid Id,
        string Email,
        UserRole Role,
        string? FirstName,
        string? LastName,
        int? Age,
        string? JobTitle,
        string? Address,
        string? IdDocumentNumber,
        IReadOnlyList<ExternalIdentityResponse> ExternalIdentities,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt,
        string Token
    )
    {
        public static AuthResponse From(UserAccount user, string token)
            => new(
                user.Id,
                user.Email,
                user.Role,
                user.FirstName,
                user.LastName,
                user.Age,
                user.JobTitle,
                user.Address,
                user.IdDocumentNumber,
                user.ExternalIdentities.Select(ExternalIdentityResponse.From).ToList(),
                user.CreatedAt,
                user.UpdatedAt,
                token
            );
    }

    public sealed record ExternalIdentityResponse(Guid Id, string Provider, string Subject)
    {
        public static ExternalIdentityResponse From(ExternalIdentity identity)
            => new(identity.Id, identity.Provider, identity.Subject);
    }
}
