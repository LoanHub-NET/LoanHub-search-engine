using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Services;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Infrastructure;
using LoanHub.Search.Infrastructure.Providers;
using LoanHub.Search.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ILoanOfferProvider, MockBankOfferProvider>();
builder.Services.AddSingleton<ILoanOfferProvider, MockBank2OfferProvider>();
builder.Services.AddSingleton<OffersAggregator>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Applications")));
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<ApplicationService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
