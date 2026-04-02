"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { canCreateDocument, canUseLockedDocumentTypes, defaultAccount, loadAccount, type StoredAccount } from "@/lib/account-store";
import { downloadDocumentAsPdf, downloadDocumentsAsZip } from "@/lib/pdf-export";
import {
  clearPendingExternalDocument,
  createDocumentEntry,
  defaultDocuments,
  guessDocumentTypeFromFileName,
  loadClients,
  loadDocuments,
  savePendingExternalDocument,
  saveDocuments,
  type StoredDocument
} from "@/lib/workspace-store";
import styles from "./page.module.css";

const filters = ["Tous", "Payée", "En attente", "En retard", "Brouillon", "Signé"] as const;
const typeFilters = ["Tous", "Facture", "Devis", "Contrat", "Avenant"] as const;
const statuses = ["Payée", "En attente", "En retard", "Brouillon", "Signé"] as const;

type DocumentRow = StoredDocument;
type BulkAction = "" | "download" | "delete";

function parseDocumentDate(value: string) {
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  const normalized = value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = normalized.match(/^(\d{1,2}) ([a-zéû]+) (\d{4})$/);
  if (!match) return 0;

  const monthMap: Record<string, string> = {
    janvier: "01",
    fevrier: "02",
    février: "02",
    mars: "03",
    avril: "04",
    avr: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    aout: "08",
    août: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    decembre: "12",
    décembre: "12"
  };

  const [, day, monthLabel, year] = match;
  const month = monthMap[monthLabel];
  if (!month) return 0;

  return Date.parse(`${year}-${month}-${day.padStart(2, "0")}`);
}

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

function isLockedType(type: (typeof typeFilters)[number], account: StoredAccount) {
  return (type === "Contrat" || type === "Avenant") && !canUseLockedDocumentTypes(account);
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

export default function DocumentsPage() {
  const [account, setAccount] = useState<StoredAccount>(defaultAccount());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tous");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("Tous");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");
  const [rows, setRows] = useState<DocumentRow[]>(defaultDocuments());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayedId, setDisplayedId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; text: string } | null>(null);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadType, setPendingUploadType] = useState<(typeof typeFilters)[number]>("Facture");
  const [isLinkChoiceOpen, setIsLinkChoiceOpen] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

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
    }).sort((left, right) => {
      const leftDate = parseDocumentDate(left.date);
      const rightDate = parseDocumentDate(right.date);
      return dateSort === "desc" ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [dateSort, filter, query, rows, typeFilter]);

  useEffect(() => {
    setAccount(loadAccount());
    setRows(loadDocuments());
    const storedClients = loadClients();
    if (storedClients[0]?.name) {
      setSelectedClientName(storedClients[0].name);
    }
  }, []);

  useEffect(() => {
    function syncAccount() {
      setAccount(loadAccount());
    }

    window.addEventListener("atelio-account-updated", syncAccount);
    return () => window.removeEventListener("atelio-account-updated", syncAccount);
  }, []);

  useEffect(() => {
    function syncWorkspace() {
      const nextRows = loadDocuments();
      setRows(nextRows);
      const storedClients = loadClients();
      if (storedClients[0]?.name) {
        setSelectedClientName((current) => current || storedClients[0].name);
      }
    }

    window.addEventListener("atelio-workspace-updated", syncWorkspace);
    return () => window.removeEventListener("atelio-workspace-updated", syncWorkspace);
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

  useEffect(() => {
    setSelectedDocuments((current) => current.filter((id) => rows.some((row) => row.id === id)));
  }, [rows]);

  const selectedRow = displayedId ? rows.find((row) => row.id === displayedId) ?? null : null;
  const clientOptions = loadClients();
  const visibleDocumentIds = filteredRows.map((row) => row.id);
  const allVisibleSelected = visibleDocumentIds.length > 0 && visibleDocumentIds.every((id) => selectedDocuments.includes(id));
  const someVisibleSelected = visibleDocumentIds.some((id) => selectedDocuments.includes(id));

  function updateStatus(id: string, nextStatus: (typeof statuses)[number]) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)));
  }

  function updateAmount(id: string, nextAmount: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, amount: nextAmount } : row)));
  }

  function toggleDocumentSelection(id: string) {
    setSelectedDocuments((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleSelectAllVisible() {
    setSelectedDocuments((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleDocumentIds.includes(id));
      }

      const next = new Set(current);
      visibleDocumentIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }

  function downloadSelectedDocuments() {
    const rowsToDownload = rows.filter((row) => selectedDocuments.includes(row.id));
    if (rowsToDownload.length === 1) {
      void downloadDocumentAsPdf(rowsToDownload[0], account);
      return;
    }

    void downloadDocumentsAsZip(rowsToDownload, account, "documents-atelio");
  }

  function deleteSelectedDocuments() {
    if (!selectedDocuments.length) return;

    const selectedSet = new Set(selectedDocuments);
    setRows((current) => current.filter((row) => !selectedSet.has(row.id)));

    if (selectedId && selectedSet.has(selectedId)) {
      setSelectedId(null);
    }

    setSelectedDocuments([]);
  }

  function runBulkAction() {
    if (!selectedDocuments.length || !bulkAction) return;

    if (bulkAction === "download") {
      downloadSelectedDocuments();
      setBulkAction("");
      return;
    }

    if (window.confirm(`Supprimer ${selectedDocuments.length} document(s) sélectionné(s) ?`)) {
      deleteSelectedDocuments();
    }
    setBulkAction("");
  }

  function duplicateDocument(id: string) {
    if (!canCreateDocument(account, rows.length)) {
      setUpgradeModal({
        title: "Limite de documents atteinte",
        text: "Le plan Gratuit permet jusqu’à 10 documents. Passe à Pro pour continuer à dupliquer et créer sans limite."
      });
      return;
    }

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

  function startNewDocument() {
    window.location.href = "/editor";
  }

  function startUploadFlow() {
    setIsCreateChoiceOpen(false);
    window.setTimeout(() => uploadInputRef.current?.click(), 0);
  }

  function handleFileSelected(file: File | null) {
    if (!file) return;

    if (!canCreateDocument(account, rows.length)) {
      setUpgradeModal({
        title: "Limite de documents atteinte",
        text: "Le plan Gratuit permet jusqu’à 10 documents. Passe à Pro pour continuer à déposer et gérer plus de fichiers."
      });
      return;
    }

    setPendingUploadFile(file);
    setPendingUploadType(guessDocumentTypeFromFileName(file.name) as (typeof typeFilters)[number]);
    setIsLinkChoiceOpen(true);
  }

  function attachUploadedFileToClient() {
    if (!pendingUploadFile || !selectedClientName) return;

    const today = new Date().toISOString().slice(0, 10);
    const currentDocuments = loadDocuments();
    const nextDocument = createDocumentEntry(currentDocuments, pendingUploadType, selectedClientName, today);
    const nextDocuments = [nextDocument, ...currentDocuments];

    saveDocuments(nextDocuments);
    setRows(nextDocuments);
    setSelectedId(nextDocument.id);
    setPendingUploadFile(null);
    setPendingUploadType("Facture");
    setIsLinkChoiceOpen(false);
    clearPendingExternalDocument();
  }

  function redirectUploadedFileToNewClient() {
    if (!pendingUploadFile) return;

    const today = new Date().toISOString().slice(0, 10);
    savePendingExternalDocument({
      fileName: pendingUploadFile.name,
      guessedType: pendingUploadType,
      createdAt: today
    });

    setPendingUploadFile(null);
    setPendingUploadType("Facture");
    setIsLinkChoiceOpen(false);
    window.location.href = "/clients?create=1";
  }

  return (
    <div className={styles.page}>
      {upgradeModal ? (
        <div className="upgrade-overlay" onClick={() => setUpgradeModal(null)}>
          <div className="upgrade-modal" onClick={(event) => event.stopPropagation()}>
            <span className="upgrade-kicker">Plan Gratuit</span>
            <strong className="upgrade-title">{upgradeModal.title}</strong>
            <p className="upgrade-text">{upgradeModal.text}</p>
            <div className="upgrade-actions">
              <button className="button button-secondary" onClick={() => setUpgradeModal(null)} type="button">
                Plus tard
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  window.location.href = "/abonnement";
                }}
                type="button"
              >
                Passer à Pro
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateChoiceOpen ? (
        <div className={styles.choiceOverlay} onClick={() => setIsCreateChoiceOpen(false)}>
          <div className={styles.choiceModal} onClick={(event) => event.stopPropagation()}>
            <span className={styles.detailLabel}>Nouveau document</span>
            <strong className={styles.choiceTitle}>Choisis ton point de départ</strong>
            <p className={styles.choiceText}>Tu peux créer un document Atelio Flow ou rattacher un fichier déjà existant.</p>
            <div className={styles.choiceActions}>
              <button className="button button-primary" onClick={startNewDocument} type="button">
                Nouveau document
              </button>
              <button className="button button-secondary" onClick={startUploadFlow} type="button">
                Déposer un fichier
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLinkChoiceOpen ? (
        <div className={styles.choiceOverlay} onClick={() => setIsLinkChoiceOpen(false)}>
          <div className={styles.choiceModal} onClick={(event) => event.stopPropagation()}>
            <span className={styles.detailLabel}>Associer le fichier</span>
            <strong className={styles.choiceTitle}>{pendingUploadFile?.name}</strong>
            <p className={styles.choiceText}>Choisis si ce document doit être rattaché à un client existant ou à une nouvelle fiche client.</p>

            <label className={styles.choiceField}>
              <span className={styles.choiceFieldLabel}>Type de document</span>
              <div className={styles.choiceTypeRow}>
                {typeFilters
                  .filter((item) => item !== "Tous")
                  .map((item) => {
                    const locked = isLockedType(item, account);

                    return (
                      <button
                        className={`${styles.choiceTypeButton} ${pendingUploadType === item ? styles.choiceTypeButtonActive : ""} ${
                          locked ? styles.choiceTypeButtonLocked : ""
                        }`}
                        key={item}
                        onClick={() => {
                          if (locked) {
                            setUpgradeModal({
                              title: `${item} réservé à Pro`,
                              text: "Passe à Pro pour déposer aussi des contrats et avenants."
                            });
                            return;
                          }
                          setPendingUploadType(item);
                        }}
                        type="button"
                      >
                        {item}
                        {locked ? <span className={styles.choiceTypeLock}>Pro</span> : null}
                      </button>
                    );
                  })}
              </div>
            </label>

            <label className={styles.choiceField}>
              <span className={styles.choiceFieldLabel}>Client existant</span>
              <select className={styles.choiceSelect} onChange={(event) => setSelectedClientName(event.target.value)} value={selectedClientName}>
                {clientOptions.map((client) => (
                  <option key={client.name} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.choiceActions}>
              <button className="button button-secondary" onClick={redirectUploadedFileToNewClient} type="button">
                Nouveau client
              </button>
              <button className="button button-primary" onClick={attachUploadedFileToClient} type="button">
                Lier au client
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        <button className="button button-primary" onClick={() => setIsCreateChoiceOpen(true)} type="button">
          + Nouveau document
        </button>
      </section>

      <input
        className={styles.hiddenFileInput}
        onChange={(event) => {
          handleFileSelected(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
        ref={uploadInputRef}
        type="file"
      />

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
                {typeFilters.map((item) => (
                  <button
                    className={`${styles.filter} ${typeFilter === item ? styles.filterActive : ""} ${
                      isLockedType(item, account) ? styles.filterLocked : ""
                    }`}
                    key={item}
                    onClick={() => {
                      if (isLockedType(item, account)) {
                        setUpgradeModal({
                          title: `${item} réservé à Pro`,
                          text: "Passe à Pro pour filtrer et gérer aussi tes contrats et avenants depuis l’espace Documents."
                        });
                        return;
                      }

                      setTypeFilter(item);
                    }}
                    type="button"
                  >
                    {item}
                    {isLockedType(item, account) ? <span className={styles.lockDot}>Pro</span> : null}
                  </button>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.sortWrap}>
                  <span className={styles.sortLabel}>Statut</span>
                  <select
                    className={styles.sortSelect}
                    onChange={(event) => setFilter(event.target.value as (typeof filters)[number])}
                    value={filter}
                  >
                    {filters.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.bulkBar}>
            <label className={styles.bulkCheckbox}>
              <input
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                ref={(node) => {
                  if (node) {
                    node.indeterminate = someVisibleSelected && !allVisibleSelected;
                  }
                }}
                type="checkbox"
              />
              <span>Sélectionner les résultats</span>
            </label>

            <div className={styles.bulkControls}>
              <select className={styles.bulkSelect} onChange={(event) => setBulkAction(event.target.value as BulkAction)} value={bulkAction}>
                <option value="">Action sur la sélection</option>
                <option value="download">Télécharger PDF</option>
                <option value="delete">Supprimer</option>
              </select>
              <button className="button button-secondary" disabled={!selectedDocuments.length || !bulkAction} onClick={runBulkAction} type="button">
                Appliquer
              </button>
              {selectedDocuments.length ? <span className={styles.selectionCount}>{selectedDocuments.length} sélectionné(s)</span> : null}
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>
                    <button
                      className={styles.sortHeader}
                      onClick={() => setDateSort((current) => (current === "desc" ? "asc" : "desc"))}
                      type="button"
                    >
                      Date
                      <span className={`${styles.sortArrow} ${dateSort === "asc" ? styles.sortArrowAsc : ""}`}>↑</span>
                    </button>
                  </th>
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
                      <td onClick={(event) => event.stopPropagation()}>
                        <input checked={selectedDocuments.includes(row.id)} onChange={() => toggleDocumentSelection(row.id)} type="checkbox" />
                      </td>
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
                        <td className={styles.detailCell} colSpan={8}>
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
                                <input
                                  className={styles.amountInput}
                                  onChange={(event) => updateAmount(selectedRow.id, event.target.value)}
                                  value={selectedRow.amount}
                                />
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
                                className="button button-secondary"
                                href={`/clients?client=${encodeURIComponent(selectedRow.client)}`}
                              >
                                Voir la fiche client
                              </a>
                              <button
                                className="button button-secondary"
                                onClick={() => void downloadDocumentAsPdf(selectedRow, account)}
                                type="button"
                              >
                                Télécharger PDF
                              </button>
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
