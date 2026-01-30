namespace LoanHub.Search.Core.Services.Auditing;

using LoanHub.Search.Core.Abstractions.Auditing;
using LoanHub.Search.Core.Models.Auditing;
using LoanHub.Search.Core.Models.Pagination;

public sealed class AuditLogService
{
    private readonly IAuditLogRepository _repository;

    public AuditLogService(IAuditLogRepository repository) => _repository = repository;

    public Task<PagedResult<AuditLogEntry>> ListAsync(AuditLogQuery query, CancellationToken ct)
        => _repository.ListAsync(query.Normalize(), ct);
}
