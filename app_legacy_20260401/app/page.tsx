import { AppShell } from "@/components/app-shell";
import { HomeOverview } from "@/components/home-overview";

export default function HomePage() {
  return (
    <AppShell
      title="Accueil"
      description="Une vue d’ensemble simple pour piloter toute votre activité depuis un seul écran."
      actionLabel="Créer un devis"
      actionHref="/app/devis/nouveau"
      secondaryActionLabel="Créer une facture"
      secondaryActionHref="/app/factures/nouvelle"
      secondaryActionPrimary
    >
      <HomeOverview />
    </AppShell>
  );
}
