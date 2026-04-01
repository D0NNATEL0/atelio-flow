"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  defaultDocuments,
  loadDocuments,
  saveDocuments,
  type StoredDocument
} from "@/lib/workspace-store";
import styles from "./page.module.css";

const filters = ["Tous", "Payée", "En attente", "En retard", "Brouillon", "Signé"] as const;
const typeFilters = ["Tous", "Facture", "Devis", "Contrat", "Avenant"] as const;
const statuses = ["Payée", "En attente", "En retard", "Brouillon", "Signé"] as const;

type DocumentRow = StoredDocument;

function getStatusClass(status: string) {
  if (status === "Payée") return "status-success";
  if (status === "En attente") return "status-warning";
  if (status === "En retard") return "status-danger";
  if (status === "Brouillon") return "status-muted";
  return "status-cyan";
}

function getTypeClass(type: string) {
  if (type === "Facture") return "status-success";
  if (type === "Devis") return "status-warning";
  if (type === "Contrat") return "status-cyan";
  return "status-muted";
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

function createDuplicateId(id: string) {
  const parts = id.split("-");
  const last = Number(parts.at(-1) ?? "0") + 1;
  parts[parts.length - 1] = String(last).padStart(3, "0");
  return parts.join("-");
}

function handleDownloadDocument(row: DocumentRow) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");
  if (!printWindow) return;

  const isContractFamily = row.type === "Contrat" || row.type === "Avenant";
  const title = `${row.type} ${row.id}`;

  printWindow.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, sans-serif;
            background: #f7f2ea;
            color: #241f1a;
          }
          .page {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 18px 60px rgba(0,0,0,0.08);
          }
          .head {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            margin-bottom: 28px;
          }
          .brand {
            font-size: 28px;
            font-weight: 800;
            color: #e48b2f;
            margin-bottom: 10px;
          }
          .muted {
            color: #6f665c;
            line-height: 1.55;
          }
          .badge {
            display: inline-flex;
            padding: 10px 16px;
            border-radius: 999px;
            background: #fff2e6;
            color: #d97613;
            font-weight: 700;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0;
            overflow: hidden;
            border: 1px solid #eee3d8;
            border-radius: 18px;
            margin-bottom: 28px;
          }
          .meta > div {
            padding: 18px;
            border-right: 1px solid #eee3d8;
          }
          .meta > div:last-child {
            border-right: none;
          }
          .label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: #85796f;
            margin-bottom: 6px;
          }
          .value {
            font-size: 16px;
            font-weight: 700;
          }
          .parties {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
            margin-bottom: 28px;
          }
          .sectionTitle {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: #85796f;
            margin-bottom: 8px;
          }
          .partyName {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
          }
          .table th {
            text-align: left;
            padding: 14px 18px;
            background: #e48b2f;
            color: white;
            font-size: 14px;
          }
          .table td {
            padding: 16px 18px;
            border-bottom: 1px solid #eee3d8;
          }
          .totals {
            width: 320px;
            margin-left: auto;
            display: grid;
            gap: 8px;
          }
          .totalsRow {
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }
          .totalFinal {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 18px;
            border-radius: 16px;
            background: #e48b2f;
            color: white;
            font-weight: 800;
          }
          .contractBlock {
            display: grid;
            gap: 20px;
          }
          .contractCard {
            padding: 18px 20px;
            border: 1px solid #eee3d8;
            border-radius: 18px;
            background: #fffdfa;
          }
          .footer {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px solid #eee3d8;
            color: #85796f;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .page {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="head">
            <div>
              <div class="brand">Atelio Studio</div>
              <div class="muted">123 rue de la Paix<br />75001 Paris · SIRET 123 456 789 00012</div>
            </div>
            <div>
              <div class="badge">${row.type}</div>
              <div class="muted" style="margin-top:12px">${row.id}</div>
            </div>
          </div>

          <div class="meta">
            <div>
              <span class="label">Date</span>
              <span class="value">${row.date}</span>
            </div>
            <div>
              <span class="label">${isContractFamily ? "Date de fin" : "Échéance"}</span>
              <span class="value">${row.due}</span>
            </div>
            <div>
              <span class="label">Statut</span>
              <span class="value">${row.status}</span>
            </div>
          </div>

          <div class="parties">
            <div>
              <div class="sectionTitle">Émetteur</div>
              <div class="partyName">Atelio Studio</div>
              <div class="muted">123 rue de la Paix<br />75001 Paris<br />contact@atelio.fr</div>
            </div>
            <div>
              <div class="sectionTitle">Client</div>
              <div class="partyName">${row.client}</div>
            </div>
          </div>

          ${
            isContractFamily
              ? `
                <div class="contractBlock">
                  <div class="contractCard">
                    <div class="sectionTitle">Objet</div>
                    <div class="muted">Document contractuel lié à la collaboration en cours avec ${row.client}.</div>
                  </div>
                  <div class="contractCard">
                    <div class="sectionTitle">Cadre</div>
                    <div class="muted">Les modalités commerciales, livrables et échéances sont confirmés selon le document ${row.id}.</div>
                  </div>
                </div>
              `
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qté</th>
                      <th>P.U. HT</th>
                      <th>Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Prestation principale</td>
                      <td>1</td>
                      <td>${row.amount}</td>
                      <td>${row.amount}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="totals">
                  <div class="totalsRow"><span>Sous-total HT</span><strong>${row.amount}</strong></div>
                  <div class="totalsRow"><span>TVA</span><strong>Incluse selon configuration</strong></div>
                  <div class="totalFinal"><span>Total TTC</span><span>${row.amount}</span></div>
                </div>
              `
          }

          <div class="footer">Document regénéré depuis l’espace Documents Atelio.</div>
        </main>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tous");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("Tous");
  const [rows, setRows] = useState<DocumentRow[]>(defaultDocuments());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayedId, setDisplayedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesFilter = filter === "Tous" || row.status === filter;
      const matchesType = typeFilter === "Tous" || row.type === typeFilter;
      const normalized = query.trim().toLowerCase();
      const matchesQuery =
        normalized.length === 0 ||
        row.id.toLowerCase().includes(normalized) ||
        row.client.toLowerCase().includes(normalized) ||
        row.type.toLowerCase().includes(normalized);

      return matchesFilter && matchesType && matchesQuery;
    });
  }, [filter, query, rows, typeFilter]);

  useEffect(() => {
    setRows(loadDocuments());
  }, []);

  useEffect(() => {
    saveDocuments(rows);
  }, [rows]);

  useEffect(() => {
    if (selectedId) {
      setDisplayedId(selectedId);
      return;
    }

    const timeout = window.setTimeout(() => setDisplayedId(null), 240);
    return () => window.clearTimeout(timeout);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId && !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredRows, selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const documentId = params.get("doc");
    const requestedClient = params.get("client");
    if (!documentId) return;
    if (!rows.some((row) => row.id === documentId)) return;
    setSelectedId(documentId);
  }, [rows]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requestedClient = params.get("client");
    if (!requestedClient) return;
    setQuery(requestedClient);

    const matchingRow = rows.find((row) => row.client === requestedClient);
    if (matchingRow && !params.get("doc")) {
      setSelectedId(matchingRow.id);
    }
  }, [rows]);

  const selectedRow = displayedId ? rows.find((row) => row.id === displayedId) ?? null : null;

  const summary = useMemo(() => {
    const totalCount = rows.length;
    const waitingCount = rows.filter((row) => row.status === "En attente").length;
    const draftCount = rows.filter((row) => row.status === "Brouillon").length;
    const totalAmount = rows.reduce((sum, row) => sum + parseAmount(row.amount), 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return {
      totalCount,
      waitingCount,
      draftCount,
      totalAmount: `${totalAmount} €`
    };
  }, [rows]);

  function updateStatus(id: string, nextStatus: (typeof statuses)[number]) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)));
  }

  function duplicateDocument(id: string) {
    setRows((current) => {
      const source = current.find((row) => row.id === id);
      if (!source) return current;

      const duplicated: DocumentRow = {
        ...source,
        id: createDuplicateId(source.id),
        status: "Brouillon"
      };

      setSelectedId(duplicated.id);
      return [duplicated, ...current];
    });
  }

  function convertToInvoice(id: string) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              id: row.id.replace(/^DEV/, "FAC"),
              type: "Facture",
              status: "En attente"
            }
          : row
      )
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Pilotage</div>
          <h1 className={styles.title}>
            <span className={styles.gradient}>Documents</span>
          </h1>
          <p className={styles.subtitle}>
            Retrouve, ajuste et fais avancer tous tes devis, factures, contrats et avenants depuis une seule vue.
          </p>
        </div>
        <a className="button button-primary" href="/editor">
          + Nouveau document
        </a>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Documents suivis</span>
          <strong className={styles.summaryValue}>{summary.totalCount}</strong>
          <span className={styles.summaryMeta}>base active</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Montant cumulé</span>
          <strong className={styles.summaryValue}>{summary.totalAmount}</strong>
          <span className={styles.summaryMeta}>sur les documents affichés</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>En attente</span>
          <strong className={styles.summaryValue}>{summary.waitingCount}</strong>
          <span className={styles.summaryMeta}>à suivre rapidement</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Brouillons</span>
          <strong className={styles.summaryValue}>{summary.draftCount}</strong>
          <span className={styles.summaryMeta}>à finaliser</span>
        </article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.tableWrap}>
          <div className={styles.topbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.search}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un document, un client..."
                value={query}
              />
            </div>

            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                {filters.map((item) => (
                  <button
                    className={`${styles.filter} ${filter === item ? styles.filterActive : ""}`}
                    key={item}
                    onClick={() => setFilter(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.sortWrap}>
                  <span className={styles.sortLabel}>Trier par</span>
                  <select
                    className={styles.sortSelect}
                    onChange={(event) => setTypeFilter(event.target.value as (typeof typeFilters)[number])}
                    value={typeFilter}
                  >
                    {typeFilters.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={row.id === selectedId ? styles.rowActive : ""}
                      onClick={() => setSelectedId((current) => (current === row.id ? null : row.id))}
                    >
                      <td className={styles.mono}>{row.id}</td>
                      <td className={styles.strong}>{row.client}</td>
                      <td>
                        <span className={`status-pill ${getTypeClass(row.type)}`}>{row.type}</span>
                      </td>
                      <td>{row.date}</td>
                      <td>{row.due}</td>
                      <td className={styles.amount}>{row.amount}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(row.status)}`}>{row.status}</span>
                      </td>
                    </tr>

                    {displayedId === row.id && selectedRow ? (
                      <tr className={styles.detailRow}>
                        <td className={styles.detailCell} colSpan={7}>
                          <div
                            className={`${styles.detailCard} ${selectedId === row.id ? styles.detailCardOpen : styles.detailCardClosed}`}
                          >
                            <div className={styles.detailHead}>
                              <div>
                                <span className={styles.detailLabel}>Document sélectionné</span>
                                <h2 className={styles.detailTitle}>{selectedRow.id}</h2>
                                <p className={styles.detailSub}>{selectedRow.client}</p>
                              </div>
                              <span className={`status-pill ${getTypeClass(selectedRow.type)}`}>{selectedRow.type}</span>
                            </div>

                            <div className={styles.detailGrid}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Date</span>
                                <strong>{selectedRow.date}</strong>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Échéance</span>
                                <strong>{selectedRow.due}</strong>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Montant</span>
                                <strong>{selectedRow.amount}</strong>
                              </div>
                              <label className={styles.detailItem}>
                                <span className={styles.detailLabel}>Statut</span>
                                <select
                                  className={styles.statusSelect}
                                  onChange={(event) =>
                                    updateStatus(selectedRow.id, event.target.value as (typeof statuses)[number])
                                  }
                                  value={selectedRow.status}
                                >
                                  {statuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className={styles.actionStack}>
                              <a
                                className="button button-primary"
                                href={`/editor?doc=${encodeURIComponent(selectedRow.id)}`}
                              >
                                Ouvrir dans l’éditeur
                              </a>
                              <a
                                className="button button-secondary"
                                href={`/clients?client=${encodeURIComponent(selectedRow.client)}`}
                              >
                                Voir la fiche client
                              </a>
                              <button
                                className="button button-secondary"
                                onClick={() => handleDownloadDocument(selectedRow)}
                                type="button"
                              >
                                Télécharger PDF
                              </button>
                              <button
                                className="button button-secondary"
                                onClick={() => duplicateDocument(selectedRow.id)}
                                type="button"
                              >
                                Dupliquer
                              </button>
                              {selectedRow.type === "Devis" ? (
                                <button
                                  className="button button-secondary"
                                  onClick={() => convertToInvoice(selectedRow.id)}
                                  type="button"
                                >
                                  Convertir en facture
                                </button>
                              ) : null}
                            </div>

                            <div className={styles.timeline}>
                              <div className={styles.timelineItem}>
                                <span className={styles.timelineDot} />
                                <div>
                                  <strong>Créé</strong>
                                  <p>{selectedRow.date}</p>
                                </div>
                              </div>
                              <div className={styles.timelineItem}>
                                <span className={styles.timelineDot} />
                                <div>
                                  <strong>Statut actuel</strong>
                                  <p>{selectedRow.status}</p>
                                </div>
                              </div>
                              <div className={styles.timelineItem}>
                                <span className={styles.timelineDot} />
                                <div>
                                  <strong>Prochaine étape</strong>
                                  <p>
                                    {selectedRow.type === "Devis"
                                      ? "Relancer ou convertir selon la réponse client."
                                      : selectedRow.type === "Facture"
                                        ? "Suivre l’encaissement et la date d’échéance."
                                        : "Vérifier la signature et l’archivage du document."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Aucun document</strong>
              <p>Aucun résultat ne correspond aux filtres actuels.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
