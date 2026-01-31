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
        var lines = new List<string>
        {
            "LoanHub - Wstepny kontrakt",
            $"Id wniosku: {application.Id}",
            $"Data wygenerowania: {DateTimeOffset.UtcNow:O}",
            string.Empty,
            "Dane wnioskodawcy:",
            $"Imie i nazwisko: {application.ApplicantDetails.FirstName} {application.ApplicantDetails.LastName}",
            $"Email: {application.ApplicantEmail}",
            $"Adres: {application.ApplicantDetails.Address}",
            $"Dowod osobisty: {application.ApplicantDetails.IdDocumentNumber}",
            string.Empty,
            "Szczegoly oferty:",
            $"Provider: {application.OfferSnapshot.Provider}",
            $"Kwota: {application.OfferSnapshot.Amount.ToString("N2", Culture)}",
            $"Okres (mies.): {application.OfferSnapshot.DurationMonths}",
            $"Rata: {application.OfferSnapshot.Installment.ToString("N2", Culture)}",
            $"RRSO: {application.OfferSnapshot.Apr.ToString("N2", Culture)}%",
            $"Calkowity koszt: {application.OfferSnapshot.TotalCost.ToString("N2", Culture)}",
            string.Empty,
            "Ten dokument ma charakter informacyjny i wymaga podpisu przez klienta."
        };

        var content = SimplePdfBuilder.Build(lines);
        var fileName = $"contract-{application.Id}.pdf";
        return new ContractDocument(fileName, "application/pdf", content);
    }

    private static class SimplePdfBuilder
    {
        private static readonly byte[] HeaderBytes =
        {
            0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A,
            0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A
        };

        public static byte[] Build(IReadOnlyList<string> rawLines)
        {
            var lines = WrapLines(rawLines.Select(SanitizeForPdf)).ToList();
            var contentStream = BuildContentStream(lines);

            var obj1 = AsciiBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
            var obj2 = AsciiBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
            var obj3 = AsciiBytes("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
            var obj4 = AsciiBytes("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            var contentBytes = AsciiBytes(contentStream);
            var obj5Header = AsciiBytes($"5 0 obj\n<< /Length {contentBytes.Length} >>\nstream\n");
            var obj5Footer = AsciiBytes("\nendstream\nendobj\n");

            var objects = new List<byte[]>
            {
                obj1,
                obj2,
                obj3,
                obj4,
                Combine(obj5Header, contentBytes, obj5Footer)
            };

            using var stream = new MemoryStream();
            stream.Write(HeaderBytes, 0, HeaderBytes.Length);

            var offsets = new List<int>();
            var position = HeaderBytes.Length;
            foreach (var obj in objects)
            {
                offsets.Add(position);
                stream.Write(obj, 0, obj.Length);
                position += obj.Length;
            }

            var xrefOffset = position;
            var xrefBuilder = new StringBuilder();
            xrefBuilder.Append("xref\n0 6\n");
            xrefBuilder.Append("0000000000 65535 f \n");
            foreach (var offset in offsets)
            {
                xrefBuilder.Append(offset.ToString("D10")).Append(" 00000 n \n");
            }

            var trailer = $"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF";
            var xrefBytes = AsciiBytes(xrefBuilder.ToString());
            var trailerBytes = AsciiBytes(trailer);

            stream.Write(xrefBytes, 0, xrefBytes.Length);
            stream.Write(trailerBytes, 0, trailerBytes.Length);

            return stream.ToArray();
        }

        private static string BuildContentStream(IReadOnlyList<string> lines)
        {
            var builder = new StringBuilder();
            builder.AppendLine("BT");
            builder.AppendLine("/F1 12 Tf");
            builder.AppendLine("14 TL");
            builder.AppendLine("72 760 Td");

            for (var i = 0; i < lines.Count; i++)
            {
                if (i > 0)
                    builder.AppendLine("T*");

                builder.Append('(')
                    .Append(EscapePdfText(lines[i]))
                    .AppendLine(") Tj");
            }

            builder.AppendLine("ET");
            return builder.ToString();
        }

        private static IEnumerable<string> WrapLines(IEnumerable<string> lines)
        {
            const int maxLineLength = 90;
            foreach (var line in lines)
            {
                if (string.IsNullOrEmpty(line) || line.Length <= maxLineLength)
                {
                    yield return line;
                    continue;
                }

                var words = line.Split(' ');
                var current = new StringBuilder();
                foreach (var word in words)
                {
                    if (current.Length + word.Length + 1 > maxLineLength)
                    {
                        yield return current.ToString();
                        current.Clear();
                    }

                    if (current.Length > 0)
                        current.Append(' ');
                    current.Append(word);
                }

                if (current.Length > 0)
                    yield return current.ToString();
            }
        }

        private static string SanitizeForPdf(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            var normalized = input
                .Replace('ą', 'a').Replace('ć', 'c').Replace('ę', 'e')
                .Replace('ł', 'l').Replace('ń', 'n').Replace('ó', 'o')
                .Replace('ś', 's').Replace('ż', 'z').Replace('ź', 'z')
                .Replace('Ą', 'A').Replace('Ć', 'C').Replace('Ę', 'E')
                .Replace('Ł', 'L').Replace('Ń', 'N').Replace('Ó', 'O')
                .Replace('Ś', 'S').Replace('Ż', 'Z').Replace('Ź', 'Z');

            var builder = new StringBuilder(normalized.Length);
            foreach (var ch in normalized)
            {
                builder.Append(ch <= 127 ? ch : '?');
            }

            return builder.ToString();
        }

        private static string EscapePdfText(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            return input
                .Replace("\\", "\\\\")
                .Replace("(", "\\(")
                .Replace(")", "\\)");
        }

        private static byte[] AsciiBytes(string value) => Encoding.ASCII.GetBytes(value);

        private static byte[] Combine(params byte[][] parts)
        {
            var length = 0;
            foreach (var part in parts)
                length += part.Length;

            var buffer = new byte[length];
            var offset = 0;
            foreach (var part in parts)
            {
                Buffer.BlockCopy(part, 0, buffer, offset, part.Length);
                offset += part.Length;
            }

            return buffer;
        }
    }
}
