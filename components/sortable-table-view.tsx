"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";

type Column = {
  key: string;
  label: string;
};

type Row = Record<string, string>;

type SortOption = {
  key: string;
  label: string;
};

type SortableTableViewProps = {
  searchKey: string;
  searchPlaceholder: string;
  filterKey: string;
  filterLabel: string;
  filterOptions: string[];
  defaultSortKey: string;
  sortOptions: SortOption[];
  columns: Column[];
  rows: Row[];
};

function normalizeAmount(value: string) {
  return Number(value.replace(/[^\d]/g, ""));
}

export function SortableTableView({
  searchKey,
  searchPlaceholder,
  filterKey,
  filterLabel,
  filterOptions,
  defaultSortKey,
  sortOptions,
  columns,
  rows
}: SortableTableViewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const [sortKey, setSortKey] = useState(defaultSortKey);

  const preparedRows = useMemo(() => {
    let nextRows = [...rows];

    if (query.trim()) {
      const normalizedQuery = query.toLowerCase();
      nextRows = nextRows.filter((row) =>
        row[searchKey].toLowerCase().includes(normalizedQuery)
      );
    }

    if (status !== "Tous") {
      nextRows = nextRows.filter((row) => row[filterKey] === status);
    }

    nextRows.sort((a, b) => {
      const first = a[sortKey] ?? "";
      const second = b[sortKey] ?? "";

      if (sortKey === "amount" || sortKey === "total") {
        return normalizeAmount(second) - normalizeAmount(first);
      }

      return first.localeCompare(second, "fr", { sensitivity: "base" });
    });

    return nextRows;
  }, [filterKey, query, rows, searchKey, sortKey, status]);

  return (
    <>
      <div className="toolbar-card toolbar-card-list">
        <label className="toolbar-field toolbar-search">
          <span className="panel-label">Recherche</span>
          <input
            className="input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </label>

        <label className="toolbar-field">
          <span className="panel-label">{filterLabel}</span>
          <select className="input" onChange={(event) => setStatus(event.target.value)} value={status}>
            {["Tous", ...filterOptions].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar-field">
          <span className="panel-label">Trier par</span>
          <select className="input" onChange={(event) => setSortKey(event.target.value)} value={sortKey}>
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable columns={columns} rows={preparedRows} />
    </>
  );
}
