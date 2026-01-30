namespace LoanHub.Search.Api.Middleware;

using System.Diagnostics;
using System.Net;
using System.Runtime.ExceptionServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using LoanHub.Search.Api.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Serilog;

public sealed class AuditLoggingMiddleware
{
    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization",
        "Cookie",
        "Set-Cookie",
        "X-Api-Key",
        "X-API-Key"
    };

    private static readonly string[] SensitiveKeys =
    {
        "password",
        "pass",
        "secret",
        "token",
        "apikey",
        "api_key",
        "authorization",
        "refresh_token",
        "access_token",
        "id_token",
        "client_secret"
    };

    private readonly RequestDelegate _next;
    private readonly AuditOptions _options;

    public AuditLoggingMiddleware(RequestDelegate next, IOptions<AuditOptions> options)
    {
        _next = next;
        _options = options.Value ?? new AuditOptions();
    }

    public async Task Invoke(HttpContext context)
    {
        if (!_options.Enabled)
        {
            await _next(context);
            return;
        }

        if (context.WebSockets.IsWebSocketRequest)
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var requestHeadersJson = SerializeHeaders(SanitizeHeaders(context.Request.Headers));
        var requestBody = await ReadRequestBodyAsync(context);
        var queryString = SanitizeQueryString(context.Request.Query);

        var originalBody = context.Response.Body;
        await using var responseBodyStream = new MemoryStream();
        context.Response.Body = responseBodyStream;

        Exception? failure = null;
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            failure = ex;
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            }
        }
        finally
        {
            stopwatch.Stop();
            var responseBody = await ReadResponseBodyAsync(context, responseBodyStream);
            var responseHeadersJson = SerializeHeaders(SanitizeHeaders(context.Response.Headers));

            responseBodyStream.Position = 0;
            await responseBodyStream.CopyToAsync(originalBody);
            context.Response.Body = originalBody;

            var auditLogger = Log.ForContext("IsAudit", true)
                .ForContext("RequestMethod", context.Request.Method)
                .ForContext("RequestPath", context.Request.Path.Value ?? string.Empty)
                .ForContext("QueryString", queryString)
                .ForContext("StatusCode", context.Response.StatusCode)
                .ForContext("ElapsedMs", (int)stopwatch.ElapsedMilliseconds)
                .ForContext("RequestHeaders", requestHeadersJson)
                .ForContext("ResponseHeaders", responseHeadersJson)
                .ForContext("RequestBody", requestBody)
                .ForContext("ResponseBody", responseBody)
                .ForContext("UserId", GetUserId(context))
                .ForContext("UserEmail", GetUserEmail(context))
                .ForContext("ClientIp", context.Connection.RemoteIpAddress?.ToString())
                .ForContext("UserAgent", context.Request.Headers["User-Agent"].ToString())
                .ForContext("TraceId", Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier);

            if (failure is null)
            {
                auditLogger.Information(
                    "Audit {RequestMethod} {RequestPath} responded {StatusCode} in {ElapsedMs} ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
            else
            {
                auditLogger.Error(
                    failure,
                    "Audit {RequestMethod} {RequestPath} failed with {StatusCode} in {ElapsedMs} ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
        }

        if (failure is not null)
        {
            ExceptionDispatchInfo.Capture(failure).Throw();
        }
    }

    private async Task<string?> ReadRequestBodyAsync(HttpContext context)
    {
        if (context.Request.Body is null)
            return null;

        if (!IsTextBasedContent(context.Request.ContentType))
            return context.Request.ContentLength > 0 ? "[binary content omitted]" : null;

        context.Request.EnableBuffering();
        context.Request.Body.Position = 0;
        var (body, truncated) = await ReadStreamAsync(context.Request.Body, _options.MaxBodySizeBytes);
        context.Request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(body))
            return null;

        var sanitized = SanitizeBody(body, context.Request.ContentType);
        return truncated ? $"{sanitized}\n...[truncated]" : sanitized;
    }

    private async Task<string?> ReadResponseBodyAsync(HttpContext context, MemoryStream responseBodyStream)
    {
        if (!IsTextBasedContent(context.Response.ContentType))
            return responseBodyStream.Length > 0 ? "[binary content omitted]" : null;

        responseBodyStream.Position = 0;
        var (body, truncated) = await ReadStreamAsync(responseBodyStream, _options.MaxBodySizeBytes);
        if (string.IsNullOrWhiteSpace(body))
            return null;

        var sanitized = SanitizeBody(body, context.Response.ContentType);
        return truncated ? $"{sanitized}\n...[truncated]" : sanitized;
    }

    private static async Task<(string? Body, bool Truncated)> ReadStreamAsync(Stream stream, int maxBytes)
    {
        var buffer = new byte[4096];
        var totalRead = 0;
        var truncated = false;
        await using var ms = new MemoryStream();

        while (true)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length));
            if (read == 0)
                break;

            var remaining = maxBytes - totalRead;
            if (remaining <= 0)
            {
                truncated = true;
                break;
            }

            var toWrite = Math.Min(read, remaining);
            await ms.WriteAsync(buffer.AsMemory(0, toWrite));
            totalRead += toWrite;

            if (toWrite < read)
            {
                truncated = true;
                break;
            }
        }

        if (ms.Length == 0)
            return (null, truncated);

        return (Encoding.UTF8.GetString(ms.ToArray()), truncated);
    }

    private static Dictionary<string, string> SanitizeHeaders(IHeaderDictionary headers)
    {
        var sanitized = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in headers)
        {
            var value = SensitiveHeaders.Contains(header.Key)
                ? "[REDACTED]"
                : string.Join(", ", header.Value.ToArray());
            sanitized[header.Key] = value;
        }
        return sanitized;
    }

    private static string? SerializeHeaders(Dictionary<string, string> headers)
        => headers.Count == 0 ? null : JsonSerializer.Serialize(headers);

    private static string SanitizeQueryString(IQueryCollection query)
    {
        if (query.Count == 0)
            return string.Empty;

        var parts = new List<string>(query.Count);
        foreach (var item in query)
        {
            var key = item.Key;
            var value = IsSensitiveKey(key) ? "[REDACTED]" : item.Value.ToString();
            parts.Add($"{WebUtility.UrlEncode(key)}={WebUtility.UrlEncode(value)}");
        }
        return $"?{string.Join("&", parts)}";
    }

    private static string SanitizeBody(string body, string? contentType)
    {
        if (string.IsNullOrWhiteSpace(body))
            return body;

        if (contentType?.Contains("json", StringComparison.OrdinalIgnoreCase) == true)
        {
            var redacted = RedactJson(body);
            return string.IsNullOrWhiteSpace(redacted) ? body : redacted;
        }

        return body;
    }

    private static string? RedactJson(string body)
    {
        try
        {
            var node = JsonNode.Parse(body);
            if (node is null)
                return null;

            RedactNode(node);
            return node.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        }
        catch
        {
            return body;
        }
    }

    private static void RedactNode(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            foreach (var (key, value) in obj.ToList())
            {
                if (IsSensitiveKey(key))
                {
                    obj[key] = "***";
                }
                else if (value is not null)
                {
                    RedactNode(value);
                }
            }
            return;
        }

        if (node is JsonArray array)
        {
            foreach (var item in array)
            {
                if (item is not null)
                    RedactNode(item);
            }
        }
    }

    private static bool IsSensitiveKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return false;

        var normalized = key.Replace("-", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("_", string.Empty, StringComparison.OrdinalIgnoreCase)
            .ToLowerInvariant();

        return SensitiveKeys.Any(s => normalized.Contains(s.Replace("_", string.Empty, StringComparison.OrdinalIgnoreCase), StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsTextBasedContent(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
            return false;

        return contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase)
            || contentType.Contains("text/", StringComparison.OrdinalIgnoreCase)
            || contentType.Contains("application/xml", StringComparison.OrdinalIgnoreCase)
            || contentType.Contains("application/x-www-form-urlencoded", StringComparison.OrdinalIgnoreCase)
            || contentType.Contains("application/graphql", StringComparison.OrdinalIgnoreCase);
    }

    private static string? GetUserId(HttpContext context)
        => context.User.FindFirst("sub")?.Value ?? context.User.FindFirst("uid")?.Value;

    private static string? GetUserEmail(HttpContext context)
        => context.User.FindFirst("email")?.Value ?? context.User.FindFirst("preferred_username")?.Value;
}
