import { AppShell } from "@/components/app-shell";
import { LiveInvoicesTable } from "@/components/live-invoices-table";
import { ManagementOverview } from "@/components/management-overview";
import { invoicesSummary } from "@/lib/content";

export default function InvoicesPage() {
  return (
    <AppShell
      title="Factures"
      description="Gardez une vision nette sur l’envoi, l’échéance et l’encaissement."
      actionLabel="Nouvelle facture"
      actionHref="/app/factures/nouvelle"
    >
      <ManagementOverview
        fullWidth
        panelDescription="Suivez les encaissements, les échéances et les retards avec une lecture plus pilotée et plus actionnable."
        panelTitle=""
        summaries={[...invoicesSummary]}
      >
        <LiveInvoicesTable />
      </ManagementOverview>
    </AppShell>
  );
}
