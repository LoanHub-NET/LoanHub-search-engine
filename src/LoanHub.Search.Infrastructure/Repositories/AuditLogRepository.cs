namespace LoanHub.Search.Infrastructure.Repositories;

using System.Data;
using LoanHub.Search.Core.Abstractions.Auditing;
using LoanHub.Search.Core.Models.Auditing;
using LoanHub.Search.Core.Models.Pagination;
using Microsoft.EntityFrameworkCore;
using Npgsql;

public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly ApplicationDbContext _dbContext;

    public AuditLogRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task AddAsync(AuditLogEntry entry, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO audit_logs (
                logged_at, level, message, exception,
                request_method, request_path, query_string,
                status_code, elapsed_ms, request_headers, response_headers,
                request_body, response_body, user_id, user_email,
                client_ip, user_agent, trace_id
            ) VALUES (
                @logged_at, @level, @message, @exception,
                @request_method, @request_path, @query_string,
                @status_code, @elapsed_ms, @request_headers, @response_headers,
                @request_body, @response_body, @user_id, @user_email,
                @client_ip, @user_agent, @trace_id
            );
            """;

        var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("logged_at", entry.LoggedAt.UtcDateTime);
        command.Parameters.AddWithValue("level", (object?)entry.Level ?? DBNull.Value);
        command.Parameters.AddWithValue("message", (object?)entry.Message ?? DBNull.Value);
        command.Parameters.AddWithValue("exception", (object?)entry.Exception ?? DBNull.Value);
        command.Parameters.AddWithValue("request_method", (object?)entry.RequestMethod ?? DBNull.Value);
        command.Parameters.AddWithValue("request_path", (object?)entry.RequestPath ?? DBNull.Value);
        command.Parameters.AddWithValue("query_string", (object?)entry.QueryString ?? DBNull.Value);
        command.Parameters.AddWithValue("status_code", (object?)entry.StatusCode ?? DBNull.Value);
        command.Parameters.AddWithValue("elapsed_ms", (object?)entry.ElapsedMs ?? DBNull.Value);
        command.Parameters.AddWithValue("request_headers", (object?)entry.RequestHeaders ?? DBNull.Value);
        command.Parameters.AddWithValue("response_headers", (object?)entry.ResponseHeaders ?? DBNull.Value);
        command.Parameters.AddWithValue("request_body", (object?)entry.RequestBody ?? DBNull.Value);
        command.Parameters.AddWithValue("response_body", (object?)entry.ResponseBody ?? DBNull.Value);
        command.Parameters.AddWithValue("user_id", (object?)entry.UserId ?? DBNull.Value);
        command.Parameters.AddWithValue("user_email", (object?)entry.UserEmail ?? DBNull.Value);
        command.Parameters.AddWithValue("client_ip", (object?)entry.ClientIp ?? DBNull.Value);
        command.Parameters.AddWithValue("user_agent", (object?)entry.UserAgent ?? DBNull.Value);
        command.Parameters.AddWithValue("trace_id", (object?)entry.TraceId ?? DBNull.Value);

        await command.ExecuteNonQueryAsync(ct);

        if (shouldClose)
            await connection.CloseAsync();
    }

    public async Task<PagedResult<AuditLogEntry>> ListAsync(AuditLogQuery query, CancellationToken ct)
    {
        var normalized = query.Normalize();
        var conditions = new List<string>();
        var parameters = new List<(string Name, object? Value)>();

        if (normalized.From is not null)
        {
            conditions.Add("logged_at >= @from");
            parameters.Add(("from", normalized.From.Value));
        }

        if (normalized.To is not null)
        {
            conditions.Add("logged_at <= @to");
            parameters.Add(("to", normalized.To.Value));
        }

        if (!string.IsNullOrWhiteSpace(normalized.Method))
        {
            conditions.Add("request_method = @method");
            parameters.Add(("method", normalized.Method));
        }

        if (!string.IsNullOrWhiteSpace(normalized.Path))
        {
            conditions.Add("request_path ILIKE @path");
            parameters.Add(("path", $"%{normalized.Path}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalized.Email))
        {
            conditions.Add("user_email ILIKE @email");
            parameters.Add(("email", $"%{normalized.Email}%"));
        }

        if (normalized.StatusCode is not null)
        {
            conditions.Add("status_code = @status");
            parameters.Add(("status", normalized.StatusCode.Value));
        }

        var whereClause = conditions.Count > 0
            ? $"WHERE {string.Join(" AND ", conditions)}"
            : string.Empty;

        var countSql = $"SELECT COUNT(*) FROM audit_logs {whereClause};";
        var dataSql = $"""
            SELECT id, logged_at, level, message, exception,
                   request_method, request_path, query_string,
                   status_code, elapsed_ms, request_headers, response_headers,
                   request_body, response_body, user_id, user_email,
                   client_ip, user_agent, trace_id
            FROM audit_logs
            {whereClause}
            ORDER BY logged_at DESC
            OFFSET @offset LIMIT @limit;
            """;

        var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        int totalCount;
        await using (var countCommand = new NpgsqlCommand(countSql, connection))
        {
            AddParameters(countCommand, parameters);
            var result = await countCommand.ExecuteScalarAsync(ct);
            totalCount = result is null ? 0 : Convert.ToInt32(result);
        }

        var items = new List<AuditLogEntry>();
        await using (var dataCommand = new NpgsqlCommand(dataSql, connection))
        {
            AddParameters(dataCommand, parameters);
            dataCommand.Parameters.AddWithValue("offset", (normalized.Page - 1) * normalized.PageSize);
            dataCommand.Parameters.AddWithValue("limit", normalized.PageSize);

            await using var reader = await dataCommand.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var loggedAtValue = reader.GetDateTime(1);
                var loggedAt = loggedAtValue.Kind == DateTimeKind.Unspecified
                    ? new DateTimeOffset(DateTime.SpecifyKind(loggedAtValue, DateTimeKind.Utc))
                    : new DateTimeOffset(loggedAtValue);
                var entry = new AuditLogEntry
                {
                    Id = reader.GetInt64(0),
                    LoggedAt = loggedAt,
                    Level = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Message = reader.IsDBNull(3) ? null : reader.GetString(3),
                    Exception = reader.IsDBNull(4) ? null : reader.GetString(4),
                    RequestMethod = reader.IsDBNull(5) ? null : reader.GetString(5),
                    RequestPath = reader.IsDBNull(6) ? null : reader.GetString(6),
                    QueryString = reader.IsDBNull(7) ? null : reader.GetString(7),
                    StatusCode = reader.IsDBNull(8) ? null : reader.GetInt32(8),
                    ElapsedMs = reader.IsDBNull(9) ? null : reader.GetInt32(9),
                    RequestHeaders = reader.IsDBNull(10) ? null : reader.GetString(10),
                    ResponseHeaders = reader.IsDBNull(11) ? null : reader.GetString(11),
                    RequestBody = reader.IsDBNull(12) ? null : reader.GetString(12),
                    ResponseBody = reader.IsDBNull(13) ? null : reader.GetString(13),
                    UserId = reader.IsDBNull(14) ? null : reader.GetString(14),
                    UserEmail = reader.IsDBNull(15) ? null : reader.GetString(15),
                    ClientIp = reader.IsDBNull(16) ? null : reader.GetString(16),
                    UserAgent = reader.IsDBNull(17) ? null : reader.GetString(17),
                    TraceId = reader.IsDBNull(18) ? null : reader.GetString(18)
                };
                items.Add(entry);
            }
        }

        if (shouldClose)
            await connection.CloseAsync();

        return new PagedResult<AuditLogEntry>(items, normalized.Page, normalized.PageSize, totalCount);
    }

    private static void AddParameters(NpgsqlCommand command, IEnumerable<(string Name, object? Value)> parameters)
    {
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value ?? DBNull.Value);
        }
    }
}
