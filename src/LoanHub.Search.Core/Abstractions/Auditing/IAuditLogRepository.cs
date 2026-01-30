namespace LoanHub.Search.Core.Abstractions.Auditing;

using LoanHub.Search.Core.Models.Auditing;
using LoanHub.Search.Core.Models.Pagination;

public interface IAuditLogRepository
{
    Task<PagedResult<AuditLogEntry>> ListAsync(AuditLogQuery query, CancellationToken ct);
}
