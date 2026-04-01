import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/components/dashboard-overview";

export default function DashboardPage() {
  return (
    <AppShell
      title="Tableau de bord"
      description="Une vue d’ensemble pour suivre l’activité commerciale de votre entreprise."
      actionLabel="Nouveau devis"
    >
      <DashboardOverview />
    </AppShell>
  );
}
