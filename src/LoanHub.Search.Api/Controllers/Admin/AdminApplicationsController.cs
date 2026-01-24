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
    public async Task<ActionResult<IReadOnlyList<ApplicationSummary>>> List(CancellationToken ct)
    {
        var applications = await _service.ListAsync(ct);
        var summaries = applications
            .Select(ApplicationSummary.From)
            .ToList();

        return Ok(summaries);
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
        decimal Amount
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
                application.OfferSnapshot.Amount
            );
    }
}
