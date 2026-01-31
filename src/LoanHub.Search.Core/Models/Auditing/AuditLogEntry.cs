namespace LoanHub.Search.Core.Models.Auditing;

public sealed record AuditLogEntry
{
    public long Id { get; init; }
    public DateTimeOffset LoggedAt { get; init; }
    public string? Level { get; init; }
    public string? Message { get; init; }
    public string? Exception { get; init; }
    public string? RequestMethod { get; init; }
    public string? RequestPath { get; init; }
    public string? QueryString { get; init; }
    public int? StatusCode { get; init; }
    public int? ElapsedMs { get; init; }
    public string? RequestHeaders { get; init; }
    public string? ResponseHeaders { get; init; }
    public string? RequestBody { get; init; }
    public string? ResponseBody { get; init; }
    public string? UserId { get; init; }
    public string? UserEmail { get; init; }
    public string? ClientIp { get; init; }
    public string? UserAgent { get; init; }
    public string? TraceId { get; init; }
}
