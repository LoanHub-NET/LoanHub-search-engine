namespace LoanHub.Search.Api.Controllers.Admin;

using LoanHub.Search.Core.Models.Auditing;
using LoanHub.Search.Core.Services.Auditing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin/audits")]
[Authorize(Policy = "PlatformAdminOnly")]
public sealed class AuditLogsController : ControllerBase
{
    private readonly AuditLogService _service;

    public AuditLogsController(AuditLogService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<PagedResponse<AuditLogResponse>>> List(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? method,
        [FromQuery] string? path,
        [FromQuery] string? email,
        [FromQuery] int? statusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = new AuditLogQuery(
            from,
            to,
            method,
            path,
            email,
            statusCode,
            page,
            pageSize);

        var logs = await _service.ListAsync(query, ct);
        var responses = logs.Items.Select(AuditLogResponse.From).ToList();

        return Ok(new PagedResponse<AuditLogResponse>(
            responses,
            logs.Page,
            logs.PageSize,
            logs.TotalCount,
            logs.TotalPages));
    }

    public sealed record AuditLogResponse(
        long Id,
        DateTimeOffset LoggedAt,
        string? Level,
        string? Message,
        string? Exception,
        string? RequestMethod,
        string? RequestPath,
        string? QueryString,
        int? StatusCode,
        int? ElapsedMs,
        string? RequestHeaders,
        string? ResponseHeaders,
        string? RequestBody,
        string? ResponseBody,
        string? UserId,
        string? UserEmail,
        string? ClientIp,
        string? UserAgent,
        string? TraceId)
    {
        public static AuditLogResponse From(AuditLogEntry entry)
            => new(
                entry.Id,
                entry.LoggedAt,
                entry.Level,
                entry.Message,
                entry.Exception,
                entry.RequestMethod,
                entry.RequestPath,
                entry.QueryString,
                entry.StatusCode,
                entry.ElapsedMs,
                entry.RequestHeaders,
                entry.ResponseHeaders,
                entry.RequestBody,
                entry.ResponseBody,
                entry.UserId,
                entry.UserEmail,
                entry.ClientIp,
                entry.UserAgent,
                entry.TraceId);
    }

    public sealed record PagedResponse<T>(
        IReadOnlyList<T> Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);
}
