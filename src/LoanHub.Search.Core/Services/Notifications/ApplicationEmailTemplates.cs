namespace LoanHub.Search.Core.Services.Notifications;

public static class ApplicationEmailTemplates
{
    public const string SubmittedSubject = "LoanHub: Złożono wniosek {{ApplicationId}}";

    public const string SubmittedBody = """
Cześć {{FirstName}},

Twój wniosek został złożony.
Provider: {{Provider}}
Kwota: {{Amount}}
Okres (mies.): {{DurationMonths}}
Id wniosku: {{ApplicationId}}

Pozdrawiamy,
Zespół LoanHub
""";

    public const string StatusSubject = "LoanHub: Status wniosku {{ApplicationId}}";

    public const string StatusBody = """
Cześć {{FirstName}},

Status wniosku: {{StatusLabel}}
Provider: {{Provider}}
Kwota: {{Amount}}
Okres (mies.): {{DurationMonths}}
{{RejectReasonLine}}
Id wniosku: {{ApplicationId}}

Pozdrawiamy,
Zespół LoanHub
""";

    public const string PreliminaryAcceptedSubject = "LoanHub: Wstępna akceptacja wniosku {{ApplicationId}}";

    public const string PreliminaryAcceptedBody = """
Cześć {{FirstName}},

Twój wniosek został wstępnie zaakceptowany.
Provider: {{Provider}}
Kwota: {{Amount}}
Okres (mies.): {{DurationMonths}}

Aby zapoznać się z kontraktem, skorzystaj z linku:
{{ContractLink}}

W załączniku znajdziesz wstępny dokument do podpisu.

Pozdrawiamy,
Zespół LoanHub
""";
}
