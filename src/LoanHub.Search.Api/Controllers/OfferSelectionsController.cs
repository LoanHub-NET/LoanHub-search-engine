using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Core.Services.Selections;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/offer-selections")]
public sealed class OfferSelectionsController : ControllerBase
{
    private readonly OfferSelectionService _service;
    private readonly ApplicationService _applicationService;

    public OfferSelectionsController(OfferSelectionService service, ApplicationService applicationService)
    {
        _service = service;
        _applicationService = applicationService;
    }

    [HttpPost]
    public async Task<ActionResult<OfferSelectionResponse>> Create([FromBody] CreateOfferSelectionRequest request, CancellationToken ct)
    {
        if (OfferValidityPolicy.IsExpired(request.ValidUntil, DateTimeOffset.UtcNow))
            return BadRequest("Offer has expired.");

        var hasDetailed = request.Income is not null || request.LivingCosts is not null || request.Dependents is not null;
        if (hasDetailed)
        {
            if (request.Income is null || request.Income <= 0)
                return BadRequest("Income must be provided and positive.");

            if (request.LivingCosts is null || request.LivingCosts < 0)
                return BadRequest("LivingCosts must be provided and non-negative.");

            if (request.Dependents is null || request.Dependents < 0)
                return BadRequest("Dependents must be provided and non-negative.");
        }

        var selection = new OfferSelection
        {
            InquiryId = request.InquiryId,
            SelectedOffer = new OfferSnapshot(
                request.Provider,
                request.ProviderOfferId,
                request.Installment,
                request.Apr,
                request.TotalCost,
                request.Amount,
                request.DurationMonths,
                request.ValidUntil)
        };

        if (hasDetailed)
            selection.CaptureDetailedData(request.Income!.Value, request.LivingCosts!.Value, request.Dependents!.Value);

        var created = await _service.CreateAsync(selection, ct);
        return Ok(OfferSelectionResponse.From(created));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OfferSelectionResponse>> Get(Guid id, CancellationToken ct)
    {
        var selection = await _service.GetAsync(id, ct);
        if (selection is null)
            return NotFound();

        return Ok(OfferSelectionResponse.From(selection));
    }

    [HttpPost("{id:guid}/recalculate")]
    public async Task<ActionResult<OfferSelectionResponse>> Recalculate(
        Guid id,
        [FromBody] RecalculateOfferRequest request,
        CancellationToken ct)
    {
        if (request.Income <= 0)
            return BadRequest("Income must be positive.");

        if (request.LivingCosts < 0)
            return BadRequest("LivingCosts must be non-negative.");

        if (request.Dependents < 0)
            return BadRequest("Dependents must be non-negative.");

        var (selection, error) = await _service.RecalculateAsync(
            id,
            request.Income,
            request.LivingCosts,
            request.Dependents,
            ct);

        if (selection is null)
            return NotFound(error);

        return Ok(OfferSelectionResponse.From(selection));
    }

    [HttpPost("{id:guid}/apply")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Apply(
        Guid id,
        [FromBody] ApplyOfferSelectionRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ApplicantEmail))
            return BadRequest("ApplicantEmail is required.");

        if (string.IsNullOrWhiteSpace(request.FirstName))
            return BadRequest("FirstName is required.");

        if (string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest("LastName is required.");

        if (request.Age <= 0)
            return BadRequest("Age must be positive.");

        var (selection, offer, error) = await _service.PrepareForApplicationAsync(id, ct);
        if (selection is null)
            return NotFound();

        if (error is not null)
        {
            if (error.Contains("already applied", StringComparison.OrdinalIgnoreCase))
                return Conflict(error);

            return BadRequest(error);
        }

        var application = new LoanApplication
        {
            ApplicantEmail = request.ApplicantEmail,
            ApplicantDetails = new ApplicantDetails(
                request.FirstName,
                request.LastName,
                request.Age,
                request.JobTitle,
                request.Address,
                request.IdDocumentNumber,
                request.Phone,
                NormalizeDateTime(request.DateOfBirth),
                request.MonthlyIncome,
                request.LivingCosts,
                request.Dependents
            ),
            OfferSnapshot = offer!
        };

        var created = await _applicationService.CreateAsync(application, ct);
        await _service.MarkAppliedAsync(selection, created.Id, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(created));
    }

    public sealed record CreateOfferSelectionRequest(
        Guid InquiryId,
        string Provider,
        string ProviderOfferId,
        decimal Installment,
        decimal Apr,
        decimal TotalCost,
        decimal Amount,
        int DurationMonths,
        DateTimeOffset ValidUntil,
        decimal? Income,
        decimal? LivingCosts,
        int? Dependents);

    public sealed record RecalculateOfferRequest(
        decimal Income,
        decimal LivingCosts,
        int Dependents);

    public sealed record ApplyOfferSelectionRequest(
        string ApplicantEmail,
        string FirstName,
        string LastName,
        int Age,
        string JobTitle,
        string Address,
        string IdDocumentNumber,
        string? Phone,
        DateTime? DateOfBirth,
        decimal? MonthlyIncome,
        decimal? LivingCosts,
        int? Dependents);

    private static DateTime? NormalizeDateTime(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        var date = value.Value;
        return date.Kind switch
        {
            DateTimeKind.Utc => date,
            DateTimeKind.Local => date.ToUniversalTime(),
            _ => DateTime.SpecifyKind(date, DateTimeKind.Utc)
        };
    }

    public sealed record OfferSelectionResponse(
        Guid Id,
        Guid InquiryId,
        OfferSnapshot SelectedOffer,
        OfferSnapshot? RecalculatedOffer,
        decimal? Income,
        decimal? LivingCosts,
        int? Dependents,
        Guid? ApplicationId,
        DateTimeOffset? AppliedAt,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt)
    {
        public static OfferSelectionResponse From(OfferSelection selection)
            => new(
                selection.Id,
                selection.InquiryId,
                selection.SelectedOffer,
                selection.RecalculatedOffer,
                selection.Income,
                selection.LivingCosts,
                selection.Dependents,
                selection.ApplicationId,
                selection.AppliedAt,
                selection.CreatedAt,
                selection.UpdatedAt);
    }
}
