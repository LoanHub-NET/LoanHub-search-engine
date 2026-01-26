namespace LoanHub.Search.Core.Services.Users;

using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Identity;

public sealed class UserService
{
    private readonly IUserRepository _repository;
    private readonly PasswordHasher<UserAccount> _hasher = new();

    public UserService(IUserRepository repository) => _repository = repository;

    public async Task<UserAccount> RegisterLocalAsync(
        string email,
        string password,
        UserProfile profile,
        CancellationToken ct)
    {
        if (await _repository.EmailExistsAsync(email, ct))
            throw new InvalidOperationException("Email already registered.");

        var user = new UserAccount
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

        user.PasswordHash = _hasher.HashPassword(user, password);
        return await _repository.AddAsync(user, ct);
    }

    public async Task<UserAccount?> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await _repository.GetByEmailAsync(email, ct);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
            return null;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result == PasswordVerificationResult.Success ? user : null;
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

        user.ExternalIdentities.Add(new ExternalIdentity
        {
            Provider = provider,
            Subject = subject,
            UserAccountId = user.Id
        });

        user.UpdatedAt = DateTimeOffset.UtcNow;
        return await _repository.UpdateAsync(user, ct) ?? user;
    }

    public Task<UserAccount?> LoginExternalAsync(string provider, string subject, CancellationToken ct)
        => _repository.GetByExternalIdentityAsync(provider, subject, ct);

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
