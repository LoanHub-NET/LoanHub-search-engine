namespace LoanHub.Search.Core.Models.Auditing;

public sealed record AuditLogQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    string? Method,
    string? Path,
    string? Email,
    int? StatusCode,
    int Page = 1,
    int PageSize = 50)
{
    public AuditLogQuery Normalize(int maxPageSize = 200)
    {
        var normalizedPage = Page < 1 ? 1 : Page;
        var normalizedPageSize = PageSize < 1 ? 50 : Math.Min(PageSize, maxPageSize);
        var normalizedMethod = string.IsNullOrWhiteSpace(Method) ? null : Method.Trim().ToUpperInvariant();
        var normalizedPath = string.IsNullOrWhiteSpace(Path) ? null : Path.Trim();
        var normalizedEmail = string.IsNullOrWhiteSpace(Email) ? null : Email.Trim();

        return this with
        {
            Page = normalizedPage,
            PageSize = normalizedPageSize,
            Method = normalizedMethod,
            Path = normalizedPath,
            Email = normalizedEmail
        };
    }
}
