using System.ComponentModel.DataAnnotations;
using LoanHub.Search.Core.Services.Banks;
using Microsoft.AspNetCore.Mvc;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("[controller]")]
public sealed class BankOffersController : ControllerBase
{
    private static readonly Guid BankId = Guid.Parse("2f3a7b9a-3a1f-4a02-9d56-6b2b9f7c2b11");
    private static readonly string BankName = "LoanHub Demo Bank";
    private readonly BankApiKeyService _apiKeyService;

    public BankOffersController(BankApiKeyService apiKeyService)
    {
        _apiKeyService = apiKeyService;
    }

    /// <summary>
    /// Returns loan offers for the provided parameters.
    /// </summary>
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(typeof(IReadOnlyList<BankOfferResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<BankOfferResponse>>> Get(
        [FromHeader(Name = "X-Api-Key"), Required] string? apiKey,
        [FromQuery, Range(1, double.MaxValue)] decimal amount,
        [FromQuery, Range(1, 480)] int durationInMonths,
        [FromQuery(Name = "durationMonths")] int? durationMonths,
        [FromQuery, Range(0, double.MaxValue)] decimal? income,
        [FromQuery, Range(0, double.MaxValue)] decimal? livingCosts,
        [FromQuery, Range(0, int.MaxValue)] int? dependents,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return Unauthorized("X-Api-Key header is required.");

        if (!await _apiKeyService.ValidateAsync(apiKey, ct))
            return Unauthorized("Invalid API key.");

        if (durationInMonths <= 0 && durationMonths.HasValue)
            durationInMonths = durationMonths.Value;

        if (amount <= 0 || durationInMonths <= 0)
            return BadRequest("amount and durationInMonths must be positive.");

        var now = DateTimeOffset.UtcNow;
        var rate = CalculateInterestRate(amount, durationInMonths, income, livingCosts, dependents);

        var offers = new[]
        {
            new BankOfferResponse(
                Guid.NewGuid(),
                BankId,
                new BankSummary(BankId, BankName),
                amount,
                rate,
                durationInMonths,
                true,
                now,
                now,
                null)
        };

        return Ok(offers);
    }

    private static decimal CalculateInterestRate(
        decimal amount,
        int durationMonths,
        decimal? income,
        decimal? livingCosts,
        int? dependents)
    {
        var rate = 9.5m;

        if (durationMonths > 36)
            rate += 1.2m;
        else if (durationMonths > 24)
            rate += 0.6m;

        if (amount > 50000m)
            rate += 0.6m;
        else if (amount < 10000m)
            rate -= 0.3m;

        if (income.HasValue)
        {
            if (income.Value >= 8000m)
                rate -= 1.0m;
            else if (income.Value <= 3000m)
                rate += 1.0m;
        }

        if (livingCosts.HasValue)
        {
            if (livingCosts.Value >= 3000m)
                rate += 0.5m;
            else if (livingCosts.Value <= 1000m)
                rate -= 0.2m;
        }

        if (dependents.HasValue && dependents.Value > 0)
            rate += Math.Min(dependents.Value, 6) * 0.15m;

        return decimal.Round(Math.Clamp(rate, 3.0m, 22.0m), 2);
    }

    public sealed record BankSummary(Guid Id, string Name);

    public sealed record BankOfferResponse(
        Guid Id,
        Guid BankId,
        BankSummary Bank,
        decimal Amount,
        decimal InterestRate,
        int DurationInMonths,
        bool IsActive,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt,
        Guid? CreatedByUserId);
}
