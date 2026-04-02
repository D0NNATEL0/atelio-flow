"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { canCreateClient, canCreateDocument, defaultAccount, loadAccount, type StoredAccount } from "@/lib/account-store";
import { downloadDocumentAsPdf } from "@/lib/pdf-export";
import {
  clearPendingExternalDocument,
  createDocumentEntry,
  defaultClients,
  defaultDocuments,
  guessDocumentTypeFromFileName,
  getNextDocumentNumber,
  hydrateClients,
  loadPendingExternalDocument,
  loadClients,
  loadDocuments,
  saveClients,
  saveDocuments,
  type StoredClient,
  type StoredDocument
} from "@/lib/workspace-store";
import styles from "./page.module.css";

type ClientRow = StoredClient;
const tierFilters = ["Tous", "Compte clé", "Actif", "À développer"] as const;
const creationFilters = ["Toutes", "7 derniers jours", "30 derniers jours", "3 derniers mois", "12 derniers mois"] as const;
const kindFilters = ["Tous", "Pro", "Particulier"] as const;

function getTierClass(status: string) {
  if (status === "Compte clé") return "status-cyan";
  if (status === "Actif") return "status-success";
  return "status-warning";
}

function getDocumentTypeClass(type: string) {
  if (type === "Facture") return "status-success";
  if (type === "Devis") return "status-warning";
  return "status-cyan";
}

function isWithinCreationWindow(createdAt: string, filter: (typeof creationFilters)[number]) {
  if (filter === "Toutes") return true;

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;

  const now = new Date("2026-04-02T12:00:00");
  const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  if (filter === "7 derniers jours") return diffInDays <= 7;
  if (filter === "30 derniers jours") return diffInDays <= 30;
  if (filter === "3 derniers mois") return diffInDays <= 90;
  return diffInDays <= 365;
}

export default function ClientsPage() {
  const [account, setAccount] = useState<StoredAccount>(defaultAccount());
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"" | "export" | "delete">("");
  const [tierFilter, setTierFilter] = useState<(typeof tierFilters)[number]>("Tous");
  const [creationFilter, setCreationFilter] = useState<(typeof creationFilters)[number]>("Toutes");
  const [kindFilter, setKindFilter] = useState<(typeof kindFilters)[number]>("Tous");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [displayedName, setDisplayedName] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clients, setClients] = useState<StoredClient[]>(defaultClients());
  const [documents, setDocuments] = useState(defaultDocuments());
  const [newClient, setNewClient] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    coordinates: "",
    kind: "pro" as StoredClient["kind"]
  });
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; text: string } | null>(null);
  const [pendingExternalDocument, setPendingExternalDocument] = useState<ReturnType<typeof loadPendingExternalDocument>>(null);
  const [documentChoiceClient, setDocumentChoiceClient] = useState<ClientRow | null>(null);
  const [pendingUploadClient, setPendingUploadClient] = useState<ClientRow | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        !normalized ||
        client.name.toLowerCase().includes(normalized) ||
        client.contactEmail.toLowerCase().includes(normalized) ||
        client.initials.toLowerCase().includes(normalized);
      const matchesTier = tierFilter === "Tous" || client.relationshipStatus === tierFilter;
      const matchesCreation = isWithinCreationWindow(client.createdAt, creationFilter);
      const matchesKind =
        kindFilter === "Tous" ||
        (kindFilter === "Pro" && client.kind === "pro") ||
        (kindFilter === "Particulier" && client.kind === "particulier");

      return matchesQuery && matchesTier && matchesCreation && matchesKind;
    });
  }, [clients, query, tierFilter, creationFilter, kindFilter]);

  const activeFilterCount = [tierFilter !== "Tous", creationFilter !== "Toutes", kindFilter !== "Tous"].filter(Boolean)
    .length;

  useEffect(() => {
    const storedDocuments = loadDocuments();
    const storedClients = hydrateClients(loadClients(), storedDocuments);
    const pendingDocument = loadPendingExternalDocument();
    setAccount(loadAccount());
    setDocuments(storedDocuments);
    setClients(storedClients);
    setPendingExternalDocument(pendingDocument);
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
      const storedDocuments = loadDocuments();
      const storedClients = hydrateClients(loadClients(), storedDocuments);
      setDocuments(storedDocuments);
      setClients(storedClients);
      setPendingExternalDocument(loadPendingExternalDocument());
    }

    window.addEventListener("atelio-workspace-updated", syncWorkspace);
    return () => window.removeEventListener("atelio-workspace-updated", syncWorkspace);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !clients.length) return;
    const params = new URLSearchParams(window.location.search);
    const requestedClient = params.get("client");
    const shouldOpenCreate = params.get("create") === "1";
    if (shouldOpenCreate) {
      setIsCreateOpen(true);
    }
    if (!requestedClient) return;
    if (!clients.some((client) => client.name === requestedClient)) return;
    setSelectedName(requestedClient);
  }, [clients]);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  useEffect(() => {
    if (selectedName) {
      setDisplayedName(selectedName);
      return;
    }

    const timeout = window.setTimeout(() => setDisplayedName(null), 240);
    return () => window.clearTimeout(timeout);
  }, [selectedName]);

  useEffect(() => {
    if (selectedName && !filteredClients.some((client) => client.name === selectedName)) {
      setSelectedName(null);
    }
  }, [filteredClients, selectedName]);

  useEffect(() => {
    setSelectedClients((current) => current.filter((name) => clients.some((client) => client.name === name)));
  }, [clients]);

  const selectedClient = displayedName ? clients.find((client) => client.name === displayedName) ?? null : null;
  const visibleClientNames = filteredClients.map((client) => client.name);
  const allVisibleSelected = visibleClientNames.length > 0 && visibleClientNames.every((name) => selectedClients.includes(name));
  const someVisibleSelected = visibleClientNames.some((name) => selectedClients.includes(name));

  function updateClient(name: string, patch: Partial<(typeof clients)[number]>) {
    setClients((current) => current.map((client) => (client.name === name ? { ...client, ...patch } : client)));
  }

  function handleExternalDocumentUpload(client: ClientRow, file: File | null) {
    if (!file) return;

    if (!canCreateDocument(account, documents.length)) {
      setUpgradeModal({
        title: "Limite de documents atteinte",
        text: "Le plan Gratuit permet jusqu’à 10 documents. Passe à Pro pour rattacher plus de fichiers à tes clients."
      });
      return;
    }

    const guessedType = guessDocumentTypeFromFileName(file.name);
    const today = new Date().toISOString().slice(0, 10);
    const nextDocument = createDocumentEntry(loadDocuments(), guessedType, client.name, today);

    const currentDocuments = loadDocuments();
    const nextDocuments = [nextDocument, ...currentDocuments];
    saveDocuments(nextDocuments);
    setDocuments(nextDocuments);

    setClients((current) =>
      hydrateClients(
        current.map((entry) =>
          entry.name === client.name
            ? {
                ...entry,
                coordinates: `${entry.coordinates}\nDocument externe ajouté : ${file.name}`
              }
            : entry
        ),
        nextDocuments
      )
    );

    setDocumentChoiceClient(null);
    setPendingUploadClient(null);
  }

  function openDocumentChoice(client: ClientRow) {
    setDocumentChoiceClient(client);
  }

  function startNewDocument(client: ClientRow) {
    window.location.href = `/editor?client=${encodeURIComponent(client.name)}`;
  }

  function startExternalUpload(client: ClientRow) {
    setPendingUploadClient(client);
    setDocumentChoiceClient(null);
    window.setTimeout(() => uploadInputRef.current?.click(), 0);
  }

  function createClient() {
    const name = newClient.name.trim();
    if (!name) return;

    if (!canCreateClient(account, clients.length)) {
      setUpgradeModal({
        title: "Limite de clients atteinte",
        text: "Le plan Gratuit permet jusqu’à 5 clients. Passe à Pro pour continuer à enrichir ton portefeuille."
      });
      return;
    }

    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CL";

    const accents = ["violet", "coral", "cyan", "green", "amber", "pink"] as const;
    const createdClient: StoredClient = {
      name,
      email: newClient.contactEmail.trim() || "contact@client.fr",
      contactEmail: newClient.contactEmail.trim() || "contact@client.fr",
      phone: newClient.phone.trim() || "À compléter",
      coordinates: newClient.coordinates.trim() || "Coordonnées à compléter",
      createdAt: new Date().toISOString().slice(0, 10),
      kind: newClient.kind,
      relationshipStatus: "À développer",
      initials,
      total: "0 €",
      docs: 0,
      accent: accents[clients.length % accents.length]
    };
    const baseClients = [createdClient, ...clients];
    let nextDocuments = documents;

    if (pendingExternalDocument) {
      const linkedDocument = createDocumentEntry(
        documents,
        pendingExternalDocument.guessedType || guessDocumentTypeFromFileName(pendingExternalDocument.fileName),
        createdClient.name,
        pendingExternalDocument.createdAt || new Date().toISOString().slice(0, 10)
      );
      nextDocuments = [linkedDocument, ...documents];
      saveDocuments(nextDocuments);
      setDocuments(nextDocuments);
      clearPendingExternalDocument();
      setPendingExternalDocument(null);
    }

    const hydratedClients = hydrateClients(baseClients, nextDocuments);
    setClients(hydratedClients);
    setSelectedName(createdClient.name);
    setIsCreateOpen(false);
    setNewClient({ name: "", contactEmail: "", phone: "", coordinates: "", kind: "pro" });
  }

  function toggleClientSelection(name: string) {
    setSelectedClients((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  function toggleSelectAllVisible() {
    setSelectedClients((current) => {
      if (allVisibleSelected) {
        return current.filter((name) => !visibleClientNames.includes(name));
      }

      const next = new Set(current);
      visibleClientNames.forEach((name) => next.add(name));
      return Array.from(next);
    });
  }

  function exportSelectedClients() {
    const rows = clients.filter((client) => selectedClients.includes(client.name));
    if (!rows.length) return;

    const csv = [
      ["Nom", "Type", "Email", "Téléphone", "Créé le", "Documents", "CA", "Coordonnées"].join(";"),
      ...rows.map((client) =>
        [
          client.name,
          client.kind === "pro" ? "Professionnel" : "Particulier",
          client.contactEmail,
          client.phone,
          client.createdAt,
          String(client.docs),
          client.total,
          client.coordinates.replace(/\n/g, " ")
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-atelio-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function deleteSelectedClients() {
    if (!selectedClients.length) return;

    const selectedSet = new Set(selectedClients);
    const nextClients = clients.filter((client) => !selectedSet.has(client.name));
    const nextDocuments = documents.filter((document) => !selectedSet.has(document.client));

    setClients(nextClients);
    setDocuments(nextDocuments);
    saveDocuments(nextDocuments);

    if (selectedName && selectedSet.has(selectedName)) {
      setSelectedName(null);
    }

    setSelectedClients([]);
  }

  function runBulkAction() {
    if (!selectedClients.length || !bulkAction) return;

    if (bulkAction === "export") {
      exportSelectedClients();
      setBulkAction("");
      return;
    }

    if (window.confirm(`Supprimer ${selectedClients.length} client(s) sélectionné(s) et leurs documents liés ?`)) {
      deleteSelectedClients();
    }
    setBulkAction("");
  }

  return (
    <div className={styles.page}>
      {isFilterOpen ? (
        <>
          <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)} />
          <aside className={styles.filterDrawer}>
            <div className={styles.filterHead}>
              <div>
                <span className={styles.blockLabel}>Filtres</span>
                <strong className={styles.blockTitle}>Filtrer les résultats</strong>
              </div>
              <button className={styles.filterClose} onClick={() => setIsFilterOpen(false)} type="button">
                ✕
              </button>
            </div>

            <div className={styles.filterSection}>
              <span className={styles.detailLabel}>Niveau de relation</span>
              <div className={styles.filterOptionList}>
                {tierFilters.map((item) => (
                  <label className={styles.filterOption} key={item}>
                    <input
                      checked={tierFilter === item}
                      name="tier-filter"
                      onChange={() => setTierFilter(item)}
                      type="radio"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <span className={styles.detailLabel}>Date de création</span>
              <div className={styles.filterOptionList}>
                {creationFilters.map((item) => (
                  <label className={styles.filterOption} key={item}>
                    <input
                      checked={creationFilter === item}
                      name="creation-filter"
                      onChange={() => setCreationFilter(item)}
                      type="radio"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <span className={styles.detailLabel}>Type de client</span>
              <div className={styles.filterOptionList}>
                {kindFilters.map((item) => (
                  <label className={styles.filterOption} key={item}>
                    <input
                      checked={kindFilter === item}
                      name="kind-filter"
                      onChange={() => setKindFilter(item)}
                      type="radio"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterActions}>
              <button
                className="button button-secondary"
                onClick={() => {
                  setTierFilter("Tous");
                  setCreationFilter("Toutes");
                  setKindFilter("Tous");
                }}
                type="button"
              >
                Réinitialiser
              </button>
              <button className="button button-primary" onClick={() => setIsFilterOpen(false)} type="button">
                Appliquer
              </button>
            </div>
          </aside>
        </>
      ) : null}

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

      {documentChoiceClient ? (
        <div className={styles.choiceOverlay} onClick={() => setDocumentChoiceClient(null)}>
          <div className={styles.choiceModal} onClick={(event) => event.stopPropagation()}>
            <span className={styles.blockLabel}>Créer un document</span>
            <strong className={styles.choiceTitle}>{documentChoiceClient.name}</strong>
            <p className={styles.choiceText}>Choisis si tu veux créer un nouveau document Atelio Flow ou rattacher un fichier déjà existant.</p>
            <div className={styles.choiceActions}>
              <button className="button button-primary" onClick={() => startNewDocument(documentChoiceClient)} type="button">
                Nouveau document
              </button>
              <button className="button button-secondary" onClick={() => startExternalUpload(documentChoiceClient)} type="button">
                Déposer un fichier
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Portefeuille</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <span className={styles.gradient}>Clients</span>
            </h1>
            <span className={styles.countBadge}>{clients.length}</span>
          </div>
          <p className={styles.subtitle}>Centralise tes comptes, retrouve leur valeur et ouvre vite le bon document.</p>
        </div>
        <button className="button button-primary" onClick={() => setIsCreateOpen((current) => !current)} type="button">
          + Nouveau client
        </button>
      </section>

      <input
        className={styles.globalHiddenFileInput}
        onChange={(event) => {
          if (pendingUploadClient) {
            handleExternalDocumentUpload(pendingUploadClient, event.target.files?.[0] ?? null);
          }
          event.currentTarget.value = "";
        }}
        ref={uploadInputRef}
        type="file"
      />

      {isCreateOpen ? (
        <section className={styles.createCard}>
          <div className={styles.createHead}>
            <div>
              <span className={styles.blockLabel}>Création rapide</span>
              <strong className={styles.blockTitle}>Nouvelle fiche client</strong>
            </div>
          </div>

          {pendingExternalDocument ? (
            <div className={styles.pendingNote}>
              Un fichier externe attend d’être rattaché à ce nouveau client : <strong>{pendingExternalDocument.fileName}</strong>
            </div>
          ) : null}

          <div className={styles.createGrid}>
            <label className={styles.createField}>
              <span className={styles.detailLabel}>Nom</span>
              <input
                className={styles.detailInput}
                onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))}
                value={newClient.name}
              />
            </label>
            <label className={styles.createField}>
              <span className={styles.detailLabel}>Email</span>
              <input
                className={styles.detailInput}
                onChange={(event) => setNewClient((current) => ({ ...current, contactEmail: event.target.value }))}
                value={newClient.contactEmail}
              />
            </label>
            <label className={styles.createField}>
              <span className={styles.detailLabel}>Téléphone</span>
              <input
                className={styles.detailInput}
                onChange={(event) => setNewClient((current) => ({ ...current, phone: event.target.value }))}
                value={newClient.phone}
              />
            </label>
            <label className={styles.createField}>
              <span className={styles.detailLabel}>Type</span>
              <div className={styles.kindToggle}>
                <button
                  className={`${styles.kindButton} ${newClient.kind === "pro" ? styles.kindButtonActive : ""}`}
                  onClick={() => setNewClient((current) => ({ ...current, kind: "pro" }))}
                  type="button"
                >
                  Professionnel
                </button>
                <button
                  className={`${styles.kindButton} ${newClient.kind === "particulier" ? styles.kindButtonActive : ""}`}
                  onClick={() => setNewClient((current) => ({ ...current, kind: "particulier" }))}
                  type="button"
                >
                  Particulier
                </button>
              </div>
            </label>
            <label className={`${styles.createField} ${styles.createFieldFull}`}>
              <span className={styles.detailLabel}>Coordonnées</span>
              <textarea
                className={styles.detailTextarea}
                onChange={(event) => setNewClient((current) => ({ ...current, coordinates: event.target.value }))}
                value={newClient.coordinates}
              />
            </label>
          </div>

          <div className={styles.createActions}>
            <button className="button button-secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Annuler
            </button>
            <button className="button button-primary" onClick={createClient} type="button">
              Créer la fiche client
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.workspace}>
        <div className={styles.listCard}>
          <div className={styles.listTopbar}>
            <div>
              <span className={styles.blockLabel}>Liste clients</span>
              <strong className={styles.blockTitle}>Comptes suivis</strong>
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
                <select
                  className={styles.bulkSelect}
                  onChange={(event) => setBulkAction(event.target.value as "" | "export" | "delete")}
                  value={bulkAction}
                >
                  <option value="">Action sur la sélection</option>
                  <option value="export">Exporter</option>
                  <option value="delete">Supprimer</option>
                </select>
                <button
                  className="button button-secondary"
                  disabled={!selectedClients.length || !bulkAction}
                  onClick={runBulkAction}
                  type="button"
                >
                  Appliquer
                </button>
                {selectedClients.length ? <span className={styles.selectionCount}>{selectedClients.length} sélectionné(s)</span> : null}
              </div>
            </div>

            <div className={styles.listTools}>
              <button className={styles.filterTrigger} onClick={() => setIsFilterOpen(true)} type="button">
                Filtrer les résultats
                {activeFilterCount ? <span className={styles.filterCount}>{activeFilterCount}</span> : null}
              </button>

              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  className={styles.search}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un client..."
                  value={query}
                />
              </div>
            </div>
          </div>

          <div className={styles.clientList}>
            {filteredClients.map((client) => {
              const clientDocuments = documents.filter((row) => row.client === client.name);
              

              return (
                <Fragment key={client.name}>
                  <button
                    className={`${styles.clientRow} ${selectedName === client.name ? styles.clientRowActive : ""}`}
                    onClick={() => setSelectedName((current) => (current === client.name ? null : client.name))}
                    type="button"
                  >
                    <span
                      className={styles.rowCheckboxCell}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        checked={selectedClients.includes(client.name)}
                        onChange={() => toggleClientSelection(client.name)}
                        type="checkbox"
                      />
                    </span>
                    <span className={`${styles.avatar} ${styles[`bg${client.accent}`]}`}>{client.initials}</span>

                    <span className={styles.clientMeta}>
                      <strong className={styles.clientName}>{client.name}</strong>
                      <span className={styles.clientEmail}>{client.contactEmail}</span>
                    </span>

                    <span className={styles.clientAside}>
                      <span className={`status-pill ${getTierClass(client.relationshipStatus)}`}>{client.relationshipStatus}</span>
                      <span className={styles.clientAmount}>{client.total}</span>
                    </span>
                  </button>

                  {displayedName === client.name && selectedClient ? (
                    <div className={styles.clientDetailRow}>
                      <div
                        className={`${styles.detailCard} ${selectedName === client.name ? styles.detailCardOpen : styles.detailCardClosed}`}
                      >
                        <div className={styles.detailHead}>
                          <div className={styles.detailIdentity}>
                            <span className={`${styles.avatar} ${styles[`bg${selectedClient.accent}`]}`}>
                              {selectedClient.initials}
                            </span>
                            <div>
                              <span className={styles.blockLabel}>Fiche client</span>
                              <h2 className={styles.detailTitle}>{selectedClient.name}</h2>
                              <p className={styles.detailSub}>{selectedClient.email}</p>
                            </div>
                          </div>

                          <span className={`status-pill ${getTierClass(selectedClient.relationshipStatus)}`}>
                            {selectedClient.relationshipStatus}
                          </span>
                        </div>

                          <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Chiffre généré</span>
                              <strong>{selectedClient.total}</strong>
                            </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Documents</span>
                            <strong>{selectedClient.docs}</strong>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Contact principal</span>
                            <input
                              className={styles.detailInput}
                              onChange={(event) => updateClient(selectedClient.name, { contactEmail: event.target.value })}
                              value={selectedClient.contactEmail}
                            />
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Téléphone</span>
                            <input
                              className={styles.detailInput}
                              onChange={(event) => updateClient(selectedClient.name, { phone: event.target.value })}
                              value={selectedClient.phone}
                            />
                          </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Type de client</span>
                              <strong>{selectedClient.kind === "pro" ? "Professionnel" : "Particulier"}</strong>
                            </div>
                            <label className={styles.detailItem}>
                              <span className={styles.detailLabel}>Niveau de relation</span>
                              <select
                                className={styles.detailInput}
                                onChange={(event) =>
                                  updateClient(selectedClient.name, {
                                    relationshipStatus: event.target.value as StoredClient["relationshipStatus"]
                                  })
                                }
                                value={selectedClient.relationshipStatus}
                              >
                                <option value="À développer">À développer</option>
                                <option value="Actif">Actif</option>
                                <option value="Compte clé">Compte clé</option>
                              </select>
                            </label>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Créé le</span>
                              <strong>{new Date(selectedClient.createdAt).toLocaleDateString("fr-FR")}</strong>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Prochaine action</span>
                              <strong>
                                {clientDocuments.some((document) => document.status === "Brouillon")
                                  ? "Finaliser le brouillon en cours"
                                  : clientDocuments.length
                                    ? "Reprendre le dernier document"
                                    : "Créer un premier document"}
                            </strong>
                          </div>
                        </div>

                        <div className={styles.coordinatesCard}>
                          <span className={styles.detailLabel}>Coordonnées du client</span>
                          <textarea
                            className={styles.detailTextarea}
                            onChange={(event) => updateClient(selectedClient.name, { coordinates: event.target.value })}
                            value={selectedClient.coordinates}
                          />
                        </div>

                        <div className={styles.actionRow}>
                          <button
                            className="button button-primary"
                            onClick={() => openDocumentChoice(selectedClient)}
                            type="button"
                          >
                            Créer un document
                          </button>
                        </div>

                        <section className={styles.relatedSection}>
                          <div className={styles.sectionHead}>
                            <span className={styles.blockLabel}>Documents liés</span>
                            <strong className={styles.blockTitle}>
                              {clientDocuments.length ? `${clientDocuments.length} éléments` : "Aucun document lié"}
                            </strong>
                          </div>

                          <div className={styles.relatedList}>
                            {clientDocuments.length ? (
                              clientDocuments.map((row) => (
                                <article className={styles.relatedRow} key={row.id}>
                                  <div className={styles.relatedMain}>
                                    <strong className={styles.relatedTitle}>{row.id}</strong>
                                    <p className={styles.relatedSub}>
                                      {row.date} · {row.due}
                                    </p>
                                    <div className={styles.relatedActions}>
                                      <a className="button button-secondary" href={`/documents?doc=${encodeURIComponent(row.id)}`}>
                                        Voir
                                      </a>
                                      <button
                                        className="button button-secondary"
                                        onClick={() => void downloadDocumentAsPdf(row, account)}
                                        type="button"
                                      >
                                        Retélécharger PDF
                                      </button>
                                    </div>
                                  </div>

                                  <div className={styles.relatedAside}>
                                    <span className={`status-pill ${getDocumentTypeClass(row.type)}`}>{row.type}</span>
                                    <span
                                      className={`status-pill ${
                                        row.status === "Payée"
                                          ? "status-success"
                                          : row.status === "En attente"
                                            ? "status-warning"
                                            : row.status === "En retard"
                                              ? "status-danger"
                                              : row.status === "Brouillon"
                                                ? "status-muted"
                                                : "status-cyan"
                                      }`}
                                    >
                                      {row.status}
                                    </span>
                                    <span className={styles.relatedAmount}>{row.amount}</span>
                                  </div>
                                </article>
                              ))
                            ) : (
                              <div className={styles.emptyInline}>
                                <p>
                                  Ce client n’a pas encore de document dans cet échantillon. Tu peux partir directement sur un devis, une facture, un contrat ou un avenant.
                                </p>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : null}
                </Fragment>
              );
            })}

            {filteredClients.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>Aucun client</strong>
                <p>Aucun résultat ne correspond à ta recherche.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
