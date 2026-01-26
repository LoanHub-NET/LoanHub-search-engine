namespace LoanHub.Search.Infrastructure.Persistence.Mapping;

using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Infrastructure.Persistence.Entities;

public static class EntityMapping
{
    public static LoanApplicationEntity ToEntity(this LoanApplication model)
        => new()
        {
            Id = model.Id,
            UserId = model.UserId,
            ApplicantEmail = model.ApplicantEmail,
            ApplicantDetails = model.ApplicantDetails.ToEntity(),
            OfferSnapshot = model.OfferSnapshot.ToEntity(),
            Status = (int)model.Status,
            RejectReason = model.RejectReason,
            ContractReadyAt = model.ContractReadyAt,
            SignedContractFileName = model.SignedContractFileName,
            SignedContractBlobName = model.SignedContractBlobName,
            SignedContractContentType = model.SignedContractContentType,
            SignedContractReceivedAt = model.SignedContractReceivedAt,
            FinalApprovedAt = model.FinalApprovedAt,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt,
            StatusHistory = model.StatusHistory.Select(entry => entry.ToEntity(model.Id)).ToList()
        };

    public static LoanApplication ToModel(this LoanApplicationEntity entity)
    {
        var model = new LoanApplication
        {
            Id = entity.Id,
            UserId = entity.UserId,
            ApplicantEmail = entity.ApplicantEmail,
            ApplicantDetails = entity.ApplicantDetails.ToModel(),
            OfferSnapshot = entity.OfferSnapshot.ToModel(),
            Status = (ApplicationStatus)entity.Status,
            RejectReason = entity.RejectReason,
            ContractReadyAt = entity.ContractReadyAt,
            SignedContractFileName = entity.SignedContractFileName,
            SignedContractBlobName = entity.SignedContractBlobName,
            SignedContractContentType = entity.SignedContractContentType,
            SignedContractReceivedAt = entity.SignedContractReceivedAt,
            FinalApprovedAt = entity.FinalApprovedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        foreach (var history in entity.StatusHistory)
        {
            model.StatusHistory.Add(history.ToModel());
        }

        return model;
    }

    public static OfferSelectionEntity ToEntity(this OfferSelection model)
        => new()
        {
            Id = model.Id,
            InquiryId = model.InquiryId,
            SelectedOffer = model.SelectedOffer.ToEntity(),
            RecalculatedOffer = model.RecalculatedOffer?.ToEntity(),
            Income = model.Income,
            LivingCosts = model.LivingCosts,
            Dependents = model.Dependents,
            ApplicationId = model.ApplicationId,
            AppliedAt = model.AppliedAt,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt
        };

    public static OfferSelection ToModel(this OfferSelectionEntity entity)
        => new()
        {
            Id = entity.Id,
            InquiryId = entity.InquiryId,
            SelectedOffer = entity.SelectedOffer.ToModel(),
            RecalculatedOffer = entity.RecalculatedOffer?.ToModel(),
            Income = entity.Income,
            LivingCosts = entity.LivingCosts,
            Dependents = entity.Dependents,
            ApplicationId = entity.ApplicationId,
            AppliedAt = entity.AppliedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

    public static UserAccountEntity ToEntity(this UserAccount model)
        => new()
        {
            Id = model.Id,
            Email = model.Email,
            PasswordHash = model.PasswordHash,
            Role = (int)model.Role,
            FirstName = model.FirstName,
            LastName = model.LastName,
            Age = model.Age,
            JobTitle = model.JobTitle,
            Address = model.Address,
            IdDocumentNumber = model.IdDocumentNumber,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt,
            ExternalIdentities = model.ExternalIdentities.Select(identity => identity.ToEntity(model.Id)).ToList()
        };

    public static UserAccount ToModel(this UserAccountEntity entity)
    {
        var model = new UserAccount
        {
            Id = entity.Id,
            Email = entity.Email,
            PasswordHash = entity.PasswordHash,
            Role = (UserRole)entity.Role,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            Age = entity.Age,
            JobTitle = entity.JobTitle,
            Address = entity.Address,
            IdDocumentNumber = entity.IdDocumentNumber,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        foreach (var identity in entity.ExternalIdentities)
        {
            model.ExternalIdentities.Add(identity.ToModel());
        }

        return model;
    }

    public static ExternalIdentityEntity ToEntity(this ExternalIdentity model, Guid userAccountId)
        => new()
        {
            Id = model.Id,
            UserAccountId = userAccountId,
            Provider = model.Provider,
            Subject = model.Subject
        };

    public static ExternalIdentity ToModel(this ExternalIdentityEntity entity)
        => new()
        {
            Id = entity.Id,
            UserAccountId = entity.UserAccountId,
            Provider = entity.Provider,
            Subject = entity.Subject
        };

    public static StatusHistoryEntryEntity ToEntity(this StatusHistoryEntry model, Guid loanApplicationId)
        => new()
        {
            LoanApplicationId = loanApplicationId,
            Status = (int)model.Status,
            ChangedAt = model.ChangedAt,
            Reason = model.Reason
        };

    public static StatusHistoryEntry ToModel(this StatusHistoryEntryEntity entity)
        => new((ApplicationStatus)entity.Status, entity.ChangedAt, entity.Reason);

    public static ApplicantDetailsEntity ToEntity(this ApplicantDetails model)
        => new()
        {
            FirstName = model.FirstName,
            LastName = model.LastName,
            Age = model.Age,
            JobTitle = model.JobTitle,
            Address = model.Address,
            IdDocumentNumber = model.IdDocumentNumber
        };

    public static ApplicantDetails ToModel(this ApplicantDetailsEntity entity)
        => new(
            entity.FirstName,
            entity.LastName,
            entity.Age,
            entity.JobTitle,
            entity.Address,
            entity.IdDocumentNumber);

    public static OfferSnapshotEntity ToEntity(this OfferSnapshot model)
        => new()
        {
            Provider = model.Provider,
            ProviderOfferId = model.ProviderOfferId,
            Installment = model.Installment,
            Apr = model.Apr,
            TotalCost = model.TotalCost,
            Amount = model.Amount,
            DurationMonths = model.DurationMonths,
            ValidUntil = model.ValidUntil
        };

    public static OfferSnapshot ToModel(this OfferSnapshotEntity entity)
        => new(
            entity.Provider,
            entity.ProviderOfferId,
            entity.Installment,
            entity.Apr,
            entity.TotalCost,
            entity.Amount,
            entity.DurationMonths,
            entity.ValidUntil);
}
