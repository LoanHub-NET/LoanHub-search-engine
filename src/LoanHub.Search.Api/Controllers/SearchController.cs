using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/search")]
public sealed class SearchController : ControllerBase
{
    private readonly OffersAggregator _agg;

    public SearchController(OffersAggregator agg) => _agg = agg;

    [HttpPost("quick")]
    public async Task<ActionResult<QuickSearchResponse>> Quick([FromBody] QuickSearchRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0 || req.DurationMonths <= 0)
            return BadRequest("Amount and DurationMonths must be positive.");

        var query = new OfferQuery(req.Amount, req.DurationMonths, null, null, null);
        var (offers, sources) = await _agg.GetOffersAsync(query, TimeSpan.FromSeconds(15), ct);

        return Ok(new QuickSearchResponse(Guid.NewGuid(), offers, sources));
    }

    public sealed record QuickSearchRequest(decimal Amount, int DurationMonths);

    public sealed record QuickSearchResponse(
        Guid InquiryId,
        IReadOnlyList<OfferDto> Offers,
        IReadOnlyList<ProviderCallResult> Sources
    );
    [HttpPost("detailed")]
    public async Task<ActionResult<DetailedSearchResponse>> Detailed([FromBody] DetailedSearchRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0 || req.DurationMonths <= 0)
            return BadRequest("Amount and DurationMonths must be positive.");

        if (req.Income is null || req.Income <= 0)
            return BadRequest("Income must be provided and positive.");

        if (req.LivingCosts is null || req.LivingCosts < 0)
            return BadRequest("LivingCosts must be provided and non-negative.");

        if (req.Dependents is null || req.Dependents < 0)
            return BadRequest("Dependents must be provided and non-negative.");

        var query = new OfferQuery(
            Amount: req.Amount,
            DurationMonths: req.DurationMonths,
            Income: req.Income,
            LivingCosts: req.LivingCosts,
            Dependents: req.Dependents
        );

        var (offers, sources) = await _agg.GetOffersAsync(query, TimeSpan.FromSeconds(15), ct);

        return Ok(new DetailedSearchResponse(Guid.NewGuid(), offers, sources));
    }

    public sealed record DetailedSearchRequest(
        decimal Amount,
        int DurationMonths,
        decimal? Income,
        decimal? LivingCosts,
        int? Dependents
    );

    public sealed record DetailedSearchResponse(
        Guid InquiryId,
        IReadOnlyList<OfferDto> Offers,
        IReadOnlyList<ProviderCallResult> Sources
    );

}
