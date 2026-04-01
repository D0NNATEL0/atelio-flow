"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  defaultClients,
  loadClients,
  loadDocuments,
  saveClients,
  saveDocuments,
  upsertClientFromDocument,
  type StoredClient,
  type StoredDocument
} from "@/lib/workspace-store";

type DocumentType = "facture" | "devis" | "contrat" | "avenant";
type RecipientMode = "client" | "custom";

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

const docTypes: { id: DocumentType; label: string; badge: string; note: string }[] = [
  { id: "facture", label: "Facture", badge: "Facture", note: "Document comptable à émettre et encaisser." },
  { id: "devis", label: "Devis", badge: "Devis", note: "Proposition commerciale avant validation." },
  { id: "contrat", label: "Contrat", badge: "Contrat", note: "Cadre contractuel avant production." },
  { id: "avenant", label: "Avenant", badge: "Avenant", note: "Acte modificatif rattaché à un document initial déjà signé." }
];

const initialLines: LineItem[] = [
  { id: 1, description: "Développement frontend — Module auth", quantity: 1, unitPrice: 2500 },
  { id: 2, description: "Design UI/UX — 3 écrans", quantity: 3, unitPrice: 450 },
  { id: 3, description: "Intégration API REST", quantity: 1, unitPrice: 800 }
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} €`;
}

function numberFromValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInputDate(value: string) {
  if (!value || value === "—" || value === "Ajout externe") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const normalized = value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = normalized.match(/^(\d{1,2}) ([a-zéû]+) (\d{4})$/);
  if (!match) return "";

  const monthMap: Record<string, string> = {
    janvier: "01",
    fevrier: "02",
    février: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    aout: "08",
    août: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    decembre: "12",
    décembre: "12",
    avr: "04"
  };

  const [, day, monthLabel, year] = match;
  const month = monthMap[monthLabel];
  if (!month) return "";
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function mapStoredType(type: string): DocumentType {
  if (type === "Facture") return "facture";
  if (type === "Devis") return "devis";
  if (type === "Contrat") return "contrat";
  return "avenant";
}

function autoResizeTextarea(event: FormEvent<HTMLTextAreaElement>) {
  const target = event.currentTarget;
  target.style.height = "0px";
  target.style.height = `${target.scrollHeight}px`;
}

export default function EditorPage() {
  const previewRef = useRef<HTMLElement | null>(null);
  const [docType, setDocType] = useState<DocumentType>("facture");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("client");
  const [clients, setClients] = useState<StoredClient[]>(defaultClients());
  const [clientName, setClientName] = useState<string>(defaultClients()[0]?.name ?? "Client");
  const [customRecipientName, setCustomRecipientName] = useState("Nom libre");
  const [number, setNumber] = useState("2026-089");
  const [issueDate, setIssueDate] = useState("2026-04-01");
  const [dueDate, setDueDate] = useState("2026-04-30");
  const [hasDiscount, setHasDiscount] = useState(true);
  const [discountRate, setDiscountRate] = useState("5");
  const [taxRate, setTaxRate] = useState("20");
  const [footerNote, setFooterNote] = useState("Merci pour votre confiance.");
  const [paymentTerms, setPaymentTerms] = useState("30 jours net");
  const [companyName, setCompanyName] = useState("Atelio Studio");
  const [companyAddress, setCompanyAddress] = useState("123 rue de la Paix");
  const [companyMeta, setCompanyMeta] = useState("75001 Paris · SIRET 123 456 789 00012");
  const [clientMeta, setClientMeta] = useState("456 avenue des Tech · 69002 Lyon · compta@client.fr");
  const [pageBackground, setPageBackground] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#ea9038");
  const [textColor, setTextColor] = useState("#1f1b16");
  const [contractObject, setContractObject] = useState("Le présent contrat encadre la collaboration entre Atelio Studio et le client pour la réalisation des livrables définis ci-dessous.");
  const [contractScope, setContractScope] = useState("Création, production et livraison des éléments convenus, avec échanges de validation à chaque étape importante.");
  const [contractTerms, setContractTerms] = useState("Le client transmet ses contenus et retours dans des délais raisonnables. Toute demande hors périmètre fait l’objet d’un accord complémentaire.");
  const [amendmentReference, setAmendmentReference] = useState("Contrat CTR-2026-012 du 15/03/2026");
  const [amendmentObject, setAmendmentObject] = useState("Le présent avenant a pour objet de modifier et compléter le document d’origine afin d’intégrer les ajustements convenus entre les parties.");
  const [amendmentChanges, setAmendmentChanges] = useState("Les parties conviennent de mettre à jour le périmètre de mission, le calendrier d’exécution et, le cas échéant, les conditions opérationnelles liées à la prestation.");
  const [amendmentCarryOver, setAmendmentCarryOver] = useState("Toutes les autres clauses du document initial demeurent inchangées et continuent de produire leurs effets, sauf stipulation contraire expressément prévue au présent avenant.");
  const [companySignatory, setCompanySignatory] = useState("Mathis — Atelio Studio");
  const [clientSignatory, setClientSignatory] = useState("Nom du représentant client");
  const [lines, setLines] = useState<LineItem[]>(initialLines);

  const clientDirectory = useMemo(
    () =>
      clients.reduce<Record<string, string>>((map, client) => {
        map[client.name] = client.coordinates;
        return map;
      }, {}),
    [clients]
  );
  const clientOptions = useMemo(() => clients.map((client) => client.name), [clients]);

  const selectedType = useMemo(
    () => docTypes.find((type) => type.id === docType) ?? docTypes[0],
    [docType]
  );
  const isContractFamily = docType === "contrat" || docType === "avenant";
  const isInvoiceFamily = docType === "facture" || docType === "devis";
  const displayedRecipientName = recipientMode === "client" ? clientName : customRecipientName;
  const recipientClientHref = `/clients?client=${encodeURIComponent(displayedRecipientName)}`;
  const recipientDocumentsHref = `/documents?client=${encodeURIComponent(displayedRecipientName)}`;

  useEffect(() => {
    const storedClients = loadClients();
    setClients(storedClients);
    if (storedClients[0]?.name) {
      setClientName(storedClients[0].name);
      setClientMeta(storedClients[0].coordinates);
    }
  }, []);

  useEffect(() => {
    if (!clients.length) return;

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const documentId = params.get("doc");
    const requestedClient = params.get("client");

    if (documentId) {
      const storedDocument = loadDocuments().find((row) => row.id === documentId);
      if (!storedDocument) return;

      setDocType(mapStoredType(storedDocument.type));
      setNumber(storedDocument.id.split("-").slice(1).join("-") || storedDocument.id);

      const mappedIssueDate = toInputDate(storedDocument.date);
      if (mappedIssueDate) setIssueDate(mappedIssueDate);

      const mappedDueDate = toInputDate(storedDocument.due);
      setDueDate(mappedDueDate);

      const matchingClient = clients.find((client) => client.name === storedDocument.client);
      if (matchingClient) {
        setRecipientMode("client");
        setClientName(matchingClient.name);
        setClientMeta(matchingClient.coordinates);
      } else {
        setRecipientMode("custom");
        setCustomRecipientName(storedDocument.client);
        setClientMeta("Coordonnées à compléter");
      }
      return;
    }

    if (requestedClient) {
      const matchingClient = clients.find((client) => client.name === requestedClient);
      if (matchingClient) {
        setRecipientMode("client");
        setClientName(matchingClient.name);
        setClientMeta(matchingClient.coordinates);
      } else {
        setRecipientMode("custom");
        setCustomRecipientName(requestedClient);
      }
    }
  }, [clients]);

  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0),
    [lines]
  );
  const discountAmount = hasDiscount ? subtotal * (numberFromValue(discountRate) / 100) : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * (numberFromValue(taxRate) / 100);
  const total = subtotalAfterDiscount + taxAmount;

  function updateLine(id: number, patch: Partial<LineItem>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        id: Date.now(),
        description: "Nouvelle prestation",
        quantity: 1,
        unitPrice: 0
      }
    ]);
  }

  function removeLine(id: number) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current));
  }

  function handleDownloadPdf() {
    persistDocument("Brouillon");
    const previewMarkup = previewRef.current?.outerHTML;

    if (!previewMarkup) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1024,height=1440");

    if (!printWindow) {
      return;
    }

    const safeTitle = `${selectedType.badge}-${number}`.replace(/\s+/g, "-");
    const stylesheetMarkup = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${safeTitle}</title>
          ${stylesheetMarkup}
          <style>
            @page {
              size: A4;
              margin: 14mm;
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #f6f2ec;
              font-family: inherit;
              color: ${textColor};
            }

            body {
              padding: 24px;
            }

            .print-shell {
              max-width: 900px;
              margin: 0 auto;
            }

            .print-shell > * {
              box-shadow: none !important;
            }

            @media print {
              body {
                padding: 0;
                background: #fff;
              }

              .print-shell {
                max-width: none;
              }

              .print-shell > * {
                border-radius: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-shell">
            ${previewMarkup}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function handleSelectClient(nextClient: string) {
    setClientName(nextClient);
    setClientMeta(clientDirectory[nextClient] ?? "Coordonnées à compléter");
  }

  function persistDocument(nextStatus: string) {
    const recipientName = recipientMode === "client" ? clientName : customRecipientName.trim() || "Nom libre";
    const nextClientEmail =
      recipientMode === "client"
        ? clients.find((client) => client.name === clientName)?.contactEmail
        : clientMeta.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

    const nextClients = upsertClientFromDocument(clients, {
      name: recipientName,
      email: nextClientEmail,
      coordinates: clientMeta
    });
    const nextDocuments = loadDocuments();
    const documentTypeLabel =
      docType === "facture" ? "Facture" : docType === "devis" ? "Devis" : docType === "contrat" ? "Contrat" : "Avenant";
    const amountValue = isInvoiceFamily ? formatCurrency(total) : "0,00 €";

    const nextDocument: StoredDocument = {
      id: `${docType === "facture" ? "FAC" : docType === "devis" ? "DEV" : docType === "contrat" ? "CTR" : "AVE"}-${number}`,
      client: recipientName,
      date: issueDate,
      due: dueDate || "—",
      amount: amountValue,
      status: nextStatus,
      type: documentTypeLabel
    };

    const existingIndex = nextDocuments.findIndex((row) => row.id === nextDocument.id);
    if (existingIndex >= 0) {
      nextDocuments[existingIndex] = nextDocument;
    } else {
      nextDocuments.unshift(nextDocument);
    }

    saveDocuments(nextDocuments);
    saveClients(nextClients);
    setClients(nextClients);
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Création</div>
          <h1 className={styles.title}>
            <span className={styles.gradient}>Éditeur Devis · Facture · Contrat</span>
          </h1>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.leftColumn}>
          <article
            className={`${styles.preview} ${styles.previewPanel}`}
            ref={previewRef}
            style={
              {
                "--editor-page-background": pageBackground,
                "--editor-accent-color": accentColor,
                "--editor-text-color": textColor
              } as CSSProperties
            }
          >
            <div className={styles.docHead}>
              <div>
                <div className={styles.companyName}>{companyName}</div>
                <div className={styles.muted}>
                  {companyAddress}
                  <br />
                  {companyMeta}
                </div>
              </div>
              <div>
                <div className={styles.badge}>{selectedType.badge}</div>
                <div className={styles.docNumber}>N° {number}</div>
              </div>
            </div>

            <div className={styles.docMeta}>
              <div className={styles.docMetaItem}>
                <div className={styles.metaLabel}>Date d'émission</div>
                <div className={styles.metaValue}>{issueDate}</div>
              </div>
              <div className={styles.docMetaItem}>
                <div className={styles.metaLabel}>
                  {docType === "contrat"
                    ? "Date de fin"
                    : docType === "avenant"
                      ? "Prise d'effet"
                      : "Échéance"}
                </div>
                <div className={styles.metaValue}>{dueDate}</div>
              </div>
              <div className={styles.docMetaItem}>
                <div className={styles.metaLabel}>
                  {docType === "avenant" ? "Document initial" : "Conditions"}
                </div>
                <div className={styles.metaValue}>
                  {docType === "avenant" ? amendmentReference : paymentTerms}
                </div>
              </div>
            </div>

            <div className={styles.docParties}>
              <div className={styles.party}>
                <div className={styles.partyLabel}>Émetteur</div>
                <div className={styles.partyName}>{companyName}</div>
                <div className={styles.partyDetail}>
                  {companyAddress}
                  <br />
                  {companyMeta}
                </div>
              </div>
              <div className={styles.party}>
                <div className={styles.partyLabel}>Client</div>
                <div className={styles.partyName}>{displayedRecipientName}</div>
                <div className={styles.partyDetail}>{clientMeta}</div>
              </div>
            </div>

            {docType === "contrat" ? (
              <div className={styles.contractStack}>
                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Objet du contrat</div>
                  <p className={styles.contractText}>{contractObject}</p>
                </section>

                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Périmètre de mission</div>
                  <p className={styles.contractText}>{contractScope}</p>
                </section>

                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Conditions particulières</div>
                  <p className={styles.contractText}>{contractTerms}</p>
                </section>

                <section className={styles.contractSignatures}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.partyLabel}>Signature émetteur</div>
                    <strong className={styles.signatureName}>{companySignatory}</strong>
                    <span className={styles.signatureMeta}>Bon pour accord</span>
                  </div>
                  <div className={styles.signatureBlock}>
                    <div className={styles.partyLabel}>Signature client</div>
                    <strong className={styles.signatureName}>{clientSignatory}</strong>
                    <span className={styles.signatureMeta}>Bon pour accord</span>
                  </div>
                </section>
              </div>
            ) : docType === "avenant" ? (
              <div className={styles.contractStack}>
                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Objet de l'avenant</div>
                  <p className={styles.contractText}>{amendmentObject}</p>
                </section>

                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Modifications convenues</div>
                  <p className={styles.contractText}>{amendmentChanges}</p>
                </section>

                <section className={styles.contractSection}>
                  <div className={styles.partyLabel}>Maintien des autres clauses</div>
                  <p className={styles.contractText}>{amendmentCarryOver}</p>
                </section>

                <section className={styles.contractSignatures}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.partyLabel}>Signature émetteur</div>
                    <strong className={styles.signatureName}>{companySignatory}</strong>
                    <span className={styles.signatureMeta}>Validation des modifications proposées</span>
                  </div>
                  <div className={styles.signatureBlock}>
                    <div className={styles.partyLabel}>Signature client</div>
                    <strong className={styles.signatureName}>{clientSignatory}</strong>
                    <span className={styles.signatureMeta}>Accord sur les termes modifiés</span>
                  </div>
                </section>
              </div>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qté</th>
                      <th>P.U. HT</th>
                      <th>Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.description}</td>
                        <td>{line.quantity}</td>
                        <td>{formatCurrency(line.unitPrice)}</td>
                        <td>{formatCurrency(line.quantity * line.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className={styles.totals}>
                  <div className={styles.totalRow}><span>Sous-total HT</span><span>{formatCurrency(subtotal)}</span></div>
                  {hasDiscount ? (
                    <div className={styles.totalRow}><span>Remise ({discountRate}%)</span><span>-{formatCurrency(discountAmount)}</span></div>
                  ) : null}
                  <div className={styles.totalRow}><span>TVA {taxRate}%</span><span>{formatCurrency(taxAmount)}</span></div>
                  <div className={styles.totalFinal}><span>Total TTC</span><span>{formatCurrency(total)}</span></div>
                </div>
              </>
            )}

            <div className={styles.footer}>{footerNote}</div>
          </article>

          <div className={`${styles.panel} ${styles.prestationsPanel}`}>
            <div className={styles.sectionTitleRow}>
              <div className={styles.panelTitle}>
                {docType === "contrat"
                  ? "Clauses du contrat"
                  : docType === "avenant"
                    ? "Contenu de l'avenant"
                    : "Prestations"}
              </div>
              {isInvoiceFamily ? (
                <button className="button button-secondary button-small" onClick={addLine} type="button">
                  + Ligne
                </button>
              ) : null}
            </div>

            {docType === "contrat" ? (
              <div className={styles.contractEditorStack}>
                <label className={styles.field}>
                  <span className={styles.label}>Objet</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setContractObject(event.target.value)} onInput={autoResizeTextarea} value={contractObject} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Périmètre</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setContractScope(event.target.value)} onInput={autoResizeTextarea} value={contractScope} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Conditions particulières</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setContractTerms(event.target.value)} onInput={autoResizeTextarea} value={contractTerms} />
                </label>
              </div>
            ) : docType === "avenant" ? (
              <div className={styles.contractEditorStack}>
                <label className={styles.field}>
                  <span className={styles.label}>Document initial</span>
                  <input className={styles.input} onChange={(event) => setAmendmentReference(event.target.value)} value={amendmentReference} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Objet de l'avenant</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setAmendmentObject(event.target.value)} onInput={autoResizeTextarea} value={amendmentObject} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Modifications convenues</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setAmendmentChanges(event.target.value)} onInput={autoResizeTextarea} value={amendmentChanges} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Maintien des autres clauses</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setAmendmentCarryOver(event.target.value)} onInput={autoResizeTextarea} value={amendmentCarryOver} />
                </label>
              </div>
            ) : (
              <div className={styles.lineStack}>
                {lines.map((line, index) => (
                  <div className={styles.lineCard} key={line.id}>
                    <div className={styles.lineHeader}>
                      <strong>Ligne {index + 1}</strong>
                      <button className={styles.removeButton} onClick={() => removeLine(line.id)} type="button">
                        Suppr.
                      </button>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.label}>Description</span>
                      <textarea
                        className={`${styles.input} ${styles.textarea} ${styles.textareaCompact}`}
                        onChange={(event) => updateLine(line.id, { description: event.target.value })}
                        onInput={autoResizeTextarea}
                        rows={2}
                        value={line.description}
                      />
                    </label>

                    <div className={styles.formRow}>
                      <label className={styles.field}>
                        <span className={styles.label}>Qté</span>
                        <input
                          className={styles.input}
                          min="1"
                          onChange={(event) => updateLine(line.id, { quantity: numberFromValue(event.target.value) })}
                          type="number"
                          value={line.quantity}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.label}>P.U. HT</span>
                        <input
                          className={styles.input}
                          min="0"
                          onChange={(event) => updateLine(line.id, { unitPrice: numberFromValue(event.target.value) })}
                          type="number"
                          value={line.unitPrice}
                        />
                      </label>
                    </div>

                    <div className={styles.lineTotal}>Total ligne : {formatCurrency(line.quantity * line.unitPrice)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.rightColumn}>
          <div className={`${styles.panel} ${styles.typePanel}`}>
            <div className={styles.panelTitle}>Type de document</div>
            <div className={styles.typeRow}>
              {docTypes.map((type) => (
                <button
                  className={`${styles.typeButton} ${docType === type.id ? styles.typeActive : ""}`}
                  key={type.id}
                  onClick={() => setDocType(type.id)}
                  type="button"
                >
                  {type.label}
                </button>
              ))}
            </div>
            <p className={styles.panelNote}>{selectedType.note}</p>
          </div>

          <div className={`${styles.panel} ${styles.infoPanel}`}>
            <div className={styles.panelTitle}>Informations</div>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.label}>Numéro</span>
                <input className={styles.input} onChange={(event) => setNumber(event.target.value)} value={number} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Date</span>
                <input className={styles.input} onChange={(event) => setIssueDate(event.target.value)} type="date" value={issueDate} />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.label}>
                  {docType === "contrat"
                    ? "Date de fin"
                    : docType === "avenant"
                      ? "Prise d'effet"
                      : "Échéance"}
                </span>
                <input
                  className={styles.input}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  value={dueDate}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>
                  {docType === "contrat"
                    ? "Cadre / durée"
                    : docType === "avenant"
                      ? "Document initial"
                      : "Conditions"}
                </span>
                <input
                  className={styles.input}
                  onChange={(event) => (docType === "avenant" ? setAmendmentReference(event.target.value) : setPaymentTerms(event.target.value))}
                  value={docType === "avenant" ? amendmentReference : paymentTerms}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Destinataire</span>
              <select
                className={styles.input}
                onChange={(event) => setRecipientMode(event.target.value as RecipientMode)}
                value={recipientMode}
              >
                <option value="client">Client existant</option>
                <option value="custom">Personne libre</option>
              </select>
            </label>

            {recipientMode === "client" ? (
              <label className={styles.field}>
                <span className={styles.label}>Client</span>
                <select className={styles.input} onChange={(event) => handleSelectClient(event.target.value)} value={clientName}>
                  {clientOptions.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className={styles.field}>
                <span className={styles.label}>Nom de la personne</span>
                <input
                  className={styles.input}
                  onChange={(event) => setCustomRecipientName(event.target.value)}
                  value={customRecipientName}
                />
              </label>
            )}

            <label className={styles.field}>
              <span className={styles.label}>{recipientMode === "client" ? "Coordonnées client" : "Coordonnées de la personne"}</span>
              <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setClientMeta(event.target.value)} onInput={autoResizeTextarea} value={clientMeta} />
            </label>
          </div>

          <div className={`${styles.panel} ${styles.identityPanel}`}>
            <div className={styles.panelTitle}>Identité émetteur</div>
            <label className={styles.field}>
              <span className={styles.label}>Nom de l'entreprise</span>
              <input className={styles.input} onChange={(event) => setCompanyName(event.target.value)} value={companyName} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Adresse</span>
              <input className={styles.input} onChange={(event) => setCompanyAddress(event.target.value)} value={companyAddress} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Ligne légale</span>
              <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setCompanyMeta(event.target.value)} onInput={autoResizeTextarea} value={companyMeta} />
            </label>
          </div>

          <div className={`${styles.panel} ${styles.calculationsPanel}`}>
            <div className={styles.panelTitle}>{isContractFamily ? "Validation & note" : "Calculs & note"}</div>
            {isContractFamily ? (
              <>
                <div className={styles.formRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>Signataire émetteur</span>
                    <input className={styles.input} onChange={(event) => setCompanySignatory(event.target.value)} value={companySignatory} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Signataire client</span>
                    <input className={styles.input} onChange={(event) => setClientSignatory(event.target.value)} value={clientSignatory} />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.label}>Note de bas de page</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setFooterNote(event.target.value)} onInput={autoResizeTextarea} value={footerNote} />
                </label>
              </>
            ) : (
              <>
                <div className={styles.formRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>Afficher une remise</span>
                    <select
                      className={styles.input}
                      onChange={(event) => setHasDiscount(event.target.value === "oui")}
                      value={hasDiscount ? "oui" : "non"}
                    >
                      <option value="non">Non</option>
                      <option value="oui">Oui</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>TVA (%)</span>
                    <input className={styles.input} onChange={(event) => setTaxRate(event.target.value)} value={taxRate} />
                  </label>
                </div>
                {hasDiscount ? (
                  <label className={styles.field}>
                    <span className={styles.label}>Remise (%)</span>
                    <input className={styles.input} onChange={(event) => setDiscountRate(event.target.value)} value={discountRate} />
                  </label>
                ) : null}
                <label className={styles.field}>
                  <span className={styles.label}>Note de bas de page</span>
                  <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setFooterNote(event.target.value)} onInput={autoResizeTextarea} value={footerNote} />
                </label>
              </>
            )}
          </div>

          <div className={`${styles.panel} ${styles.customizationPanel}`}>
            <div className={styles.panelTitle}>Personnalisation PDF</div>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.label}>Couleur fond</span>
                <input
                  className={`${styles.input} ${styles.colorInput}`}
                  onChange={(event) => setPageBackground(event.target.value)}
                  type="color"
                  value={pageBackground}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Couleur secondaire</span>
                <input
                  className={`${styles.input} ${styles.colorInput}`}
                  onChange={(event) => setAccentColor(event.target.value)}
                  type="color"
                  value={accentColor}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Couleur de la police</span>
              <input
                className={`${styles.input} ${styles.colorInput}`}
                onChange={(event) => setTextColor(event.target.value)}
                type="color"
                value={textColor}
              />
            </label>
          </div>

          <div className={`${styles.panel} ${styles.actionsPanel}`}>
            <div className={styles.actions}>
              <div className={styles.formRow}>
                <button className="button button-secondary" onClick={() => persistDocument("Brouillon")} type="button">Brouillon</button>
                <button className="button button-primary" onClick={() => persistDocument("En attente")} type="button">Envoyer</button>
              </div>
              <button className="button button-secondary" onClick={handleDownloadPdf} type="button">Télécharger PDF</button>
              <div className={styles.quickLinks}>
                <a className="button button-secondary button-small" href={recipientDocumentsHref}>
                  Voir les documents
                </a>
                <a className="button button-secondary button-small" href={recipientClientHref}>
                  Voir la fiche client
                </a>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
