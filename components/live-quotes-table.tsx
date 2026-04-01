"use client";

import { useEffect, useState } from "react";
import { SortableTableView } from "@/components/sortable-table-view";
import { getStoredQuotes, type QuoteRecord } from "@/lib/browser-storage";
import { quotesTable } from "@/lib/content";

export function LiveQuotesTable() {
  const [rows, setRows] = useState<QuoteRecord[]>([...quotesTable]);

  useEffect(() => {
    setRows([...getStoredQuotes(), ...quotesTable]);
  }, []);

  return (
    <SortableTableView
      columns={[
        { key: "id", label: "Numéro" },
        { key: "client", label: "Client" },
        { key: "amount", label: "Montant" },
        { key: "status", label: "Statut" },
        { key: "due", label: "Action" }
      ]}
      defaultSortKey="amount"
      filterKey="status"
      filterLabel="Statut d'envoi"
      filterOptions={["Brouillon", "En attente", "Accepté", "Envoyé"]}
      rows={rows}
      searchKey="client"
      searchPlaceholder="Rechercher un devis ou client"
      sortOptions={[
        { key: "amount", label: "Montant le plus élevé" },
        { key: "client", label: "Client" },
        { key: "status", label: "Statut" },
        { key: "id", label: "Numéro" }
      ]}
    />
  );
}
