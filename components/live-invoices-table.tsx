"use client";

import { useEffect, useState } from "react";
import { SortableTableView } from "@/components/sortable-table-view";
import { getStoredInvoices, type InvoiceRecord } from "@/lib/browser-storage";
import { invoicesTable } from "@/lib/content";

export function LiveInvoicesTable() {
  const [rows, setRows] = useState<InvoiceRecord[]>([...invoicesTable]);

  useEffect(() => {
    setRows([...getStoredInvoices(), ...invoicesTable]);
  }, []);

  return (
    <SortableTableView
      columns={[
        { key: "id", label: "Numéro" },
        { key: "client", label: "Client" },
        { key: "amount", label: "Montant" },
        { key: "status", label: "Statut" },
        { key: "due", label: "Échéance" }
      ]}
      defaultSortKey="amount"
      filterKey="status"
      filterLabel="Statut"
      filterOptions={["Payée", "En retard", "Envoyée"]}
      rows={rows}
      searchKey="client"
      searchPlaceholder="Rechercher une facture ou client"
      sortOptions={[
        { key: "amount", label: "Montant le plus élevé" },
        { key: "status", label: "Statut" },
        { key: "client", label: "Client" },
        { key: "id", label: "Numéro" }
      ]}
    />
  );
}
