using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Core.Services.Users;
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
}
