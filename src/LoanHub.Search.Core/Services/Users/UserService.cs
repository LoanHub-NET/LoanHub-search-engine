namespace LoanHub.Search.Core.Services.Users;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using Microsoft.AspNetCore.Identity;
using System.Linq;

public sealed class UserService
{
    private readonly IUserRepository _repository;
    private readonly IApplicationRepository _applications;
    private readonly PasswordHasher<UserAccount> _hasher = new();

    public UserService(IUserRepository repository, IApplicationRepository applications)
    {
        _repository = repository;
        _applications = applications;
    }

    public async Task<UserAccount> RegisterLocalAsync(
        string email,
        string password,
        UserProfile profile,
        CancellationToken ct)
    {
        if (await _repository.EmailExistsAsync(email, ct))
            throw new InvalidOperationException("Email already registered.");

        var mergedProfile = await BuildProfileWithLatestApplicationAsync(profile, email, ct);

        var user = new UserAccount
        {
            Email = email,
            Role = UserRole.User,
            FirstName = mergedProfile.FirstName,
            LastName = mergedProfile.LastName,
            Age = mergedProfile.Age,
            JobTitle = mergedProfile.JobTitle,
            Address = mergedProfile.Address,
            Phone = mergedProfile.Phone,
            DateOfBirth = NormalizeDateTime(mergedProfile.DateOfBirth),
            MonthlyIncome = mergedProfile.MonthlyIncome,
            LivingCosts = mergedProfile.LivingCosts,
            Dependents = mergedProfile.Dependents,
            IdDocumentNumber = mergedProfile.IdDocumentNumber
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
            var mergedProfile = await BuildProfileWithLatestApplicationAsync(profile, email, ct);

            user = new UserAccount
            {
                Email = email,
                Role = UserRole.User,
                FirstName = mergedProfile.FirstName,
                LastName = mergedProfile.LastName,
                Age = mergedProfile.Age,
                JobTitle = mergedProfile.JobTitle,
                Address = mergedProfile.Address,
                Phone = mergedProfile.Phone,
                DateOfBirth = NormalizeDateTime(mergedProfile.DateOfBirth),
                MonthlyIncome = mergedProfile.MonthlyIncome,
                LivingCosts = mergedProfile.LivingCosts,
                Dependents = mergedProfile.Dependents,
                IdDocumentNumber = mergedProfile.IdDocumentNumber
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

    private async Task<UserProfile> BuildProfileWithLatestApplicationAsync(
        UserProfile profile,
        string email,
        CancellationToken ct)
    {
        if (!NeedsApplicationFallback(profile))
            return profile;

        var applications = await _applications.ListAsync(ct);
        var latest = applications
            .Where(app => app.ApplicantEmail.Equals(email, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(app => app.CreatedAt)
            .FirstOrDefault();

        if (latest is null)
            return profile;

        var details = latest.ApplicantDetails;

        return profile with
        {
            FirstName = string.IsNullOrWhiteSpace(profile.FirstName) ? details.FirstName : profile.FirstName,
            LastName = string.IsNullOrWhiteSpace(profile.LastName) ? details.LastName : profile.LastName,
            Age = profile.Age ?? details.Age,
            JobTitle = string.IsNullOrWhiteSpace(profile.JobTitle) ? details.JobTitle : profile.JobTitle,
            Address = string.IsNullOrWhiteSpace(profile.Address) ? details.Address : profile.Address,
            Phone = string.IsNullOrWhiteSpace(profile.Phone) ? details.Phone : profile.Phone,
            DateOfBirth = profile.DateOfBirth ?? details.DateOfBirth,
            MonthlyIncome = profile.MonthlyIncome ?? details.MonthlyIncome,
            LivingCosts = profile.LivingCosts ?? details.LivingCosts,
            Dependents = profile.Dependents ?? details.Dependents,
            IdDocumentNumber = string.IsNullOrWhiteSpace(profile.IdDocumentNumber)
                ? details.IdDocumentNumber
                : profile.IdDocumentNumber
        };
    }

    private static bool NeedsApplicationFallback(UserProfile profile)
        => string.IsNullOrWhiteSpace(profile.FirstName)
           || string.IsNullOrWhiteSpace(profile.LastName)
           || string.IsNullOrWhiteSpace(profile.JobTitle)
           || string.IsNullOrWhiteSpace(profile.Address)
           || string.IsNullOrWhiteSpace(profile.IdDocumentNumber)
           || string.IsNullOrWhiteSpace(profile.Phone)
           || profile.DateOfBirth is null
           || profile.MonthlyIncome is null
           || profile.LivingCosts is null
           || profile.Dependents is null;

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
