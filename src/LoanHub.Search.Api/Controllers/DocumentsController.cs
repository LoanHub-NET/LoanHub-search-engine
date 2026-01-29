using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoanHub.Search.Api.Controllers;

/// <summary>
/// Controller for managing application documents (ID, proof of income, etc.)
/// </summary>
[ApiController]
[Route("api/applications/{applicationId:guid}/documents")]
public sealed class DocumentsController : ControllerBase
{
    private readonly IDocumentStorage _storage;
    private readonly IApplicationRepository _applicationRepository;

    public DocumentsController(IDocumentStorage storage, IApplicationRepository applicationRepository)
    {
        _storage = storage;
        _applicationRepository = applicationRepository;
    }

    /// <summary>
    /// Upload a document for an application (ID document, proof of income, etc.)
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB limit
    public async Task<ActionResult<DocumentUploadResponse>> Upload(
        Guid applicationId,
        [FromForm] DocumentUploadRequest request,
        CancellationToken ct)
    {
        // Verify application exists
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        if (request.File is null || request.File.Length == 0)
            return BadRequest("File is required.");

        // Validate file type
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest($"File type not allowed. Allowed types: {string.Join(", ", allowedExtensions)}");

        // Validate document type
        if (!Enum.TryParse<DocumentType>(request.DocumentType, true, out var documentType))
            return BadRequest($"Invalid document type. Valid types: {string.Join(", ", Enum.GetNames<DocumentType>())}");

        var side = DocumentSide.Unknown;
        if (!string.IsNullOrWhiteSpace(request.Side) &&
            !Enum.TryParse<DocumentSide>(request.Side, true, out side))
        {
            return BadRequest($"Invalid document side. Valid sides: {string.Join(", ", Enum.GetNames<DocumentSide>())}");
        }

        await using var stream = request.File.OpenReadStream();
        var document = await _storage.UploadDocumentAsync(
            applicationId,
            stream,
            request.File.FileName,
            request.File.ContentType,
            documentType,
            side,
            ct);

        return Ok(new DocumentUploadResponse(
            document.BlobName,
            document.OriginalFileName,
            document.ContentType,
            document.Type.ToString(),
            document.Side.ToString(),
            document.SizeBytes,
            document.UploadedAt
        ));
    }

    /// <summary>
    /// List documents for an application (user view)
    /// </summary>
    [HttpGet("user")]
    [Authorize(Policy = "UserOnly")]
    public async Task<ActionResult<IReadOnlyList<DocumentUploadResponse>>> ListForUser(
        Guid applicationId,
        CancellationToken ct)
    {
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        if (!IsApplicationOwnedByCurrentUser(application))
            return Forbid();

        var documents = await _storage.ListDocumentsAsync(applicationId, ct);
        var response = documents
            .Select(doc => new DocumentUploadResponse(
                doc.BlobName,
                doc.OriginalFileName,
                doc.ContentType,
                doc.Type.ToString(),
                doc.Side.ToString(),
                doc.SizeBytes,
                doc.UploadedAt))
            .ToList();

        return Ok(response);
    }

    /// <summary>
    /// Get a temporary download URL for a document (user view)
    /// </summary>
    [HttpGet("user/url")]
    [Authorize(Policy = "UserOnly")]
    public async Task<ActionResult<DocumentUrlResponse>> GetUrlForUser(
        Guid applicationId,
        [FromQuery] string blobName,
        [FromQuery] int validMinutes = 60,
        CancellationToken ct = default)
    {
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        if (!IsApplicationOwnedByCurrentUser(application))
            return Forbid();

        // Verify blob name belongs to this application
        if (!blobName.StartsWith(applicationId.ToString("N"), StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var url = await _storage.GetDocumentUrlAsync(
            blobName,
            TimeSpan.FromMinutes(Math.Min(validMinutes, 1440)),
            ct);

        if (url is null)
            return NotFound("Document not found.");

        return Ok(new DocumentUrlResponse(url, DateTimeOffset.UtcNow.AddMinutes(validMinutes)));
    }

    /// <summary>
    /// Clone documents from previous applications for reuse
    /// </summary>
    [HttpPost("clone")]
    [Authorize(Policy = "UserOnly")]
    public async Task<ActionResult<IReadOnlyList<DocumentUploadResponse>>> Clone(
        Guid applicationId,
        [FromBody] CloneDocumentsRequest request,
        CancellationToken ct)
    {
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        if (!IsApplicationOwnedByCurrentUser(application))
            return Forbid();

        if (request.BlobNames is null || request.BlobNames.Count == 0)
            return BadRequest("BlobNames are required.");

        var copied = await _storage.CopyDocumentsAsync(applicationId, request.BlobNames, ct);
        var response = copied
            .Select(doc => new DocumentUploadResponse(
                doc.BlobName,
                doc.OriginalFileName,
                doc.ContentType,
                doc.Type.ToString(),
                doc.Side.ToString(),
                doc.SizeBytes,
                doc.UploadedAt))
            .ToList();

        return Ok(response);
    }

    /// <summary>
    /// List documents for an application (admin verification)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<IReadOnlyList<DocumentUploadResponse>>> List(
        Guid applicationId,
        CancellationToken ct)
    {
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        var documents = await _storage.ListDocumentsAsync(applicationId, ct);
        var response = documents
            .Select(doc => new DocumentUploadResponse(
                doc.BlobName,
                doc.OriginalFileName,
                doc.ContentType,
                doc.Type.ToString(),
                doc.Side.ToString(),
                doc.SizeBytes,
                doc.UploadedAt))
            .ToList();

        return Ok(response);
    }

    /// <summary>
    /// Get a temporary download URL for a document
    /// </summary>
    [HttpGet("url")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<DocumentUrlResponse>> GetUrl(
        Guid applicationId,
        [FromQuery] string blobName,
        [FromQuery] int validMinutes = 60,
        CancellationToken ct = default)
    {
        // Verify application exists
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        // Verify blob name belongs to this application
        if (!blobName.StartsWith(applicationId.ToString("N"), StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var url = await _storage.GetDocumentUrlAsync(
            blobName,
            TimeSpan.FromMinutes(Math.Min(validMinutes, 1440)), // Max 24 hours
            ct);

        if (url is null)
            return NotFound("Document not found.");

        return Ok(new DocumentUrlResponse(url, DateTimeOffset.UtcNow.AddMinutes(validMinutes)));
    }

    /// <summary>
    /// Download a document directly
    /// </summary>
    [HttpGet("{*blobName}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Download(
        Guid applicationId,
        string blobName,
        CancellationToken ct)
    {
        // Verify application exists
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        // Verify blob name belongs to this application
        if (!blobName.StartsWith(applicationId.ToString("N"), StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var stream = await _storage.DownloadDocumentAsync(blobName, ct);
        if (stream is null)
            return NotFound("Document not found.");

        var contentType = GetContentType(blobName);
        var fileName = Path.GetFileName(blobName);
        
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// Delete a document
    /// </summary>
    [HttpDelete("{*blobName}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(
        Guid applicationId,
        string blobName,
        CancellationToken ct)
    {
        // Verify application exists
        var application = await _applicationRepository.GetAsync(applicationId, ct);
        if (application is null)
            return NotFound("Application not found.");

        // Verify blob name belongs to this application
        if (!blobName.StartsWith(applicationId.ToString("N"), StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var deleted = await _storage.DeleteDocumentAsync(blobName, ct);
        if (!deleted)
            return NotFound("Document not found.");

        return NoContent();
    }

    private static string GetContentType(string path)
    {
        var extension = Path.GetExtension(path).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

    public sealed record DocumentUploadRequest(IFormFile File, string DocumentType, string? Side);

    public sealed record CloneDocumentsRequest(IReadOnlyList<string> BlobNames);

    public sealed record DocumentUploadResponse(
        string BlobName,
        string OriginalFileName,
        string ContentType,
        string DocumentType,
        string DocumentSide,
        long SizeBytes,
        DateTimeOffset UploadedAt
    );

    public sealed record DocumentUrlResponse(string Url, DateTimeOffset ExpiresAt);

    private bool IsApplicationOwnedByCurrentUser(LoanApplication application)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                          User.FindFirstValue("sub");
        var emailClaim = User.FindFirstValue(ClaimTypes.Email) ??
                         User.FindFirstValue("email");

        if (application.UserId.HasValue && Guid.TryParse(userIdClaim, out var userId))
            return application.UserId.Value == userId;

        if (!string.IsNullOrWhiteSpace(emailClaim))
            return string.Equals(application.ApplicantEmail, emailClaim, StringComparison.OrdinalIgnoreCase);

        return false;
    }
}
