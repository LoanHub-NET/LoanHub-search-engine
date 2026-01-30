namespace LoanHub.Search.Api.Services;

using LoanHub.Search.Api.Options;
using LoanHub.Search.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

public sealed class AuditRetentionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AuditOptions _options;

    public AuditRetentionService(IServiceScopeFactory scopeFactory, IOptions<AuditOptions> options)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value ?? new AuditOptions();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _options.RetentionDays <= 0)
            return;

        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-_options.RetentionDays);
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync(
            "DELETE FROM audit_logs WHERE logged_at < {0}",
            new object[] { cutoff },
            ct);
    }
}
