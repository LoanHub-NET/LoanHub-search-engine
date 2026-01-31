namespace LoanHub.Search.Core.Services;

using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models;
using System.Diagnostics;

public sealed class OffersAggregator
{
    private readonly ILoanOfferProviderRegistry _registry;

    public OffersAggregator(ILoanOfferProviderRegistry registry)
        => _registry = registry;
    record Pending(ILoanOfferProvider Provider, Task<(IReadOnlyList<OfferDto> Offers, ProviderCallResult Source)> Task);

    public async Task<(IReadOnlyList<OfferDto> Offers, IReadOnlyList<ProviderCallResult> Sources)> GetOffersAsync(
      OfferQuery query,
      TimeSpan overallTimeout,
      CancellationToken ct)
    {
        var providers = await _registry.GetProvidersAsync(ct);
        if (providers.Count == 0)
            return (Array.Empty<OfferDto>(), Array.Empty<ProviderCallResult>());

        // Ten CTS dalej jest przydatny: jeœli provider respektuje ct, to realnie przerwie pracê po timeout.
        using var overallCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        overallCts.CancelAfter(overallTimeout);

        var offers = new List<OfferDto>();
        var sources = new List<ProviderCallResult>();

        // Startujemy wszystkie wywo³ania naraz
        var pending = providers
            .Select(p => new Pending(p, CallProvider(p, query, overallCts.Token)))
            .ToList();

        var sw = Stopwatch.StartNew();

        while (pending.Count > 0)
        {
            var timeLeft = overallTimeout - sw.Elapsed;
            if (timeLeft <= TimeSpan.Zero)
                break;

            // Czekamy na pierwsze zakoñczone zadanie ALBO na up³yw pozosta³ego czasu
            var timeoutTask = Task.Delay(timeLeft, ct);
            var finished = await Task.WhenAny(pending.Select(x => x.Task).Append(timeoutTask));

            if (finished == timeoutTask)
                break;

            // Zbieramy wynik tego providera, który skoñczy³
            var idx = pending.FindIndex(x => x.Task == finished);
            var item = pending[idx];
            pending.RemoveAt(idx);

            var (provOffers, provSource) = await item.Task; // task ju¿ jest zakoñczony
            offers.AddRange(provOffers);
            sources.Add(provSource);
        }

        // Koñczymy po 15s: anuluj resztê (dla dobrze napisanych providerów to je zatrzyma)
        overallCts.Cancel();

        // Ka¿dy provider, który nie zd¹¿y³ – dopisz jako timeout
        foreach (var item in pending)
        {
            sources.Add(new ProviderCallResult(
                Provider: item.Provider.Name,
                Status: "TimeoutOrCanceled",
                DurationMs: (long)Math.Min(sw.ElapsedMilliseconds, (long)overallTimeout.TotalMilliseconds),
                Error: "Timeout"
            ));

            // ¯eby nie mieæ "unobserved task exception", jeœli coœ padnie póŸniej:
            _ = item.Task.ContinueWith(t => _ = t.Exception,
                TaskContinuationOptions.OnlyOnFaulted | TaskContinuationOptions.ExecuteSynchronously);
        }

        return (offers, sources);

    }


    private static async Task<(IReadOnlyList<OfferDto> Offers, ProviderCallResult Source)> CallProvider(
        ILoanOfferProvider provider,
        OfferQuery query,
        CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var offers = await provider.GetOffersAsync(query, ct);
            sw.Stop();
            return (offers, new ProviderCallResult(provider.Name, "Ok", sw.ElapsedMilliseconds, null));
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return (Array.Empty<OfferDto>(), new ProviderCallResult(provider.Name, "TimeoutOrCanceled", sw.ElapsedMilliseconds, "Canceled"));
        }
        catch (Exception ex)
        {
            sw.Stop();
            return (Array.Empty<OfferDto>(), new ProviderCallResult(provider.Name, "Error", sw.ElapsedMilliseconds, ex.Message));
        }
    }
}
