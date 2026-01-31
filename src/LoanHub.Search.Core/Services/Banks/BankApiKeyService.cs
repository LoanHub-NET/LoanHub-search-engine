using System.Security.Cryptography;
using System.Text;
using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Models.Banks;

namespace LoanHub.Search.Core.Services.Banks;

public sealed class BankApiKeyService
{
    private readonly IBankApiClientRepository _repository;

    public BankApiKeyService(IBankApiClientRepository repository)
    {
        _repository = repository;
    }

    public async Task<GeneratedApiKey> CreateAsync(string name, Guid? createdByUserId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.", nameof(name));

        var apiKey = GenerateKey();
        var client = new BankApiClient
        {
            Name = name.Trim(),
            KeyHash = HashKey(apiKey),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            IsActive = true
        };

        var saved = await _repository.AddAsync(client, ct);
        return new GeneratedApiKey(saved.Id, saved.Name, apiKey, saved.CreatedAt, saved.IsActive);
    }

    public Task<IReadOnlyList<BankApiClient>> ListAsync(CancellationToken ct)
        => _repository.ListAsync(ct);

    public async Task<BankApiClient?> RevokeAsync(Guid id, CancellationToken ct)
    {
        var client = await _repository.GetByIdAsync(id, ct);
        if (client is null)
            return null;

        if (!client.IsActive)
            return client;

        client.IsActive = false;
        return await _repository.UpdateAsync(client, ct);
    }

    public async Task<bool> ValidateAsync(string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        var hash = HashKey(apiKey);
        var client = await _repository.GetByKeyHashAsync(hash, ct);
        if (client is null || !client.IsActive)
            return false;

        client.LastUsedAt = DateTimeOffset.UtcNow;
        await _repository.UpdateAsync(client, ct);
        return true;
    }

    private static string GenerateKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    private static string HashKey(string apiKey)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToHexString(bytes);
    }

    public sealed record GeneratedApiKey(
        Guid Id,
        string Name,
        string ApiKey,
        DateTimeOffset CreatedAt,
        bool IsActive);
}
