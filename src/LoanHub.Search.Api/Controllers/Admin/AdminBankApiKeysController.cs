using System.Security.Claims;
using LoanHub.Search.Core.Models.Banks;
using LoanHub.Search.Core.Services.Banks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/bank-api-keys")]
[Authorize(Policy = "PlatformAdminOnly")]
public sealed class AdminBankApiKeysController : ControllerBase
{
    private readonly BankApiKeyService _service;

    public AdminBankApiKeysController(BankApiKeyService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BankApiKeyResponse>>> List(CancellationToken ct)
    {
        var clients = await _service.ListAsync(ct);
        return Ok(clients.Select(BankApiKeyResponse.From).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<BankApiKeyCreatedResponse>> Create(
        [FromBody] CreateBankApiKeyRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required.");

        var createdBy = TryGetUserId(User);
        var created = await _service.CreateAsync(request.Name, createdBy, ct);
        return Ok(new BankApiKeyCreatedResponse(
            created.Id,
            created.Name,
            created.ApiKey,
            created.CreatedAt,
            created.IsActive));
    }

    [HttpPost("{id:guid}/revoke")]
    public async Task<ActionResult<BankApiKeyResponse>> Revoke(Guid id, CancellationToken ct)
    {
        var updated = await _service.RevokeAsync(id, ct);
        if (updated is null)
            return NotFound();

        return Ok(BankApiKeyResponse.From(updated));
    }

    private static Guid? TryGetUserId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  user.FindFirstValue("sub") ??
                  user.FindFirstValue("id");

        return Guid.TryParse(raw, out var id) ? id : null;
    }

    public sealed record CreateBankApiKeyRequest(string Name);

    public sealed record BankApiKeyCreatedResponse(
        Guid Id,
        string Name,
        string ApiKey,
        DateTimeOffset CreatedAt,
        bool IsActive);

    public sealed record BankApiKeyResponse(
        Guid Id,
        string Name,
        bool IsActive,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastUsedAt,
        Guid? CreatedByUserId)
    {
        public static BankApiKeyResponse From(BankApiClient client)
            => new(client.Id, client.Name, client.IsActive, client.CreatedAt, client.LastUsedAt, client.CreatedByUserId);
    }
}
