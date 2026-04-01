"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  defaultClients,
  defaultDocuments,
  hydrateClients,
  loadClients,
  loadDocuments,
  saveClients,
  saveDocuments,
  type StoredClient,
  type StoredDocument
} from "@/lib/workspace-store";
import styles from "./page.module.css";

type ClientRow = StoredClient;

function getClientTier(docs: number) {
  if (docs >= 10) return "Compte clé";
  if (docs >= 5) return "Actif";
  return "À développer";
}

function getTierClass(docs: number) {
  if (docs >= 10) return "status-cyan";
  if (docs >= 5) return "status-success";
  return "status-warning";
}

function getDocumentTypeClass(type: string) {
  if (type === "Facture") return "status-success";
  if (type === "Devis") return "status-warning";
  return "status-cyan";
}

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [displayedName, setDisplayedName] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clients, setClients] = useState<StoredClient[]>(defaultClients());
  const [documents, setDocuments] = useState(defaultDocuments());
  const [newClient, setNewClient] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    coordinates: ""
  });

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(normalized) ||
        client.contactEmail.toLowerCase().includes(normalized) ||
        client.initials.toLowerCase().includes(normalized)
    );
  }, [clients, query]);

  useEffect(() => {
    const storedDocuments = loadDocuments();
    const storedClients = hydrateClients(loadClients(), storedDocuments);
    setDocuments(storedDocuments);
    setClients(storedClients);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !clients.length) return;
    const requestedClient = new URLSearchParams(window.location.search).get("client");
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

  const selectedClient = displayedName ? clients.find((client) => client.name === displayedName) ?? null : null;

  function handleDownloadDocument(row: StoredDocument, client: ClientRow) {
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
                <div class="partyName">${client.name}</div>
                <div class="muted">${client.email}</div>
              </div>
            </div>

            ${
              isContractFamily
                ? `
                  <div class="contractBlock">
                    <div class="contractCard">
                      <div class="sectionTitle">Objet</div>
                      <div class="muted">Document contractuel lié à la collaboration en cours avec ${client.name}.</div>
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

            <div class="footer">Document regénéré depuis la fiche client Atelio.</div>
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

  function updateClient(name: string, patch: Partial<(typeof clients)[number]>) {
    setClients((current) => current.map((client) => (client.name === name ? { ...client, ...patch } : client)));
  }

  function handleExternalDocumentUpload(client: ClientRow, file: File | null) {
    if (!file) return;

    const guessedType =
      file.name.toLowerCase().includes("facture")
        ? "Facture"
        : file.name.toLowerCase().includes("devis")
          ? "Devis"
          : file.name.toLowerCase().includes("avenant")
            ? "Avenant"
            : "Contrat";
    const prefix =
      guessedType === "Facture"
        ? "FAC"
        : guessedType === "Devis"
          ? "DEV"
          : guessedType === "Avenant"
            ? "AVE"
            : "CTR";
    const today = new Date().toISOString().slice(0, 10);

    const nextDocument = {
      id: `${prefix}-EXT-${Date.now().toString().slice(-6)}`,
      client: client.name,
      date: today,
      due: "—",
      amount: "0,00 €",
      status: "Brouillon",
      type: guessedType
    };

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
  }

  function createClient() {
    const name = newClient.name.trim();
    if (!name) return;

    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CL";

    const accents = ["violet", "coral", "cyan", "green", "amber", "pink"] as const;
    const createdClient = {
      name,
      email: newClient.contactEmail.trim() || "contact@client.fr",
      contactEmail: newClient.contactEmail.trim() || "contact@client.fr",
      phone: newClient.phone.trim() || "À compléter",
      coordinates: newClient.coordinates.trim() || "Coordonnées à compléter",
      initials,
      total: "0 €",
      docs: 0,
      accent: accents[clients.length % accents.length]
    };

    setClients((current) => [createdClient, ...current]);
    setSelectedName(createdClient.name);
    setIsCreateOpen(false);
    setNewClient({ name: "", contactEmail: "", phone: "", coordinates: "" });
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Portefeuille</div>
          <h1 className={styles.title}>
            <span className={styles.gradient}>Clients</span>
          </h1>
          <p className={styles.subtitle}>Centralise tes comptes, retrouve leur valeur et ouvre vite le bon document.</p>
        </div>
        <button className="button button-primary" onClick={() => setIsCreateOpen((current) => !current)} type="button">
          + Nouveau client
        </button>
      </section>

      {isCreateOpen ? (
        <section className={styles.createCard}>
          <div className={styles.createHead}>
            <div>
              <span className={styles.blockLabel}>Création rapide</span>
              <strong className={styles.blockTitle}>Nouvelle fiche client</strong>
            </div>
          </div>

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

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Clients suivis</span>
          <strong className={styles.summaryValue}>{clients.length}</strong>
          <span className={styles.summaryMeta}>dans le portefeuille</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Compte clé</span>
          <strong className={styles.summaryValue}>{clients.filter((client) => client.docs >= 10).length}</strong>
          <span className={styles.summaryMeta}>à entretenir en priorité</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Documents liés</span>
          <strong className={styles.summaryValue}>{documents.length}</strong>
          <span className={styles.summaryMeta}>dans cette base démo</span>
        </article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.listCard}>
          <div className={styles.listTopbar}>
            <div>
              <span className={styles.blockLabel}>Liste clients</span>
              <strong className={styles.blockTitle}>Comptes suivis</strong>
            </div>

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
                    <span className={`${styles.avatar} ${styles[`bg${client.accent}`]}`}>{client.initials}</span>

                    <span className={styles.clientMeta}>
                      <strong className={styles.clientName}>{client.name}</strong>
                      <span className={styles.clientEmail}>{client.contactEmail}</span>
                    </span>

                    <span className={styles.clientAside}>
                      <span className={`status-pill ${getTierClass(client.docs)}`}>{getClientTier(client.docs)}</span>
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

                          <span className={`status-pill ${getTierClass(selectedClient.docs)}`}>
                            {getClientTier(selectedClient.docs)}
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
                            <span className={styles.detailLabel}>Prochaine action</span>
                            <strong>
                              {clientDocuments.length ? "Reprendre le dernier document" : "Créer un premier document"}
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
                          <a
                            className="button button-primary"
                            href={`/editor?client=${encodeURIComponent(selectedClient.name)}`}
                          >
                            Créer un document
                          </a>
                          <a
                            className="button button-secondary"
                            href={`/documents?client=${encodeURIComponent(selectedClient.name)}`}
                          >
                            Voir ses documents
                          </a>
                          <label className={`${styles.uploadButton} button button-secondary`}>
                            Déposer un document externe
                            <input
                              className={styles.hiddenInput}
                              onChange={(event) => {
                                handleExternalDocumentUpload(selectedClient, event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                              type="file"
                            />
                          </label>
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
                                        onClick={() => handleDownloadDocument(row, selectedClient)}
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
