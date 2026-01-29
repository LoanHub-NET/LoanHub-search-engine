namespace LoanHub.Search.Core.Services.Users;

using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Models.Banks;
using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Identity;

public sealed class UserService
{
    private readonly IUserRepository _repository;
    private readonly IBankRepository _bankRepository;
    private readonly PasswordHasher<UserAccount> _hasher = new();

    public UserService(IUserRepository repository, IBankRepository bankRepository)
    {
        _repository = repository;
        _bankRepository = bankRepository;
    }

    public async Task<UserAccount> RegisterLocalAsync(
        string email,
        string password,
        UserProfile profile,
        UserRole role,
        string? bankName,
        string? bankApiEndpoint,
        string? bankApiKey,
        CancellationToken ct)
    {
        if (await _repository.EmailExistsAsync(email, ct))
            throw new InvalidOperationException("Email already registered.");

        if (role == UserRole.Admin)
        {
            if (string.IsNullOrWhiteSpace(bankName))
                throw new InvalidOperationException("Bank name is required for admin accounts.");

            if (string.IsNullOrWhiteSpace(bankApiEndpoint))
                throw new InvalidOperationException("Bank API endpoint is required for admin accounts.");
        }

        var user = new UserAccount
        {
            Email = email,
            Role = role,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Age = profile.Age,
            JobTitle = profile.JobTitle,
            Address = profile.Address,
            Phone = profile.Phone,
            DateOfBirth = NormalizeDateTime(profile.DateOfBirth),
            MonthlyIncome = profile.MonthlyIncome,
            LivingCosts = profile.LivingCosts,
            Dependents = profile.Dependents,
            IdDocumentNumber = profile.IdDocumentNumber,
            BankName = null,
            BankApiEndpoint = null,
            BankApiKey = null
        };

        user.PasswordHash = _hasher.HashPassword(user, password);
        var created = await _repository.AddAsync(user, ct);

        if (role == UserRole.Admin)
        {
            var bank = await _bankRepository.UpsertAsync(new Bank
            {
                Name = bankName?.Trim() ?? string.Empty,
                ApiBaseUrl = bankApiEndpoint?.Trim() ?? string.Empty,
                ApiKey = bankApiKey?.Trim(),
                CreatedByUserId = created.Id
            }, ct);

            await _bankRepository.AddAdminAsync(bank.Id, created.Id, ct);
        }

        return created;
    }

    public async Task<UserAccount?> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await _repository.GetByEmailAsync(email, ct);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
            return null;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result != PasswordVerificationResult.Success)
            return null;

        return await EnsureAdminRoleAsync(user, ct);
    }

    public async Task<UserAccount> RegisterExternalAsync(
        string provider,
        string subject,
        string email,
        UserProfile profile,
        CancellationToken ct)
    {
        if (await _repository.ExternalIdentityExistsAsync(provider, subject, ct))
            throw new InvalidOperationException("External identity already registered.");

        var user = await _repository.GetByEmailAsync(email, ct);
        if (user is null)
        {
            user = new UserAccount
            {
                Email = email,
                Role = UserRole.User,
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                Age = profile.Age,
                JobTitle = profile.JobTitle,
                Address = profile.Address,
                Phone = profile.Phone,
                DateOfBirth = NormalizeDateTime(profile.DateOfBirth),
                MonthlyIncome = profile.MonthlyIncome,
                LivingCosts = profile.LivingCosts,
                Dependents = profile.Dependents,
                IdDocumentNumber = profile.IdDocumentNumber
            };

            user = await _repository.AddAsync(user, ct);
        }

        return await _repository.AddExternalIdentityAsync(user.Id, provider, subject, ct) ?? user;
    }

    public async Task<UserAccount?> LoginExternalAsync(string provider, string subject, CancellationToken ct)
    {
        var user = await _repository.GetByExternalIdentityAsync(provider, subject, ct);
        if (user is null)
            return null;

        return await EnsureAdminRoleAsync(user, ct);
    }

    public Task<UserAccount?> GetAsync(Guid id, CancellationToken ct)
        => _repository.GetByIdAsync(id, ct);

    public Task<UserAccount?> GetByEmailAsync(string email, CancellationToken ct)
        => _repository.GetByEmailAsync(email, ct);

    public async Task<UserAccount?> UpdateProfileAsync(Guid id, UserProfile profile, CancellationToken ct)
    {
        var user = await _repository.GetByIdAsync(id, ct);
        if (user is null)
            return null;

        user.FirstName = profile.FirstName;
        user.LastName = profile.LastName;
        user.Age = profile.Age;
        user.JobTitle = profile.JobTitle;
        user.Address = profile.Address;
        user.Phone = profile.Phone;
        user.DateOfBirth = NormalizeDateTime(profile.DateOfBirth);
        user.MonthlyIncome = profile.MonthlyIncome;
        user.LivingCosts = profile.LivingCosts;
        user.Dependents = profile.Dependents;
        user.IdDocumentNumber = profile.IdDocumentNumber;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        return await _repository.UpdateAsync(user, ct);
    }

    private static DateTime? NormalizeDateTime(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        var date = value.Value;
        return date.Kind switch
        {
            DateTimeKind.Utc => date,
            DateTimeKind.Local => date.ToUniversalTime(),
            _ => DateTime.SpecifyKind(date, DateTimeKind.Utc)
        };
    }

    private async Task<UserAccount> EnsureAdminRoleAsync(UserAccount user, CancellationToken ct)
    {
        if (user.Role == UserRole.Admin)
            return user;

        if (!await _bankRepository.IsAdminAsync(user.Id, ct))
            return user;

        user.Role = UserRole.Admin;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        return await _repository.UpdateAsync(user, ct) ?? user;
    }

    public sealed record UserProfile(
        string? FirstName,
        string? LastName,
        int? Age,
        string? JobTitle,
        string? Address,
        string? Phone,
        DateTime? DateOfBirth,
        decimal? MonthlyIncome,
        decimal? LivingCosts,
        int? Dependents,
        string? IdDocumentNumber
    );
}
