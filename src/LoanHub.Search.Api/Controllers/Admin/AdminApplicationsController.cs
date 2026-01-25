using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/applications")]
[Authorize(Roles = "Admin")]
public sealed class AdminApplicationsController : ControllerBase
{
    private readonly ApplicationService _service;

    public AdminApplicationsController(ApplicationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<AdminApplicationsResponse>> List(
        [FromQuery] string? applicantEmail,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] string? provider,
        [FromQuery] DateTimeOffset? createdFrom,
        [FromQuery] DateTimeOffset? createdTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (page < 1)
            return BadRequest("Page must be >= 1.");

        if (pageSize < 1 || pageSize > 200)
            return BadRequest("PageSize must be between 1 and 200.");

        var query = new ApplicationAdminQuery(
            applicantEmail,
            status,
            provider,
            createdFrom,
            createdTo,
            page,
            pageSize);

        var applications = await _service.ListAdminAsync(query, ct);
        var summaries = applications.Items
            .Select(ApplicationSummary.From)
            .ToList();

        return Ok(new AdminApplicationsResponse(
            summaries,
            applications.TotalCount,
            applications.Page,
            applications.PageSize
        ));
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
        var application = await _service.AcceptAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/preliminary-accept")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> PreliminarilyAccept(Guid id, CancellationToken ct)
    {
        var application = await _service.PreliminarilyAcceptAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/grant")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Grant(Guid id, CancellationToken ct)
    {
        var application = await _service.GrantAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/contract-ready")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> ContractReady(Guid id, CancellationToken ct)
    {
        var application = await _service.MarkContractReadyAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/final-approve")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> FinalApprove(Guid id, CancellationToken ct)
    {
        var application = await _service.FinalApproveAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Reject(Guid id, [FromBody] RejectRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest("Reason is required.");

        var application = await _service.RejectAsync(id, request.Reason, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationsController.ApplicationResponse.From(application));
    }

    public sealed record RejectRequest(string Reason);

    public sealed record ApplicationSummary(
        Guid Id,
        string ApplicantEmail,
        ApplicationStatus Status,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt,
        string Provider,
        decimal Amount,
        string? RejectReason
    )
    {
        public static ApplicationSummary From(LoanApplication application)
            => new(
                application.Id,
                application.ApplicantEmail,
                application.Status,
                application.CreatedAt,
                application.UpdatedAt,
                application.OfferSnapshot.Provider,
                application.OfferSnapshot.Amount,
                application.RejectReason
            );
    }

    public sealed record AdminApplicationsResponse(
        IReadOnlyList<ApplicationSummary> Items,
        int TotalCount,
        int Page,
        int PageSize
    );
}
