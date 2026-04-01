import { AppShell } from "@/components/app-shell";
import { ManagementOverview } from "@/components/management-overview";
import { SortableTableView } from "@/components/sortable-table-view";
import { remindersSummary, remindersTable } from "@/lib/content";

export default function RemindersPage() {
  return (
    <AppShell
      title="Relances"
      description="Repérez les dossiers qui demandent une action et gardez un rythme de suivi simple."
      actionLabel="Programmer une relance"
    >
      <ManagementOverview
        fullWidth
        panelDescription="Les relances restent visibles, priorisées et simples à actionner pour garder un suivi commercial fluide."
        panelTitle=""
        summaries={[...remindersSummary]}
      >
        <SortableTableView
          columns={[
            { key: "target", label: "Référence" },
            { key: "client", label: "Client" },
            { key: "type", label: "Type" },
            { key: "when", label: "Quand" },
            { key: "channel", label: "Canal" }
          ]}
          defaultSortKey="when"
          filterKey="channel"
          filterLabel="Canal"
          filterOptions={["Email", "Email + notification", "Notification"]}
          rows={[...remindersTable]}
          searchKey="client"
          searchPlaceholder="Rechercher une relance ou un client"
          sortOptions={[
            { key: "when", label: "Date / urgence" },
            { key: "client", label: "Client" },
            { key: "channel", label: "Canal" },
            { key: "type", label: "Type" }
          ]}
        />
      </ManagementOverview>
    </AppShell>
  );
}
