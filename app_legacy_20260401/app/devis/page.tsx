import { AppShell } from "@/components/app-shell";
import { ManagementOverview } from "@/components/management-overview";
import { QuoteStudio } from "@/components/quote-studio";
import { quotesSummary } from "@/lib/content";

export default function QuotesPage() {
  return (
    <AppShell
      title="Devis"
      description="Créez, envoyez et suivez vos devis avant conversion en facture."
      actionLabel="Nouveau devis"
      actionHref="/app/devis/nouveau"
    >
      <ManagementOverview
        fullWidth
        panelDescription="Gardez une vue claire sur les propositions envoyées, celles qui doivent être relancées et celles prêtes à être facturées."
        panelTitle=""
        summaries={[...quotesSummary]}
      >
        <QuoteStudio />
      </ManagementOverview>
    </AppShell>
  );
}
