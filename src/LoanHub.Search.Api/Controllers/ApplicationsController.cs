using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/applications")]
public sealed class ApplicationsController : ControllerBase
{
    private readonly ApplicationService _service;

    public ApplicationsController(ApplicationService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<ApplicationResponse>> Create([FromBody] CreateApplicationRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ApplicantEmail))
            return BadRequest("ApplicantEmail is required.");

        if (OfferValidityPolicy.IsExpired(request.ValidUntil, DateTimeOffset.UtcNow))
            return BadRequest("Offer has expired.");

        var application = new LoanApplication
        {
            ApplicantEmail = request.ApplicantEmail,
            ApplicantDetails = new ApplicantDetails(
                request.FirstName,
                request.LastName,
                request.Age,
                request.JobTitle,
                request.Address,
                request.IdDocumentNumber
            ),
            OfferSnapshot = new OfferSnapshot(
                request.Provider,
                request.ProviderOfferId,
                request.Installment,
                request.Apr,
                request.TotalCost,
                request.Amount,
                request.DurationMonths,
                request.ValidUntil
            )
        };

        var created = await _service.CreateAsync(application, ct);
        return Ok(ApplicationResponse.From(created));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationResponse>> Get(Guid id, CancellationToken ct)
    {
        var application = await _service.GetAsync(id, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationResponse.From(application));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApplicationResponse>>> List(
        [FromQuery] string applicantEmail,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] int days = 10,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(applicantEmail))
            return BadRequest("ApplicantEmail is required.");

        var applications = await _service.ListRecentAsync(applicantEmail, status, days, ct);
        var responses = applications
            .Select(ApplicationResponse.From)
            .ToList();

        return Ok(responses);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApplicationResponse>> Cancel(Guid id, CancellationToken ct)
    {
        var result = await _service.CancelAsync(id, ct);

        return result.Outcome switch
        {
            CancellationOutcome.NotFound => NotFound(),
            CancellationOutcome.Cancelled => Ok(ApplicationResponse.From(result.Application!)),
            CancellationOutcome.AlreadyCancelled => Conflict(result.Message),
            CancellationOutcome.NotAllowed => Conflict(result.Message),
            _ => BadRequest(result.Message)
        };
    }

    [HttpPost("{id:guid}/signed-contract")]
    public async Task<ActionResult<ApplicationResponse>> UploadSignedContract(
        Guid id,
        [FromBody] SignedContractRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FileName))
            return BadRequest("FileName is required.");

        var application = await _service.UploadSignedContractAsync(id, request.FileName, ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationResponse.From(application));
    }

    public sealed record CreateApplicationRequest(
        string ApplicantEmail,
        string FirstName,
        string LastName,
        int Age,
        string JobTitle,
        string Address,
        string IdDocumentNumber,
        string Provider,
        string ProviderOfferId,
        decimal Installment,
        decimal Apr,
        decimal TotalCost,
        decimal Amount,
        int DurationMonths,
        DateTimeOffset ValidUntil
    );

    public sealed record SignedContractRequest(string FileName);

    public sealed record ApplicationResponse(
        Guid Id,
        string ApplicantEmail,
        ApplicationStatus Status,
        string? RejectReason,
        DateTimeOffset? ContractReadyAt,
        string? SignedContractFileName,
        DateTimeOffset? SignedContractUploadedAt,
        DateTimeOffset? FinalApprovedAt,
        ApplicantDetails ApplicantDetails,
        OfferSnapshot OfferSnapshot,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt,
        IReadOnlyList<StatusHistoryEntry> StatusHistory
    )
    {
        public static ApplicationResponse From(LoanApplication application)
            => new(
                application.Id,
                application.ApplicantEmail,
                application.Status,
                application.RejectReason,
                application.ContractReadyAt,
                application.SignedContractFileName,
                application.SignedContractUploadedAt,
                application.FinalApprovedAt,
                application.ApplicantDetails,
                application.OfferSnapshot,
                application.CreatedAt,
                application.UpdatedAt,
                application.StatusHistory
            );
    }
}
