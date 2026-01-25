using System.Net;
using System.Net.Http.Json;
using LoanHub.Search.Api.Controllers;
using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Services.Users;
using Xunit;

namespace LoanHub.Search.Api.Tests;

public sealed class EndpointsTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;

    public EndpointsTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task QuickSearch_ReturnsOffers()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/search/quick",
            new SearchController.QuickSearchRequest(10000m, 12));

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<SearchController.QuickSearchResponse>();

        Assert.NotNull(payload);
        Assert.NotEqual(Guid.Empty, payload!.InquiryId);
        Assert.NotEmpty(payload.Offers);
        Assert.Contains(payload.Offers, offer => offer.Provider == "MockBank1");
        Assert.NotEmpty(payload.Sources);
    }

    [Fact]
    public async Task DetailedSearch_RequiresIncome()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/search/detailed",
            new SearchController.DetailedSearchRequest(15000m, 24, null, 500m, 1));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Applications_CreateAndFetch()
    {
        var createResponse = await _client.PostAsJsonAsync(
            "/api/applications",
            new ApplicationsController.CreateApplicationRequest(
                "applicant@example.com",
                "Jane",
                "Doe",
                29,
                "Engineer",
                "Main Street",
                "DOC123",
                "MockBank1",
                "OFFER-1",
                300m,
                0.1m,
                3600m,
                5000m,
                12));

        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApplicationsController.ApplicationResponse>();

        Assert.NotNull(created);
        Assert.Equal("applicant@example.com", created!.ApplicantEmail);

        var getResponse = await _client.GetAsync($"/api/applications/{created.Id}");

        getResponse.EnsureSuccessStatusCode();
        var fetched = await getResponse.Content.ReadFromJsonAsync<ApplicationsController.ApplicationResponse>();

        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched!.Id);
    }

    [Fact]
    public async Task OfferSelections_CreateAndRecalculate()
    {
        var createResponse = await _client.PostAsJsonAsync(
            "/api/offer-selections",
            new OfferSelectionsController.CreateOfferSelectionRequest(
                Guid.NewGuid(),
                "MockBank1",
                "OFFER-2",
                250m,
                0.08m,
                3000m,
                4000m,
                12));

        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<OfferSelectionsController.OfferSelectionResponse>();

        Assert.NotNull(created);

        var recalcResponse = await _client.PostAsJsonAsync(
            $"/api/offer-selections/{created!.Id}/recalculate",
            new OfferSelectionsController.RecalculateOfferRequest(5000m, 1500m, 1));

        recalcResponse.EnsureSuccessStatusCode();
        var recalculated = await recalcResponse.Content.ReadFromJsonAsync<OfferSelectionsController.OfferSelectionResponse>();

        Assert.NotNull(recalculated);
        Assert.Equal(5000m, recalculated!.Income);
    }

    [Fact]
    public async Task Users_RegisterAndLogin()
    {
        var email = $"user-{Guid.NewGuid():N}@example.com";
        var profile = new UserService.UserProfile("Sam", "Smith", 32, "Analyst", "Street 1", "DOC-77");

        var registerResponse = await _client.PostAsJsonAsync(
            "/api/users/register",
            new UsersController.RegisterRequest(email, "Pass1234!", profile));

        registerResponse.EnsureSuccessStatusCode();
        var registered = await registerResponse.Content.ReadFromJsonAsync<UsersController.AuthResponse>();

        Assert.NotNull(registered);
        Assert.Equal(email, registered!.Email);
        Assert.False(string.IsNullOrWhiteSpace(registered.Token));

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/users/login",
            new UsersController.LoginRequest(email, "Pass1234!"));

        loginResponse.EnsureSuccessStatusCode();
        var loggedIn = await loginResponse.Content.ReadFromJsonAsync<UsersController.AuthResponse>();

        Assert.NotNull(loggedIn);
        Assert.False(string.IsNullOrWhiteSpace(loggedIn!.Token));
    }
}
