namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class ApplicantDetailsEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string IdDocumentNumber { get; set; } = string.Empty;
}
