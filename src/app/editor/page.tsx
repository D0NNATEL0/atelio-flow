"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { canCreateDocument, canUseLockedDocumentTypes, defaultAccount, loadAccount, type StoredAccount } from "@/lib/account-store";
import { downloadElementAsPdf } from "@/lib/pdf-export";
import {
  defaultClients,
  getNextDocumentNumber,
  getDocumentPrefix,
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
  unitPrice: string;
};

const docTypes: { id: DocumentType; label: string; badge: string; note: string }[] = [
  { id: "facture", label: "Facture", badge: "Facture", note: "Document comptable à émettre et encaisser." },
  { id: "devis", label: "Devis", badge: "Devis", note: "Proposition commerciale avant validation." },
  { id: "contrat", label: "Contrat", badge: "Contrat", note: "Cadre contractuel avant production." },
  { id: "avenant", label: "Avenant", badge: "Avenant", note: "Acte modificatif rattaché à un document initial déjà signé." }
];

const editorSteps = [
  { id: "type", short: "Type", title: "Quel document veux-tu créer ?", description: "Choisis d’abord le format le plus adapté à ton besoin." },
  { id: "recipient", short: "Coordonnées", title: "Coordonnées et destinataire", description: "Renseigne les informations principales du document et à qui il s’adresse." },
  { id: "issuer", short: "Émetteur", title: "Identité émetteur", description: "Vérifie les informations légales et la présentation de ton entreprise." },
  { id: "content", short: "Contenu", title: "Contenu du document", description: "Ajoute les prestations ou les clauses selon le type choisi." },
  { id: "finalize", short: "Finaliser", title: "Finaliser et exporter", description: "Ajuste les derniers paramètres puis enregistre ou télécharge ton document." }
] as const;

const initialLines: LineItem[] = [
  { id: 1, description: "Nouvelle prestation", quantity: 1, unitPrice: "0" }
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
  const router = useRouter();
  const previewRef = useRef<HTMLElement | null>(null);
  const [account, setAccount] = useState<StoredAccount>(defaultAccount());
  const [docType, setDocType] = useState<DocumentType>("facture");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("client");
  const [clients, setClients] = useState<StoredClient[]>(defaultClients());
  const [clientName, setClientName] = useState<string>(defaultClients()[0]?.name ?? "Client");
  const [customRecipientName, setCustomRecipientName] = useState("Nom libre");
  const [number, setNumber] = useState("2026-089");
  const [issueDate, setIssueDate] = useState("2026-04-01");
  const [dueDate, setDueDate] = useState("2026-04-30");
  const [hasDiscount, setHasDiscount] = useState(true);
  const [hasTax, setHasTax] = useState(true);
  const [priceMode, setPriceMode] = useState<"ht" | "ttc">("ht");
  const [discountRate, setDiscountRate] = useState("5");
  const [taxRate, setTaxRate] = useState("20");
  const [footerNote, setFooterNote] = useState("Merci pour votre confiance.");
  const [paymentTerms, setPaymentTerms] = useState("30 jours net");
  const [companyName, setCompanyName] = useState("Atelio Flow");
  const [companyAddress, setCompanyAddress] = useState("123 rue de la Paix");
  const [companyMeta, setCompanyMeta] = useState("75001 Paris · SIRET 123 456 789 00012");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [clientMeta, setClientMeta] = useState("456 avenue des Tech · 69002 Lyon · compta@client.fr");
  const [pageBackground, setPageBackground] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#ea9038");
  const [textColor, setTextColor] = useState("#1f1b16");
  const [secondaryTextColor, setSecondaryTextColor] = useState("#7b7269");
  const [contractObject, setContractObject] = useState("Le présent contrat encadre la collaboration entre Atelio Flow et le client pour la réalisation des livrables définis ci-dessous.");
  const [contractScope, setContractScope] = useState("Création, production et livraison des éléments convenus, avec échanges de validation à chaque étape importante.");
  const [contractTerms, setContractTerms] = useState("Le client transmet ses contenus et retours dans des délais raisonnables. Toute demande hors périmètre fait l’objet d’un accord complémentaire.");
  const [amendmentReference, setAmendmentReference] = useState("Contrat CTR-2026-012 du 15/03/2026");
  const [amendmentObject, setAmendmentObject] = useState("Le présent avenant a pour objet de modifier et compléter le document d’origine afin d’intégrer les ajustements convenus entre les parties.");
  const [amendmentChanges, setAmendmentChanges] = useState("Les parties conviennent de mettre à jour le périmètre de mission, le calendrier d’exécution et, le cas échéant, les conditions opérationnelles liées à la prestation.");
  const [amendmentCarryOver, setAmendmentCarryOver] = useState("Toutes les autres clauses du document initial demeurent inchangées et continuent de produire leurs effets, sauf stipulation contraire expressément prévue au présent avenant.");
  const [companySignatory, setCompanySignatory] = useState("Mathis — Atelio Flow");
  const [clientSignatory, setClientSignatory] = useState("Nom du représentant client");
  const [lines, setLines] = useState<LineItem[]>(initialLines);
  const [stepIndex, setStepIndex] = useState(0);
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; text: string } | null>(null);
  const [isEditingExistingDocument, setIsEditingExistingDocument] = useState(false);
  const [hasManualNumberEdit, setHasManualNumberEdit] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

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
    function syncWorkspace() {
      const nextAccount = loadAccount();
      const storedClients = loadClients();
      setAccount(nextAccount);
      setCompanyName(nextAccount.companyName);
      setCompanyAddress(nextAccount.companyAddress);
      setCompanyMeta(nextAccount.companyMeta);
      setCompanyLogoUrl(nextAccount.logoUrl);
      setPaymentTerms(nextAccount.defaultPaymentTerms);
      setFooterNote(nextAccount.footerNote);
      setClients(storedClients);
      if (storedClients[0]?.name) {
        setClientName(storedClients[0].name);
        setClientMeta(storedClients[0].coordinates);
      }
    }

    syncWorkspace();
    window.addEventListener("atelio-account-updated", syncWorkspace);
    return () => window.removeEventListener("atelio-account-updated", syncWorkspace);
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

      setIsEditingExistingDocument(true);
      setHasManualNumberEdit(true);
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

  useEffect(() => {
    if (isEditingExistingDocument || hasManualNumberEdit) return;

    const nextNumber = getNextDocumentNumber(loadDocuments(), docType, issueDate);
    setNumber(nextNumber);
  }, [docType, issueDate, hasManualNumberEdit, isEditingExistingDocument]);

  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.quantity * numberFromValue(line.unitPrice), 0),
    [lines]
  );
  const currentStep = editorSteps[stepIndex];
  const progress = ((stepIndex + 1) / editorSteps.length) * 100;
  const effectiveTaxRate = hasTax ? numberFromValue(taxRate) / 100 : 0;
  const subtotalHtBeforeDiscount =
    priceMode === "ht" ? subtotal : effectiveTaxRate > 0 ? subtotal / (1 + effectiveTaxRate) : subtotal;
  const subtotalTtcBeforeDiscount = hasTax ? subtotalHtBeforeDiscount * (1 + effectiveTaxRate) : subtotalHtBeforeDiscount;
  const discountAmount = hasDiscount ? subtotalHtBeforeDiscount * (numberFromValue(discountRate) / 100) : 0;
  const subtotalAfterDiscount = subtotalHtBeforeDiscount - discountAmount;
  const taxAmount = hasTax ? subtotalAfterDiscount * effectiveTaxRate : 0;
  const total = subtotalAfterDiscount + taxAmount;
  const summaryPriceModeLabel = priceMode === "ht" ? "Prix saisis en HT" : "Prix saisis en TTC";
  const summaryTaxLabel = hasTax ? `TVA appliquée (${taxRate || "0"}%)` : "Sans TVA";
  const summaryDiscountLabel = hasDiscount ? `Remise ${discountRate || "0"}%` : "Sans remise";

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
        unitPrice: "0"
      }
    ]);
  }

  function removeLine(id: number) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current));
  }

  function goToPreviousStep() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function goToNextStep() {
    setStepIndex((current) => Math.min(editorSteps.length - 1, current + 1));
  }

  function openUpgradeModal(title: string, text: string) {
    setUpgradeModal({ title, text });
  }

  function handleDownloadPdf() {
    setActionFeedback(null);
    const saved = persistDocument("Brouillon");
    if (!saved) {
      setActionFeedback({ type: "error", text: "Impossible d’enregistrer le document avant téléchargement." });
      return;
    }
    if (!previewRef.current) {
      setActionFeedback({ type: "error", text: "Aperçu introuvable pour générer le PDF." });
      return;
    }
    void downloadElementAsPdf(previewRef.current, `${saved}.pdf`)
      .then(() => {
        setActionFeedback({ type: "success", text: "Téléchargement du PDF lancé." });
      })
      .catch((error) => {
        setActionFeedback({
          type: "error",
          text: error instanceof Error ? error.message : "Le téléchargement du PDF a échoué."
        });
      });
  }

  function handleSelectClient(nextClient: string) {
    setClientName(nextClient);
    setClientMeta(clientDirectory[nextClient] ?? "Coordonnées à compléter");
  }

  function persistDocument(nextStatus: string) {
    if ((docType === "contrat" || docType === "avenant") && !canUseLockedDocumentTypes(account)) {
      openUpgradeModal("Fonction Pro", "Les contrats et avenants sont réservés au plan Pro.");
      return null;
    }

    const recipientName = recipientMode === "client" ? clientName : customRecipientName.trim() || "Nom libre";
    const nextClientEmail =
      recipientMode === "client"
        ? clients.find((client) => client.name === clientName)?.contactEmail
        : clientMeta.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

    const nextDocuments = loadDocuments();
    const documentTypeLabel =
      docType === "facture" ? "Facture" : docType === "devis" ? "Devis" : docType === "contrat" ? "Contrat" : "Avenant";
    const amountValue = isInvoiceFamily ? formatCurrency(total) : "0,00 €";

    const nextDocument: StoredDocument = {
      id: `${getDocumentPrefix(documentTypeLabel)}-${number}`,
      client: recipientName,
      date: issueDate,
      due: dueDate || "—",
      amount: amountValue,
      status: nextStatus,
      type: documentTypeLabel
    };

    const existingIndex = nextDocuments.findIndex((row) => row.id === nextDocument.id);
    if (existingIndex < 0 && !canCreateDocument(account, nextDocuments.length)) {
      openUpgradeModal(
        "Limite de documents atteinte",
        "Le plan Gratuit permet jusqu’à 10 documents. Passe à Pro pour continuer à créer et enregistrer sans limite."
      );
      return null;
    }

    if (existingIndex >= 0) {
      nextDocuments[existingIndex] = nextDocument;
    } else {
      nextDocuments.unshift(nextDocument);
    }

    const hydratedClients = upsertClientFromDocument(clients, {
      name: recipientName,
      email: nextClientEmail,
      coordinates: clientMeta
    });
    const nextHydratedClients = hydratedClients.map((client) => {
      const linkedDocs = nextDocuments.filter((row) => row.client === client.name);
      const totalValue = linkedDocs.reduce((sum, row) => {
        const parsed = Number(row.amount.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        return sum + parsed;
      }, 0);

      return {
        ...client,
        docs: linkedDocs.length,
        total: `${totalValue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
      };
    });

    saveDocuments(nextDocuments);
    saveClients(nextHydratedClients);
    setClients(nextHydratedClients);
    return nextDocument.id;
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

      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Création</div>
          <h1 className={styles.title}>
            <span className={styles.gradient}>Éditeur Devis · Facture · Contrat</span>
          </h1>
        </div>
      </section>

      <section className={styles.stepperPanel}>
        <div className={styles.stepperHeader}>
          <div>
            <span className={styles.stepperLabel}>Parcours guidé</span>
            <strong className={styles.stepperTitle}>Étape {stepIndex + 1} sur {editorSteps.length}</strong>
          </div>
          <span className={styles.stepperCurrent}>{currentStep.title}</span>
        </div>
        <div className={styles.stepTrack}>
          <div className={styles.stepProgress} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.stepList}>
          {editorSteps.map((step, index) => (
            <button
              className={`${styles.stepChip} ${index === stepIndex ? styles.stepChipActive : ""} ${index < stepIndex ? styles.stepChipDone : ""}`}
              key={step.id}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>{step.short}</span>
            </button>
          ))}
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
                "--editor-text-color": textColor,
                "--editor-secondary-text-color": secondaryTextColor
              } as CSSProperties
            }
          >
            <div className={styles.docHead}>
              <div className={styles.brandBlock}>
                {companyLogoUrl ? (
                  <img alt="Logo entreprise" className={styles.companyLogo} src={companyLogoUrl} />
                ) : null}
                <div>
                  <div className={styles.companyName}>{companyName}</div>
                  <div className={styles.muted}>
                    {companyAddress}
                    <br />
                    {companyMeta}
                  </div>
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
                      <th>{priceMode === "ht" ? "P.U. HT" : "P.U. TTC"}</th>
                      <th>{priceMode === "ht" ? "Total HT" : "Total TTC"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.description}</td>
                        <td>{line.quantity}</td>
                        <td>{formatCurrency(numberFromValue(line.unitPrice))}</td>
                        <td>{formatCurrency(line.quantity * numberFromValue(line.unitPrice))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className={styles.totals}>
                  <div className={styles.totalRow}><span>{hasTax ? "Sous-total HT" : "Sous-total"}</span><span>{formatCurrency(hasTax ? subtotalAfterDiscount : total)}</span></div>
                  {hasDiscount ? (
                    <div className={styles.totalRow}><span>Remise ({discountRate}%)</span><span>-{formatCurrency(discountAmount)}</span></div>
                  ) : null}
                  {hasTax ? (
                    <div className={styles.totalRow}><span>TVA {taxRate}%</span><span>{formatCurrency(taxAmount)}</span></div>
                  ) : null}
                  <div className={styles.totalFinal}><span>{hasTax ? "Total TTC" : "Total"}</span><span>{formatCurrency(total)}</span></div>
                </div>
              </>
            )}

            <div className={styles.footer}>{footerNote}</div>
          </article>
        </div>

        <aside className={styles.rightColumn}>
          <div className={`${styles.panel} ${styles.wizardPanel}`}>
            <div className={styles.wizardHeader}>
              <span className={styles.panelTitle}>Étape {stepIndex + 1}</span>
              <strong className={styles.wizardTitle}>{currentStep.title}</strong>
              <p className={styles.panelNote}>{currentStep.description}</p>
            </div>

            {currentStep.id === "type" ? (
              <div className={styles.stepBody}>
                <div className={styles.typeRow}>
                  {docTypes.map((type) => {
                    const locked = (type.id === "contrat" || type.id === "avenant") && !canUseLockedDocumentTypes(account);

                    return (
                      <button
                        className={`${styles.typeButton} ${docType === type.id ? styles.typeActive : ""} ${locked ? styles.typeLocked : ""}`}
                        key={type.id}
                        onClick={() => {
                          if (locked) {
                            openUpgradeModal("Type réservé à Pro", "Les contrats et avenants sont disponibles avec le plan Pro.");
                            return;
                          }
                          setDocType(type.id);
                        }}
                        type="button"
                      >
                        {type.label}
                        {locked ? <span className={styles.lockBadge}>Pro</span> : null}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.panelNote}>{selectedType.note}</p>
              </div>
            ) : null}

            {currentStep.id === "recipient" ? (
              <div className={styles.stepBody}>
                <div className={styles.formRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>Numéro</span>
                    <input
                      className={styles.input}
                      onChange={(event) => {
                        setHasManualNumberEdit(true);
                        setNumber(event.target.value);
                      }}
                      value={number}
                    />
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

                <div className={styles.field}>
                  <span className={styles.label}>Destinataire</span>
                  <div className={styles.typeRow}>
                    <button
                      className={`${styles.typeButton} ${recipientMode === "client" ? styles.typeActive : ""}`}
                      onClick={() => setRecipientMode("client")}
                      type="button"
                    >
                      Client
                    </button>
                    <button
                      className={`${styles.typeButton} ${recipientMode === "custom" ? styles.typeActive : ""}`}
                      onClick={() => setRecipientMode("custom")}
                      type="button"
                    >
                      Nouveau client
                    </button>
                  </div>
                </div>

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
            ) : null}

            {currentStep.id === "issuer" ? (
              <div className={styles.stepBody}>
                <div className={styles.accountHint}>
                  <div>
                    <span className={styles.panelTitle}>Logo et identité</span>
                    <p className={styles.panelNote}>
                      Le logo et ces informations sont repris depuis <a href="/compte">Mon compte</a>.
                    </p>
                  </div>
                  {companyLogoUrl ? <img alt="Logo entreprise" className={styles.accountLogoPreview} src={companyLogoUrl} /> : null}
                </div>
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
            ) : null}

            {currentStep.id === "content" ? (
              <div className={styles.stepBody}>
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
                  <>
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
                              <span className={styles.label}>{priceMode === "ht" ? "P.U. HT" : "P.U. TTC"}</span>
                              <input
                                className={styles.input}
                                inputMode="decimal"
                                onChange={(event) => updateLine(line.id, { unitPrice: event.target.value })}
                                type="text"
                                value={line.unitPrice}
                              />
                            </label>
                          </div>

                          <div className={styles.lineTotal}>Total ligne : {formatCurrency(line.quantity * numberFromValue(line.unitPrice))}</div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.calcSection}>
                      <div className={styles.sectionTitleRow}>
                        <div className={styles.panelTitle}>Calcul et note</div>
                      </div>

                      <div className={styles.calcSimpleGrid}>
                        <label className={styles.field}>
                          <span className={styles.label}>Prix saisis en</span>
                          <select
                            className={styles.input}
                            onChange={(event) => setPriceMode(event.target.value as "ht" | "ttc")}
                            value={priceMode}
                          >
                            <option value="ht">HT</option>
                            <option value="ttc">TTC</option>
                          </select>
                        </label>

                        <label className={styles.field}>
                          <span className={styles.label}>TVA</span>
                          <select
                            className={styles.input}
                            onChange={(event) => setHasTax(event.target.value === "oui")}
                            value={hasTax ? "oui" : "non"}
                          >
                            <option value="non">Non</option>
                            <option value="oui">Oui</option>
                          </select>
                        </label>
                      </div>

                      {hasTax ? (
                        <label className={styles.field}>
                          <span className={styles.label}>Taux de TVA (%)</span>
                          <input
                            className={styles.input}
                            inputMode="decimal"
                            onChange={(event) => setTaxRate(event.target.value)}
                            type="text"
                            value={taxRate}
                          />
                        </label>
                      ) : null}

                      <div className={styles.calcSimpleGrid}>
                        <label className={styles.field}>
                          <span className={styles.label}>Remise</span>
                          <select
                            className={styles.input}
                            onChange={(event) => setHasDiscount(event.target.value === "oui")}
                            value={hasDiscount ? "oui" : "non"}
                          >
                            <option value="non">Non</option>
                            <option value="oui">Oui</option>
                          </select>
                        </label>

                        {hasDiscount ? (
                          <label className={styles.field}>
                            <span className={styles.label}>Taux de remise (%)</span>
                            <input
                              className={styles.input}
                              inputMode="decimal"
                              onChange={(event) => setDiscountRate(event.target.value)}
                              type="text"
                              value={discountRate}
                            />
                          </label>
                        ) : (
                          <div className={styles.field} />
                        )}
                      </div>

                      <div className={styles.calcSummary}>
                        <div className={styles.calcSummaryHead}>
                          <strong>Récapitulatif</strong>
                          <span>{summaryPriceModeLabel}</span>
                        </div>
                        <div className={styles.calcSummaryRow}>
                          <span>{summaryTaxLabel}</span>
                          <span>{hasTax ? "Sous-total HT puis Total TTC" : "Total simple sans TVA"}</span>
                        </div>
                        <div className={styles.calcSummaryRow}>
                          <span>{summaryDiscountLabel}</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>

                      <label className={styles.field}>
                        <span className={styles.label}>Note de bas de page</span>
                        <textarea className={`${styles.input} ${styles.textarea}`} onChange={(event) => setFooterNote(event.target.value)} onInput={autoResizeTextarea} value={footerNote} />
                      </label>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {currentStep.id === "finalize" ? (
              <div className={styles.stepBody}>
                <div className={styles.finalizeStack}>
                  <div>
                    <div className={styles.panelTitle}>{isContractFamily ? "Validation & note" : "Vérification finale"}</div>
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
                      <div className={styles.finalReview}>
                        <div className={styles.calcSummary}>
                          <div className={styles.calcSummaryHead}>
                            <strong>Mode de calcul</strong>
                            <span>{summaryPriceModeLabel}</span>
                          </div>
                          <div className={styles.calcSummaryRow}>
                            <span>Sous-total</span>
                            <span>{hasTax ? "HT" : "Simple"}</span>
                          </div>
                          <div className={styles.calcSummaryRow}>
                            <span>TVA</span>
                            <span>{hasTax ? `${taxRate || "0"} %` : "Non"}</span>
                          </div>
                          <div className={styles.calcSummaryRow}>
                            <span>Remise</span>
                            <span>{hasDiscount ? `${discountRate || "0"} %` : "Non"}</span>
                          </div>
                          <div className={styles.calcSummaryRow}>
                            <span>Total final</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className={styles.panelTitle}>Personnalisation PDF</div>
                    <div className={styles.formRow}>
                      <label className={styles.field}>
                        <span className={styles.label}>Couleur d’accent</span>
                        <input
                          className={`${styles.input} ${styles.colorInput}`}
                          onChange={(event) => setAccentColor(event.target.value)}
                          type="color"
                          value={accentColor}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.label}>Couleur du texte principal</span>
                        <input
                          className={`${styles.input} ${styles.colorInput}`}
                          onChange={(event) => setTextColor(event.target.value)}
                          type="color"
                          value={textColor}
                        />
                      </label>
                    </div>
                    <label className={styles.field}>
                      <span className={styles.label}>Couleur du texte secondaire</span>
                      <input
                        className={`${styles.input} ${styles.colorInput}`}
                        onChange={(event) => setSecondaryTextColor(event.target.value)}
                        type="color"
                        value={secondaryTextColor}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Couleur de fond</span>
                      <input
                        className={`${styles.input} ${styles.colorInput}`}
                        onChange={(event) => setPageBackground(event.target.value)}
                        type="color"
                        value={pageBackground}
                      />
                    </label>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className="button button-secondary"
                      onClick={() => {
                        setActionFeedback(null);
                        const savedId = persistDocument("Brouillon");
                        if (savedId) {
                          setActionFeedback({ type: "success", text: "Brouillon enregistré. Redirection en cours..." });
                          router.push(`/documents?doc=${encodeURIComponent(savedId)}`);
                        } else {
                          setActionFeedback({ type: "error", text: "Impossible d’enregistrer ce brouillon pour le moment." });
                        }
                      }}
                      type="button"
                    >
                      Brouillon
                    </button>
                    <button className="button button-primary" onClick={handleDownloadPdf} type="button">Télécharger PDF</button>
                  </div>
                  {actionFeedback ? (
                    <div className={actionFeedback.type === "error" ? styles.errorFeedback : styles.successFeedback}>
                      {actionFeedback.text}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className={styles.wizardActions}>
              <button
                className="button button-secondary"
                disabled={stepIndex === 0}
                onClick={goToPreviousStep}
                type="button"
              >
                Précédent
              </button>
              {stepIndex < editorSteps.length - 1 ? (
                <button className="button button-primary" onClick={goToNextStep} type="button">
                  Suivant
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
