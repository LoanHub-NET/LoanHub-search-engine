using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Services.Selections;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/offer-selections")]
public sealed class OfferSelectionsController : ControllerBase
{
    private readonly OfferSelectionService _service;

    public OfferSelectionsController(OfferSelectionService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<OfferSelectionResponse>> Create([FromBody] CreateOfferSelectionRequest request, CancellationToken ct)
    {
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
                request.DurationMonths)
        };

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

    public sealed record CreateOfferSelectionRequest(
        Guid InquiryId,
        string Provider,
        string ProviderOfferId,
        decimal Installment,
        decimal Apr,
        decimal TotalCost,
        decimal Amount,
        int DurationMonths);

    public sealed record RecalculateOfferRequest(
        decimal Income,
        decimal LivingCosts,
        int Dependents);

    public sealed record OfferSelectionResponse(
        Guid Id,
        Guid InquiryId,
        OfferSnapshot SelectedOffer,
        OfferSnapshot? RecalculatedOffer,
        decimal? Income,
        decimal? LivingCosts,
        int? Dependents,
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
                selection.CreatedAt,
                selection.UpdatedAt);
    }
}
