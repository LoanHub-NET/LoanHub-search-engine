using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Core.Services.Users;
using LoanHub.Search.Core.Models.Banks;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class UserServiceTests
{
    [Fact]
    public async Task RegisterLocalAsync_ThrowsWhenEmailExists()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        await service.RegisterLocalAsync(
            "jane@example.com",
            "Password1!",
            profile,
            UserRole.User,
            null,
            null,
            null,
            CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterLocalAsync(
                "jane@example.com",
                "Password1!",
                profile,
                UserRole.User,
                null,
                null,
                null,
                CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_ReturnsUserWhenPasswordMatches()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var user = await service.RegisterLocalAsync(
            "jane@example.com",
            "Password1!",
            profile,
            UserRole.User,
            null,
            null,
            null,
            CancellationToken.None);

        var result = await service.LoginAsync("jane@example.com", "Password1!", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(user.Id, result!.Id);
    }

    [Fact]
    public async Task RegisterExternalAsync_AddsIdentityToExistingUser()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var user = await service.RegisterLocalAsync(
            "jane@example.com",
            "Password1!",
            profile,
            UserRole.User,
            null,
            null,
            null,
            CancellationToken.None);

        var updated = await service.RegisterExternalAsync("google", "sub-123", "jane@example.com", profile, CancellationToken.None);

        Assert.Equal(user.Id, updated.Id);
        Assert.Single(updated.ExternalIdentities);
        Assert.Equal("google", updated.ExternalIdentities.First().Provider);
    }

    [Fact]
    public async Task RegisterExternalAsync_ThrowsWhenIdentityAlreadyExists()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        await service.RegisterExternalAsync("google", "sub-123", "jane@example.com", profile, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterExternalAsync("google", "sub-123", "jane@example.com", profile, CancellationToken.None));
    }

    [Fact]
    public async Task RegisterLocalAsync_AdminRequiresBankName()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterLocalAsync(
                "admin@example.com",
                "Password1!",
                profile,
                UserRole.Admin,
                null,
                "https://api.bank.test",
                "key",
                CancellationToken.None));

        Assert.Equal("Bank name is required for admin accounts.", exception.Message);
    }

    [Fact]
    public async Task RegisterLocalAsync_AdminRequiresApiEndpoint()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterLocalAsync(
                "admin@example.com",
                "Password1!",
                profile,
                UserRole.Admin,
                "BankOne",
                null,
                "key",
                CancellationToken.None));

        Assert.Equal("Bank API endpoint is required for admin accounts.", exception.Message);
    }

    [Fact]
    public async Task RegisterLocalAsync_AdminCreatesBankAndAssignsAdmin()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var user = await service.RegisterLocalAsync(
            "admin@example.com",
            "Password1!",
            profile,
            UserRole.Admin,
            "  Bank One  ",
            "  https://api.bank.test  ",
            "  api-key  ",
            CancellationToken.None);

        var bank = await bankRepository.GetByNameAsync("Bank One", CancellationToken.None);

        Assert.NotNull(bank);
        Assert.Equal("https://api.bank.test", bank!.ApiBaseUrl);
        Assert.Equal("api-key", bank.ApiKey);
        Assert.True(await bankRepository.IsAdminAsync(user.Id, CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_ReturnsNullWhenPasswordDoesNotMatch()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        await service.RegisterLocalAsync(
            "jane@example.com",
            "Password1!",
            profile,
            UserRole.User,
            null,
            null,
            null,
            CancellationToken.None);

        var result = await service.LoginAsync("jane@example.com", "WrongPassword!", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_PromotesUserToAdminWhenBankAdmin()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        var user = await service.RegisterLocalAsync(
            "jane@example.com",
            "Password1!",
            profile,
            UserRole.User,
            null,
            null,
            null,
            CancellationToken.None);

        var bank = await bankRepository.UpsertAsync(new Bank
        {
            Name = "Demo Bank",
            ApiBaseUrl = "https://api.bank.test",
            ApiKey = "key",
            CreatedByUserId = user.Id
        }, CancellationToken.None);
        await bankRepository.AddAdminAsync(bank.Id, user.Id, CancellationToken.None);

        var result = await service.LoginAsync("jane@example.com", "Password1!", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(UserRole.Admin, result!.Role);
    }

    [Fact]
    public async Task LoginExternalAsync_ReturnsUserWhenIdentityExists()
    {
        var repository = new InMemoryUserRepository();
        var bankRepository = new InMemoryBankRepository();
        var service = new UserService(repository, bankRepository);
        var profile = new UserService.UserProfile("Jane", "Doe", 30, "Engineer", "Main St", null, null, null, null, null, "ABC123");

        await service.RegisterExternalAsync("google", "sub-123", "jane@example.com", profile, CancellationToken.None);

        var result = await service.LoginExternalAsync("google", "sub-123", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("jane@example.com", result!.Email);
    }
}
