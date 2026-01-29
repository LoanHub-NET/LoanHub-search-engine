using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoanHub.Search.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/applications")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminApplicationsController : ControllerBase
{
    private readonly ApplicationService _service;

    public AdminApplicationsController(ApplicationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<PagedResponse<ApplicationsController.ApplicationResponse>>> List(
        [FromQuery] string? applicantEmail,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] string? provider,
        [FromQuery] DateTimeOffset? createdFrom,
        [FromQuery] DateTimeOffset? createdTo,
        [FromQuery] DateTimeOffset? updatedFrom,
        [FromQuery] DateTimeOffset? updatedTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new ApplicationAdminQuery(
            applicantEmail,
            status,
            provider,
            createdFrom,
            createdTo,
            updatedFrom,
            updatedTo,
            page,
            pageSize);

        var applications = await _service.ListAdminAsync(query, ct);
        var responses = applications.Items
            .Select(ApplicationsController.ApplicationResponse.From)
            .ToList();

        return Ok(new PagedResponse<ApplicationsController.ApplicationResponse>(
            responses,
            applications.Page,
            applications.PageSize,
            applications.TotalCount,
            applications.TotalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Get(Guid id, CancellationToken ct)
    {
        var application = await _service.GetAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Accept(Guid id, CancellationToken ct)
    {
        var application = await _service.AcceptAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/preliminary-accept")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> PreliminarilyAccept(Guid id, CancellationToken ct)
    {
        var application = await _service.PreliminarilyAcceptAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/grant")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Grant(Guid id, CancellationToken ct)
    {
        var application = await _service.GrantAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/contract-ready")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> ContractReady(Guid id, CancellationToken ct)
    {
        var application = await _service.MarkContractReadyAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/final-approve")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> FinalApprove(Guid id, CancellationToken ct)
    {
        var application = await _service.FinalApproveAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Reject(Guid id, [FromBody] RejectRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest("Reason is required.");

        var application = await _service.RejectAsync(id, request.Reason, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    public sealed record RejectRequest(string Reason);

    public sealed record PagedResponse<T>(
        IReadOnlyList<T> Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

    private Guid? GetAdminId()
    {
        var subject = User.FindFirstValue("sub");
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }
}
