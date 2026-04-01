"use client";

import { useEffect, useState } from "react";
import { SortableTableView } from "@/components/sortable-table-view";
import { getStoredClients, type ClientRecord } from "@/lib/browser-storage";
import { clientsTable } from "@/lib/content";

export function LiveClientsTable() {
  const [rows, setRows] = useState<ClientRecord[]>([...clientsTable]);

  useEffect(() => {
    setRows([...getStoredClients(), ...clientsTable]);
  }, []);

  return (
    <SortableTableView
      columns={[
        { key: "client", label: "Client" },
        { key: "contact", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "status", label: "Statut" },
        { key: "total", label: "Montant" }
      ]}
      defaultSortKey="total"
      filterKey="status"
      filterLabel="Statut"
      filterOptions={["Actif", "À relancer", "Nouveau"]}
      rows={rows}
      searchKey="client"
      searchPlaceholder="Rechercher un client"
      sortOptions={[
        { key: "total", label: "Montant le plus élevé" },
        { key: "client", label: "Nom du client" },
        { key: "status", label: "Statut" }
      ]}
    />
  );
}
