using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Services;
using LoanHub.Search.Infrastructure.Providers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ILoanOfferProvider, MockBankOfferProvider>();
builder.Services.AddSingleton<ILoanOfferProvider, MockBank2OfferProvider>();
builder.Services.AddSingleton<OffersAggregator>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
