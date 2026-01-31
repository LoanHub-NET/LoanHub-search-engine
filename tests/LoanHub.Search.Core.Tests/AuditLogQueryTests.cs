using LoanHub.Search.Core.Models.Auditing;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class AuditLogQueryTests
{
    [Fact]
    public void Normalize_TrimsAndNormalizesFields()
    {
        var query = new AuditLogQuery(
            From: null,
            To: null,
            Method: "  post ",
            Path: "  /api/users  ",
            Email: "  test@example.com  ",
            StatusCode: 200,
            Page: 0,
            PageSize: 0);

        var normalized = query.Normalize();

        Assert.Equal(1, normalized.Page);
        Assert.Equal(50, normalized.PageSize);
        Assert.Equal("POST", normalized.Method);
        Assert.Equal("/api/users", normalized.Path);
        Assert.Equal("test@example.com", normalized.Email);
    }

    [Fact]
    public void Normalize_ClampsPageSize()
    {
        var query = new AuditLogQuery(
            From: null,
            To: null,
            Method: null,
            Path: null,
            Email: null,
            StatusCode: null,
            Page: 2,
            PageSize: 500);

        var normalized = query.Normalize(100);

        Assert.Equal(2, normalized.Page);
        Assert.Equal(100, normalized.PageSize);
    }
}