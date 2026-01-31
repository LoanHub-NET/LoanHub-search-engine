using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Core.Services.Users;
using LoanHub.Search.Core.Abstractions.Banks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Security.Claims;

namespace LoanHub.Search.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/applications")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminApplicationsController : ControllerBase
{
    private readonly ApplicationService _service;
    private readonly UserService _userService;
    private readonly IBankRepository _bankRepository;

    public AdminApplicationsController(
        ApplicationService service,
        UserService userService,
        IBankRepository bankRepository)
    {
        _service = service;
        _userService = userService;
        _bankRepository = bankRepository;
    }

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
        var adminId = GetAdminId();
        if (!adminId.HasValue)
            return Forbid();

        var bankIds = await _bankRepository.GetBankIdsForAdminAsync(adminId.Value, ct);
        var query = new ApplicationAdminQuery(
            applicantEmail,
            status,
            provider,
            createdFrom,
            createdTo,
            updatedFrom,
            updatedTo,
            bankIds,
            page,
            pageSize);

        var applications = await _service.ListAdminAsync(query, ct);
        var adminSummaries = await LoadAssignedAdminsAsync(applications.Items, ct);
        var responses = applications.Items
            .Select(application => ApplicationsController.ApplicationResponse.From(
                application,
                TryGetAdminSummary(application, adminSummaries)))
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

        if (!await CanAccessAsync(application, ct))
            return Forbid();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Accept(Guid id, CancellationToken ct)
    {
        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.AcceptAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/preliminary-accept")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> PreliminarilyAccept(Guid id, CancellationToken ct)
    {
        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.PreliminarilyAcceptAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/grant")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Grant(Guid id, CancellationToken ct)
    {
        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.GrantAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/contract-ready")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> ContractReady(Guid id, CancellationToken ct)
    {
        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.MarkContractReadyAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/contract")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> UploadContract(
        Guid id,
        [FromForm] ContractUploadRequest request,
        CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest("File is required.");

        var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (extension != ".pdf")
            return BadRequest("Only PDF contracts are supported.");

        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        await using var stream = request.File.OpenReadStream();
        var application = await _service.UploadContractAsync(
            id,
            stream,
            request.File.FileName,
            request.File.ContentType,
            GetAdminId(),
            ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/final-approve")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> FinalApprove(Guid id, CancellationToken ct)
    {
        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.FinalApproveAsync(id, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ApplicationsController.ApplicationResponse>> Reject(Guid id, [FromBody] RejectRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest("Reason is required.");

        var existing = await _service.GetAsync(id, ct);
        if (existing is null)
            return NotFound();

        if (!await CanAccessAsync(existing, ct))
            return Forbid();

        var application = await _service.RejectAsync(id, request.Reason, GetAdminId(), ct);
        if (application is null)
            return NotFound();

        var adminSummary = await GetAssignedAdminSummaryAsync(application.AssignedAdminId, ct);
        return Ok(ApplicationsController.ApplicationResponse.From(application, adminSummary));
    }

    public sealed record RejectRequest(string Reason);

    public sealed record ContractUploadRequest(IFormFile File);

    public sealed record PagedResponse<T>(
        IReadOnlyList<T> Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

    private Guid? GetAdminId()
    {
        var subject = User.FindFirstValue("sub")
                      ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }

    private async Task<ApplicationsController.AssignedAdminSummary?> GetAssignedAdminSummaryAsync(
        Guid? adminId,
        CancellationToken ct)
    {
        if (!adminId.HasValue)
            return null;

        var admin = await _userService.GetAsync(adminId.Value, ct);
        return admin is null ? null : ApplicationsController.AssignedAdminSummary.From(admin);
    }

    private async Task<IReadOnlyDictionary<Guid, ApplicationsController.AssignedAdminSummary>> LoadAssignedAdminsAsync(
        IEnumerable<LoanApplication> applications,
        CancellationToken ct)
    {
        var adminIds = applications
            .Where(application => application.AssignedAdminId.HasValue)
            .Select(application => application.AssignedAdminId!.Value)
            .Distinct()
            .ToList();

        if (adminIds.Count == 0)
            return new Dictionary<Guid, ApplicationsController.AssignedAdminSummary>();

        var admins = await _userService.GetByIdsAsync(adminIds, ct);
        return admins.ToDictionary(admin => admin.Id, ApplicationsController.AssignedAdminSummary.From);
    }

    private static ApplicationsController.AssignedAdminSummary? TryGetAdminSummary(
        LoanApplication application,
        IReadOnlyDictionary<Guid, ApplicationsController.AssignedAdminSummary> summaries)
    {
        if (!application.AssignedAdminId.HasValue)
            return null;

        return summaries.TryGetValue(application.AssignedAdminId.Value, out var summary)
            ? summary
            : null;
    }

    private async Task<bool> CanAccessAsync(LoanApplication application, CancellationToken ct)
    {
        var adminId = GetAdminId();
        if (!adminId.HasValue)
            return false;

        var bankIds = await _bankRepository.GetBankIdsForAdminAsync(adminId.Value, ct);
        if (bankIds.Count == 0 || !application.BankId.HasValue)
            return false;

        return bankIds.Contains(application.BankId.Value);
    }
}
