FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY LoanHub.SearchEngine.sln ./
COPY src/LoanHub.Search.Api/LoanHub.Search.Api.csproj src/LoanHub.Search.Api/
COPY src/LoanHub.Search.Core/LoanHub.Search.Core.csproj src/LoanHub.Search.Core/
COPY src/LoanHub.Search.Infrastructure/LoanHub.Search.Infrastructure.csproj src/LoanHub.Search.Infrastructure/
RUN dotnet restore src/LoanHub.Search.Api/LoanHub.Search.Api.csproj

COPY src/ src/
RUN dotnet publish src/LoanHub.Search.Api/LoanHub.Search.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV EmailBranding__LogoPath=/app/assets/LoanHub_logo.png
EXPOSE 8080
COPY --from=build /app/publish ./
COPY src/LoanHub.Search.Web/public/LoanHub_logo.png /app/assets/LoanHub_logo.png
ENTRYPOINT ["dotnet", "LoanHub.Search.Api.dll"]
