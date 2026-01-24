namespace LoanHub.Search.Core.Models.Applications;

public sealed record ApplicantDetails(
    string FirstName,
    string LastName,
    int Age,
    string JobTitle,
    string Address,
    string IdDocumentNumber
);
