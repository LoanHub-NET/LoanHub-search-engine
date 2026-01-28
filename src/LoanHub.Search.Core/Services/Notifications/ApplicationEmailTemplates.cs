namespace LoanHub.Search.Core.Services.Notifications;

public static class ApplicationEmailTemplates
{
    public const string SubmittedSubjectApplicant = "{{ProductName}}: Potwierdzenie złożenia wniosku {{ApplicationId}}";
    public const string SubmittedTextApplicant = """
Cześć {{FirstName}},

Witamy w {{ProductName}}! Dziękujemy za zaufanie i wybór naszej platformy.
Twój wniosek został złożony i przekazany do {{Provider}}. Będziemy informować
Cię mailowo o każdym kolejnym kroku. Jeśli bank poprosi o dodatkowe informacje,
od razu wyślemy powiadomienie.

Szczegóły wniosku:
- Kwota: {{Amount}}
- Okres: {{DurationMonths}} mies.
- Rata: {{Installment}}
- APR: {{Apr}}
- Identyfikator wniosku: {{ApplicationId}}

Co dalej?
- Weryfikujemy wniosek po stronie banku.
- W razie potrzeby poprosimy o dodatkowe dokumenty.
- Otrzymasz wiadomość, gdy pojawi się nowy status.

{{PortalLinkLine}}

Jeśli masz pytania, napisz do nas: {{SupportEmail}}

Pozdrawiamy,
Zespół {{ProductName}}
""";

    public const string SubmittedHtmlApplicant = """
<!doctype html>
<html lang="pl">
  <body style="margin:0; padding:0; background:#f2f5fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb; padding:24px 0; font-family:Arial, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px; max-width:92vw; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 24px; background:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>{{LogoBlock}}</td>
                    <td align="right" style="font-size:12px; color:#94a3b8;">Powiadomienie {{ProductName}}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                <div style="border-top:4px solid {{AccentColor}}; border-radius:16px; padding:18px 20px; background:#f8fafc;">
                  <h1 style="margin:0 0 10px; font-size:20px; color:#0f172a;">Witamy w {{ProductName}}</h1>
                  <p style="margin:0; color:#475569; font-size:14px;">
                    Cześć {{FirstName}}, Twój wniosek został przyjęty i przekazany do <strong>{{Provider}}</strong>.
                    Będziemy informować Cię mailowo o kolejnych etapach. Jeśli potrzebne będą dodatkowe dokumenty,
                    skontaktujemy się z Tobą od razu.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Kwota</td>
                    <td style="padding:10px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Okres</td>
                    <td style="padding:10px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{DurationMonths}} mies.</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Rata</td>
                    <td style="padding:10px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Installment}}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">APR</td>
                    <td style="padding:10px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Apr}}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">ID wniosku</td>
                    <td style="padding:10px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicationId}}</td>
                  </tr>
                </table>
                <div style="margin:18px 0; padding:14px 16px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0;">
                  <p style="margin:0 0 8px; color:#0f172a; font-weight:600; font-size:14px;">Co dalej?</p>
                  <ul style="margin:0 0 0 18px; color:#475569; font-size:13px;">
                    <li>Weryfikujemy wniosek po stronie banku.</li>
                    <li>Możemy poprosić o dodatkowe dokumenty.</li>
                    <li>Otrzymasz aktualizacje statusu w wiadomościach email.</li>
                  </ul>
                </div>
                {{PortalLinkBlock}}
                <p style="margin:0; color:#94a3b8; font-size:12px;">Wsparcie: {{SupportEmail}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#f8fafc; color:#94a3b8; font-size:12px;">
                Wiadomość została wygenerowana automatycznie przez {{ProductName}}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";

    public const string SubmittedSubjectProvider = "{{ProductName}}: Nowy wniosek {{ApplicationId}} od {{ApplicantFullName}}";
    public const string SubmittedTextProvider = """
Nowy wniosek oczekuje na weryfikację.

Applicant:
- Imię i nazwisko: {{ApplicantFullName}}
- Email: {{ApplicantEmail}}
- Wiek: {{ApplicantAge}}
- Stanowisko: {{ApplicantJobTitle}}
- Adres: {{ApplicantAddress}}
- Dokument: {{ApplicantIdDocument}}

Oferta:
- Kwota: {{Amount}}
- Okres: {{DurationMonths}} mies.
- Rata: {{Installment}}
- APR: {{Apr}}
- Koszt całkowity: {{TotalCost}}

{{AdminPortalLinkLine}}

Wiadomość wygenerowana przez {{ProductName}}.
""";

    public const string SubmittedHtmlProvider = """
<!doctype html>
<html lang="pl">
  <body style="margin:0; padding:0; background:#f2f5fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb; padding:24px 0; font-family:Arial, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px; max-width:92vw; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>{{LogoBlock}}</td>
                    <td align="right" style="font-size:12px; color:#94a3b8;">Nowy wniosek</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <h1 style="margin:0 0 12px; font-size:20px; color:#0f172a;">Nowy wniosek do oceny</h1>
                <p style="margin:0 0 18px; color:#475569; font-size:14px;">Wniosek od <strong>{{ApplicantFullName}}</strong> został przypisany do Twojego zespołu.</p>
                <div style="padding:16px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:16px;">
                  <p style="margin:0 0 8px; font-size:12px; color:#94a3b8; text-transform:uppercase;">Applicant</p>
                  <p style="margin:0; font-size:14px; color:#0f172a; font-weight:600;">{{ApplicantFullName}}</p>
                  <p style="margin:6px 0 0; font-size:13px; color:#475569;">{{ApplicantEmail}}</p>
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Kwota</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Okres</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{DurationMonths}} mies.</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Rata</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Installment}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">APR</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Apr}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">ID wniosku</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicationId}}</td>
                  </tr>
                </table>
                {{AdminPortalLinkBlock}}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#f8fafc; color:#94a3b8; font-size:12px;">
                Wiadomość została wygenerowana automatycznie przez {{ProductName}}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";

    public const string StatusSubjectApplicant = "{{ProductName}}: {{StatusLabel}} - {{ApplicationId}}";
    public const string StatusTextApplicant = """
Cześć {{FirstName}},

Status Twojego wniosku został zaktualizowany.

Status: {{StatusLabel}}
Provider: {{Provider}}
Kwota: {{Amount}}
Okres: {{DurationMonths}} mies.
{{RejectReasonLine}}
Identyfikator wniosku: {{ApplicationId}}

{{PortalLinkLine}}

Pozdrawiamy,
Zespół {{ProductName}}
""";

    public const string StatusHtmlApplicant = """
<!doctype html>
<html lang="pl">
  <body style="margin:0; padding:0; background:#f2f5fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb; padding:24px 0; font-family:Arial, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px; max-width:92vw; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>{{LogoBlock}}</td>
                    <td align="right" style="font-size:12px; color:#94a3b8;">Status wniosku</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <h1 style="margin:0 0 10px; font-size:20px; color:#0f172a;">Aktualizacja statusu</h1>
                <p style="margin:0 0 16px; color:#475569; font-size:14px;">Cześć {{FirstName}}, status Twojego wniosku został zaktualizowany.</p>
                <div style="display:inline-block; padding:6px 12px; border-radius:999px; background:#eef2ff; color:#1e3a8a; font-size:12px; font-weight:700; margin-bottom:16px;">
                  {{StatusLabel}}
                </div>
                {{RejectReasonBlock}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:10px;">
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Provider</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Provider}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Kwota</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Okres</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{DurationMonths}} mies.</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">ID wniosku</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicationId}}</td>
                  </tr>
                </table>
                {{PortalLinkBlock}}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#f8fafc; color:#94a3b8; font-size:12px;">
                Wiadomość została wygenerowana automatycznie przez {{ProductName}}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";

    public const string StatusSubjectProvider = "{{ProductName}}: Status {{ApplicationId}} - {{StatusLabel}}";
    public const string StatusTextProvider = """
Aktualizacja statusu wniosku.

Wniosek: {{ApplicationId}}
Status: {{StatusLabel}}
{{RejectReasonLine}}
Applicant: {{ApplicantFullName}} ({{ApplicantEmail}})
Kwota: {{Amount}}
Okres: {{DurationMonths}} mies.

{{AdminPortalLinkLine}}

Wiadomość wygenerowana przez {{ProductName}}.
""";

    public const string StatusHtmlProvider = """
<!doctype html>
<html lang="pl">
  <body style="margin:0; padding:0; background:#f2f5fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb; padding:24px 0; font-family:Arial, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px; max-width:92vw; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>{{LogoBlock}}</td>
                    <td align="right" style="font-size:12px; color:#94a3b8;">Status wniosku</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <h1 style="margin:0 0 10px; font-size:20px; color:#0f172a;">Status wniosku: {{StatusLabel}}</h1>
                {{RejectReasonBlock}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:10px;">
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Applicant</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicantFullName}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Email</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicantEmail}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Kwota</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{Amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">Okres</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{DurationMonths}} mies.</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:12px; color:#94a3b8; text-transform:uppercase;">ID wniosku</td>
                    <td style="padding:8px 0; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">{{ApplicationId}}</td>
                  </tr>
                </table>
                {{AdminPortalLinkBlock}}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#f8fafc; color:#94a3b8; font-size:12px;">
                Wiadomość została wygenerowana automatycznie przez {{ProductName}}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";

    public const string PreliminaryAcceptedSubjectApplicant = "{{ProductName}}: Wstępna akceptacja {{ApplicationId}}";
    public const string PreliminaryAcceptedTextApplicant = """
Cześć {{FirstName}},

Twój wniosek został wstępnie zaakceptowany przez {{Provider}}.

Możesz już zapoznać się z kontraktem:
{{ContractLink}}

W załączniku znajdziesz wstępny dokument do podpisu.

{{PortalLinkLine}}

Pozdrawiamy,
Zespół {{ProductName}}
""";

    public const string PreliminaryAcceptedHtmlApplicant = """
<!doctype html>
<html lang="pl">
  <body style="margin:0; padding:0; background:#f2f5fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb; padding:24px 0; font-family:Arial, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px; max-width:92vw; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>{{LogoBlock}}</td>
                    <td align="right" style="font-size:12px; color:#94a3b8;">Wstępna akceptacja</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <h1 style="margin:0 0 12px; font-size:20px; color:#0f172a;">Wstępna akceptacja</h1>
                <p style="margin:0 0 16px; color:#475569; font-size:14px;">Cześć {{FirstName}}, Twój wniosek został wstępnie zaakceptowany przez <strong>{{Provider}}</strong>.</p>
                <p style="margin:0 0 16px; color:#475569; font-size:14px;">
                  Aby zapoznać się z kontraktem, skorzystaj z linku:
                  <a href="{{ContractLink}}" style="color: {{AccentColor}}; font-weight:600;">{{ContractLink}}</a>
                </p>
                <div style="padding:14px 16px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:16px;">
                  <p style="margin:0; color:#475569; font-size:13px;">W załączniku znajdziesz wstępny dokument do podpisu.</p>
                </div>
                {{PortalLinkBlock}}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#f8fafc; color:#94a3b8; font-size:12px;">
                Wiadomość została wygenerowana automatycznie przez {{ProductName}}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";
}
