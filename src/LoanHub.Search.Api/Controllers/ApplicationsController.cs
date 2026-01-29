using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Core.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoanHub.Search.Api.Controllers;

[ApiController]
[Route("api/applications")]
public sealed class ApplicationsController : ControllerBase
{
    private readonly ApplicationService _service;
    private readonly UserService _userService;

    public ApplicationsController(ApplicationService service, UserService userService)
    {
        _service = service;
        _userService = userService;
    }

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
                request.IdDocumentNumber,
                request.MonthlyIncome,
                request.LivingCosts,
                request.Dependents,
                request.Phone,
                NormalizeDateTime(request.DateOfBirth)
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

    [Authorize(Policy = "UserOnly")]
    [HttpPost("me")]
    public async Task<ActionResult<ApplicationResponse>> CreateForCurrentUser(
        [FromBody] CreateMyApplicationRequest request,
        CancellationToken ct)
    {
        if (OfferValidityPolicy.IsExpired(request.ValidUntil, DateTimeOffset.UtcNow))
            return BadRequest("Offer has expired.");

        var user = await GetCurrentUserAsync(ct);
        if (user is null)
            return Unauthorized();

        if (!TryBuildApplicantDetails(user, out var details, out var validationError))
            return BadRequest(validationError);

        var application = new LoanApplication
        {
            UserId = user.Id,
            ApplicantEmail = user.Email,
            ApplicantDetails = details!,
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

    [Authorize(Policy = "UserOnly")]
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<ApplicationResponse>>> ListForCurrentUser(
        [FromQuery] ApplicationStatus? status,
        [FromQuery] int days = 10,
        CancellationToken ct = default)
    {
        var user = await GetCurrentUserAsync(ct);
        if (user is null)
            return Unauthorized();

        var applications = await _service.ListRecentByUserIdAsync(user.Id, status, days, ct);
        var responses = applications
            .Select(ApplicationResponse.From)
            .ToList();

        return Ok(responses);
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

    [Authorize(Policy = "UserOnly")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApplicationResponse>> Cancel(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentUserAsync(ct);
        if (user is null)
            return Unauthorized();

        var application = await _service.GetAsync(id, ct);
        if (application is null)
            return NotFound();

        if (application.UserId.HasValue)
        {
            if (application.UserId != user.Id)
                return Forbid();
        }
        else if (!string.Equals(application.ApplicantEmail, user.Email, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _service.CancelAsync(application, ct);

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
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApplicationResponse>> UploadSignedContract(
        Guid id,
        [FromForm] SignedContractUploadRequest request,
        CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest("File is required.");

        await using var stream = request.File.OpenReadStream();
        var application = await _service.UploadSignedContractAsync(
            id,
            stream,
            request.File.FileName,
            request.File.ContentType,
            ct);
        if (application is null)
            return NotFound();

        return Ok(ApplicationResponse.From(application));
    }

    [HttpGet("{id:guid}/contract")]
    public async Task<IActionResult> GetContract(Guid id, CancellationToken ct)
    {
        var contract = await _service.GetPreliminaryContractDocumentAsync(id, ct);
        if (contract is null)
            return NotFound();

        return File(contract.Content, contract.ContentType, contract.FileName);
    }

    public sealed record CreateApplicationRequest(
        string ApplicantEmail,
        string FirstName,
        string LastName,
        int Age,
        string JobTitle,
        string Address,
        string IdDocumentNumber,
        decimal? MonthlyIncome,
        decimal? LivingCosts,
        int? Dependents,
        string? Phone,
        DateTime? DateOfBirth,
        string Provider,
        string ProviderOfferId,
        decimal Installment,
        decimal Apr,
        decimal TotalCost,
        decimal Amount,
        int DurationMonths,
        DateTimeOffset ValidUntil
    );

    public sealed record CreateMyApplicationRequest(
        string Provider,
        string ProviderOfferId,
        decimal Installment,
        decimal Apr,
        decimal TotalCost,
        decimal Amount,
        int DurationMonths,
        DateTimeOffset ValidUntil
    );

    public sealed record SignedContractUploadRequest(IFormFile File);

    public sealed record ApplicationResponse(
        Guid Id,
        Guid? UserId,
        Guid? BankId,
        Guid? AssignedAdminId,
        string ApplicantEmail,
        ApplicationStatus Status,
        string? RejectReason,
        DateTimeOffset? ContractReadyAt,
        string? SignedContractFileName,
        string? SignedContractBlobName,
        string? SignedContractContentType,
        DateTimeOffset? SignedContractReceivedAt,
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
                application.UserId,
                application.BankId,
                application.AssignedAdminId,
                application.ApplicantEmail,
                application.Status,
                application.RejectReason,
                application.ContractReadyAt,
                application.SignedContractFileName,
                application.SignedContractBlobName,
                application.SignedContractContentType,
                application.SignedContractReceivedAt,
                application.FinalApprovedAt,
                application.ApplicantDetails,
                application.OfferSnapshot,
                application.CreatedAt,
                application.UpdatedAt,
                application.StatusHistory
            );
    }

    private async Task<Core.Models.Users.UserAccount?> GetCurrentUserAsync(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is not null)
            return await _userService.GetAsync(userId.Value, ct);

        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
            return null;

        return await _userService.GetByEmailAsync(email, ct);
    }

    private Guid? GetUserId()
    {
        var subject = User.FindFirstValue("sub");
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }

    private static bool TryBuildApplicantDetails(
        Core.Models.Users.UserAccount user,
        out ApplicantDetails? details,
        out string? error)
    {
        details = null;
        error = null;

        if (string.IsNullOrWhiteSpace(user.FirstName))
            error = "FirstName is required for the current user.";
        else if (string.IsNullOrWhiteSpace(user.LastName))
            error = "LastName is required for the current user.";
        else if (!user.Age.HasValue || user.Age <= 0)
            error = "Age is required for the current user.";
        else if (string.IsNullOrWhiteSpace(user.JobTitle))
            error = "JobTitle is required for the current user.";
        else if (string.IsNullOrWhiteSpace(user.Address))
            error = "Address is required for the current user.";
        else if (string.IsNullOrWhiteSpace(user.IdDocumentNumber))
            error = "IdDocumentNumber is required for the current user.";

        if (error is not null)
            return false;

        details = new ApplicantDetails(
            user.FirstName!,
            user.LastName!,
            user.Age!.Value,
            user.JobTitle!,
            user.Address!,
            user.IdDocumentNumber!,
            user.MonthlyIncome,
            user.LivingCosts,
            user.Dependents,
            user.Phone,
            NormalizeDateTime(user.DateOfBirth));

        return true;
    }

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
}
