namespace LoanHub.Search.Core.Services.Applications;

using System.Globalization;
using System.Text;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;

public sealed class ContractDocumentGenerator : IContractDocumentGenerator
{
    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("pl-PL");

    public ContractDocument GeneratePreliminaryContract(LoanApplication application)
    {
        var builder = new StringBuilder();
        builder.AppendLine("LoanHub - Wstępny kontrakt");
        builder.AppendLine($"Id wniosku: {application.Id}");
        builder.AppendLine($"Data wygenerowania: {DateTimeOffset.UtcNow:O}");
        builder.AppendLine();
        builder.AppendLine("Dane wnioskodawcy:");
        builder.AppendLine($"Imię i nazwisko: {application.ApplicantDetails.FirstName} {application.ApplicantDetails.LastName}");
        builder.AppendLine($"Email: {application.ApplicantEmail}");
        builder.AppendLine($"Adres: {application.ApplicantDetails.Address}");
        builder.AppendLine($"Dowód osobisty: {application.ApplicantDetails.IdDocumentNumber}");
        builder.AppendLine();
        builder.AppendLine("Szczegóły oferty:");
        builder.AppendLine($"Provider: {application.OfferSnapshot.Provider}");
        builder.AppendLine($"Kwota: {application.OfferSnapshot.Amount.ToString("N2", Culture)}");
        builder.AppendLine($"Okres (mies.): {application.OfferSnapshot.DurationMonths}");
        builder.AppendLine($"Rata: {application.OfferSnapshot.Installment.ToString("N2", Culture)}");
        builder.AppendLine($"RRSO: {application.OfferSnapshot.Apr.ToString("N2", Culture)}%");
        builder.AppendLine($"Całkowity koszt: {application.OfferSnapshot.TotalCost.ToString("N2", Culture)}");
        builder.AppendLine();
        builder.AppendLine("Ten dokument ma charakter informacyjny i wymaga podpisu przez klienta.");

        var content = Encoding.UTF8.GetBytes(builder.ToString());
        var fileName = $"contract-{application.Id}.txt";
        return new ContractDocument(fileName, "text/plain", content);
    }
}
