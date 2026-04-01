"use client";

import type { CSSProperties } from "react";
import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addStoredInvoice,
  getInvoiceDueLabel,
  getStoredClients
} from "@/lib/browser-storage";

type InvoiceStep = 1 | 2 | 3;

type AccountDraft = {
  companyName?: string;
  legalName?: string;
  professionalEmail?: string;
  phone?: string;
  website?: string;
  vatNumber?: string;
  siretNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  logoUrl?: string;
};

type ClientOption = {
  client: string;
  contact: string;
  email: string;
  status: string;
  total: string;
};

const defaultLegal = {
  companyName: "Atelio Studio",
  legalName: "Atelio Studio",
  professionalEmail: "contact@atelio.app",
  phone: "+33 6 12 34 56 78",
  vatNumber: "",
  siretNumber: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "Paris",
  website: "",
  logoUrl: ""
};

const styleThemes = [
  {
    id: "orange",
    label: "Orange Atelio",
    accent: "#f28c28",
    panel: "#fff7ef",
    text: "#171717",
    surface: "#ffffff",
    swatches: ["#f28c28", "#fff7ef", "#171717"]
  },
  {
    id: "terracotta",
    label: "Terracotta",
    accent: "#c96f45",
    panel: "#fff4ef",
    text: "#2e241f",
    surface: "#fffdfb",
    swatches: ["#c96f45", "#fff4ef", "#2e241f"]
  },
  {
    id: "carbon",
    label: "Noir premium",
    accent: "#171717",
    panel: "#f4f1ec",
    text: "#111111",
    surface: "#ffffff",
    swatches: ["#171717", "#f4f1ec", "#111111"]
  },
  {
    id: "sand",
    label: "Sable chaud",
    accent: "#bb7a44",
    panel: "#fbf3ea",
    text: "#2f241c",
    surface: "#fffdf9",
    swatches: ["#bb7a44", "#fbf3ea", "#2f241c"]
  },
  {
    id: "navy",
    label: "Bleu nuit",
    accent: "#355c7d",
    panel: "#f2f6fb",
    text: "#203040",
    surface: "#fcfdff",
    swatches: ["#355c7d", "#f2f6fb", "#203040"]
  },
  {
    id: "rose",
    label: "Rose sable",
    accent: "#c06c84",
    panel: "#fff4f7",
    text: "#3c2530",
    surface: "#fffdfd",
    swatches: ["#c06c84", "#fff4f7", "#3c2530"]
  },
  {
    id: "mocha",
    label: "Moka",
    accent: "#8a5a44",
    panel: "#f8f1ec",
    text: "#2f241f",
    surface: "#fffdfa",
    swatches: ["#8a5a44", "#f8f1ec", "#2f241f"]
  },
  {
    id: "plum",
    label: "Prune douce",
    accent: "#7f4f75",
    panel: "#faf4fa",
    text: "#322131",
    surface: "#fffdfd",
    swatches: ["#7f4f75", "#faf4fa", "#322131"]
  }
] as const;

const fontThemes = [
  { id: "jakarta", label: "Moderne", family: '"Plus Jakarta Sans", "Segoe UI", sans-serif' },
  { id: "serif", label: "Signature", family: '"Iowan Old Style", "Georgia", serif' },
  { id: "clean", label: "Éditorial", family: '"Avenir Next", "Helvetica Neue", sans-serif' },
  { id: "grotesk", label: "Grotesk", family: '"Gill Sans", "Trebuchet MS", sans-serif' },
  { id: "classic", label: "Classique", family: '"Baskerville", "Times New Roman", serif' }
] as const;

function readAccountDraft() {
  if (typeof window === "undefined") {
    return {} as AccountDraft;
  }

  try {
    const raw = localStorage.getItem("atelio_onboarding_draft");
    return raw ? (JSON.parse(raw) as AccountDraft) : ({} as AccountDraft);
  } catch {
    return {} as AccountDraft;
  }
}

function numberFromInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} €`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function CreateInvoiceForm() {
  const router = useRouter();
  const [step, setStep] = useState<InvoiceStep>(1);
  const [isPending, startTransition] = useTransition();
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);

  const [companyName, setCompanyName] = useState(defaultLegal.companyName);
  const [legalName, setLegalName] = useState(defaultLegal.legalName);
  const [professionalEmail, setProfessionalEmail] = useState(defaultLegal.professionalEmail);
  const [phone, setPhone] = useState(defaultLegal.phone);
  const [vatNumber, setVatNumber] = useState(defaultLegal.vatNumber);
  const [siretNumber, setSiretNumber] = useState(defaultLegal.siretNumber);
  const [addressLine1, setAddressLine1] = useState(defaultLegal.addressLine1);
  const [addressLine2, setAddressLine2] = useState(defaultLegal.addressLine2);
  const [postalCode, setPostalCode] = useState(defaultLegal.postalCode);
  const [city, setCity] = useState(defaultLegal.city);
  const [website, setWebsite] = useState(defaultLegal.website);
  const [logoUrl, setLogoUrl] = useState(defaultLegal.logoUrl);

  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("Prestation créative");
  const [amountHt, setAmountHt] = useState("1200");
  const [taxRate, setTaxRate] = useState("20");
  const [dueDelay, setDueDelay] = useState("30");
  const [paymentNote, setPaymentNote] = useState("Règlement à réception de facture.");

  const [fontTheme, setFontTheme] = useState<(typeof fontThemes)[number]["id"]>("jakarta");
  const [colorTheme, setColorTheme] = useState<(typeof styleThemes)[number]["id"]>("orange");
  const [backgroundColor, setBackgroundColor] = useState("#fff7ef");
  const [textColor, setTextColor] = useState("#171717");

  useEffect(() => {
    const draft = readAccountDraft();
    const clients = getStoredClients();

    setClientOptions(clients);
    setCompanyName(draft.companyName || defaultLegal.companyName);
    setLegalName(draft.legalName || draft.companyName || defaultLegal.legalName);
    setProfessionalEmail(draft.professionalEmail || defaultLegal.professionalEmail);
    setPhone(draft.phone || defaultLegal.phone);
    setVatNumber(draft.vatNumber || defaultLegal.vatNumber);
    setSiretNumber(draft.siretNumber || defaultLegal.siretNumber);
    setAddressLine1(draft.addressLine1 || defaultLegal.addressLine1);
    setAddressLine2(draft.addressLine2 || defaultLegal.addressLine2);
    setPostalCode(draft.postalCode || defaultLegal.postalCode);
    setCity(draft.city || defaultLegal.city);
    setWebsite(draft.website || defaultLegal.website);
    setLogoUrl(draft.logoUrl || defaultLegal.logoUrl);

    if (clients[0]) {
      setClientName(clients[0].client);
      setClientContact(clients[0].contact);
      setClientEmail(clients[0].email);
    }
  }, []);

  const selectedTheme = useMemo(
    () => styleThemes.find((theme) => theme.id === colorTheme) ?? styleThemes[0],
    [colorTheme]
  );

  const selectedFont = useMemo(
    () => fontThemes.find((theme) => theme.id === fontTheme) ?? fontThemes[0],
    [fontTheme]
  );

  useEffect(() => {
    setBackgroundColor(selectedTheme.panel);
    setTextColor(selectedTheme.text);
  }, [selectedTheme]);

  const subtotal = numberFromInput(amountHt);
  const taxAmount = subtotal * (numberFromInput(taxRate) / 100);
  const totalAmount = subtotal + taxAmount;
  const dueLabel = getInvoiceDueLabel(Number(dueDelay));
  const paymentLabel = `${dueDelay} jours`;
  const previewInitial = (companyName || "A").trim().charAt(0).toUpperCase();

  function handleClientSelection(name: string) {
    setClientName(name);
    const selectedClient = clientOptions.find((option) => option.client === name);

    if (!selectedClient) {
      return;
    }

    setClientContact(selectedClient.contact);
    setClientEmail(selectedClient.email);
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function goNext() {
    setStep((currentStep) => (currentStep < 3 ? ((currentStep + 1) as InvoiceStep) : currentStep));
  }

  function goBack() {
    setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as InvoiceStep) : currentStep));
  }

  function persistInvoice(status: "Brouillon" | "Envoyée") {
    addStoredInvoice({
      id: `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      client: clientName.trim(),
      amount: formatAmount(totalAmount),
      status,
      due: dueLabel
    });
  }

  function handleDownload() {
    startTransition(async () => {
      persistInvoice("Brouillon");

      const printableWindow = window.open("", "_blank", "width=980,height=1280");

      if (!printableWindow) {
        return;
      }

      const printableHtml = `
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <title>Facture ${escapeHtml(clientName || "Atelio")}</title>
            <style>
              :root {
                --accent: ${selectedTheme.accent};
                --panel: ${backgroundColor};
                --text: ${textColor};
                --surface: ${selectedTheme.surface};
              }

              * { box-sizing: border-box; }

              body {
                margin: 0;
                padding: 32px;
                background: #f3efe8;
                color: var(--text);
                font-family: ${selectedFont.family};
              }

              .sheet {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 24mm 18mm;
                background: linear-gradient(180deg, var(--surface), var(--panel));
              }

              .head,
              .columns,
              .totals {
                display: grid;
                gap: 18px;
              }

              .head,
              .columns {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }

              .brand {
                display: flex;
                gap: 16px;
                align-items: center;
              }

              .logo {
                width: 72px;
                height: 72px;
                border-radius: 20px;
                background: white;
                border: 1px solid rgba(17,17,17,.08);
                display: grid;
                place-items: center;
                overflow: hidden;
                color: var(--accent);
                font-size: 28px;
                font-weight: 700;
              }

              .logo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .eyebrow {
                color: var(--accent);
                text-transform: uppercase;
                letter-spacing: .08em;
                font-size: 12px;
                font-weight: 700;
              }

              .meta {
                text-align: right;
              }

              h1, h2, h3, p { margin: 0; }

              .company-name {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 6px;
              }

              .muted {
                color: rgba(17,17,17,.56);
              }

              .card {
                margin-top: 18px;
                padding: 18px;
                border: 1px solid rgba(17,17,17,.06);
                border-radius: 18px;
                background: rgba(255,255,255,.82);
              }

              .line-item,
              .total-item {
                display: flex;
                justify-content: space-between;
                gap: 16px;
              }

              .totals {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                margin-top: 18px;
              }

              .highlight {
                background: rgba(242,140,40,.10);
              }

              .footer {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid rgba(17,17,17,.08);
                font-size: 13px;
                color: rgba(17,17,17,.68);
              }

              @page {
                size: A4;
                margin: 0;
              }

              @media print {
                body {
                  padding: 0;
                  background: white;
                }

                .sheet {
                  width: auto;
                  min-height: auto;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <main class="sheet">
              <section class="head">
                <div class="brand">
                  <div class="logo">
                    ${
                      logoUrl
                        ? `<img alt="Logo" src="${escapeHtml(logoUrl)}" />`
                        : escapeHtml(previewInitial)
                    }
                  </div>
                  <div>
                    <p class="company-name">${escapeHtml(companyName || "Nom entreprise")}</p>
                    <p class="muted">${escapeHtml(legalName || "Raison sociale")}</p>
                  </div>
                </div>
                <div class="meta">
                  <p class="eyebrow">Facture</p>
                  <h2>FA-${new Date().getFullYear()}-Aperçu</h2>
                  <p class="muted">Échéance ${escapeHtml(dueLabel)}</p>
                </div>
              </section>

              <section class="columns card">
                <div>
                  <p class="eyebrow">Émetteur</p>
                  <p>${escapeHtml(addressLine1 || "Adresse à compléter")}</p>
                  <p>${escapeHtml([postalCode, city].filter(Boolean).join(" ") || "Code postal et ville")}</p>
                  <p>${escapeHtml(professionalEmail || "Email pro")}</p>
                  <p>${escapeHtml(phone || "Téléphone")}</p>
                </div>
                <div>
                  <p class="eyebrow">Client</p>
                  <p>${escapeHtml(clientName || "Nom du client")}</p>
                  <p>${escapeHtml(clientContact || "Contact principal")}</p>
                  <p>${escapeHtml(clientEmail || "email@client.fr")}</p>
                  <p>${escapeHtml(clientAddress || "Adresse du client")}</p>
                </div>
              </section>

              <section class="card">
                <p class="eyebrow">Objet facturé</p>
                <h3 style="margin: 10px 0 8px; font-size: 26px;">${escapeHtml(invoiceTitle)}</h3>
                <p class="muted">${escapeHtml(paymentNote)}</p>
              </section>

              <section class="card">
                <div class="line-item">
                  <div>
                    <p class="muted">Prestation</p>
                    <strong>${escapeHtml(invoiceTitle)}</strong>
                  </div>
                  <div style="text-align:right;">
                    <p class="muted">Montant HT</p>
                    <strong>${escapeHtml(formatAmount(subtotal))}</strong>
                  </div>
                </div>
              </section>

              <section class="totals">
                <div class="card total-item">
                  <div>
                    <p class="muted">Total HT</p>
                    <strong>${escapeHtml(formatAmount(subtotal))}</strong>
                  </div>
                </div>
                <div class="card total-item">
                  <div>
                    <p class="muted">TVA ${escapeHtml(taxRate)}%</p>
                    <strong>${escapeHtml(formatAmount(taxAmount))}</strong>
                  </div>
                </div>
                <div class="card total-item highlight">
                  <div>
                    <p class="muted">Total TTC</p>
                    <strong>${escapeHtml(formatAmount(totalAmount))}</strong>
                  </div>
                </div>
              </section>

              <footer class="footer">
                <span>SIRET ${escapeHtml(siretNumber || "à compléter")}</span>
                <span>TVA ${escapeHtml(vatNumber || "à compléter")}</span>
                <span>${escapeHtml(website || "site web optionnel")}</span>
              </footer>
            </main>
          </body>
        </html>
      `;

      printableWindow.document.open();
      printableWindow.document.write(printableHtml);
      printableWindow.document.close();
      printableWindow.focus();
      window.setTimeout(() => {
        printableWindow.print();
      }, 250);

      router.push("/app/factures");
      router.refresh();
    });
  }

  function handleSend() {
    startTransition(async () => {
      persistInvoice("Envoyée");
      router.push("/app/factures");
      router.refresh();
    });
  }

  return (
    <form className="quote-builder" onSubmit={(event) => event.preventDefault()}>
      <div className="quote-builder-steps">
        {[
          { id: 1, label: "Identité légale" },
          { id: 2, label: "Client" },
          { id: 3, label: "Aperçu" }
        ].map((item) => (
          <button
            className={`quote-step-pill ${step === item.id ? "is-active" : ""}`}
            key={item.id}
            onClick={() => setStep(item.id as InvoiceStep)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="quote-builder-grid">
        <article className="account-card quote-builder-panel">
          {step === 1 ? (
            <>
              <span className="panel-label">Étape 1</span>
              <h3>Informations légales</h3>
              <p className="metric-subtext">
                Ces données seront imprimées sur la facture. Le logo du compte est repris automatiquement si disponible.
              </p>

              <div className="account-form-grid quote-form-grid">
                <label className="field">
                  <span>Logo de l'entreprise</span>
                  <input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="input"
                    onChange={handleLogoUpload}
                    type="file"
                  />
                </label>

                <label className="field">
                  <span>Nom affiché</span>
                  <input className="input" onChange={(e) => setCompanyName(e.target.value)} value={companyName} />
                </label>

                <label className="field">
                  <span>Raison sociale</span>
                  <input className="input" onChange={(e) => setLegalName(e.target.value)} value={legalName} />
                </label>

                <label className="field">
                  <span>Email pro</span>
                  <input
                    className="input"
                    onChange={(e) => setProfessionalEmail(e.target.value)}
                    type="email"
                    value={professionalEmail}
                  />
                </label>

                <label className="field">
                  <span>Téléphone</span>
                  <input className="input" onChange={(e) => setPhone(e.target.value)} value={phone} />
                </label>

                <label className="field">
                  <span>SIRET</span>
                  <input className="input" onChange={(e) => setSiretNumber(e.target.value)} value={siretNumber} />
                </label>

                <label className="field">
                  <span>TVA</span>
                  <input className="input" onChange={(e) => setVatNumber(e.target.value)} value={vatNumber} />
                </label>

                <label className="field field-span-2">
                  <span>Adresse</span>
                  <input className="input" onChange={(e) => setAddressLine1(e.target.value)} value={addressLine1} />
                </label>

                <label className="field field-span-2">
                  <span>Complément d'adresse</span>
                  <input className="input" onChange={(e) => setAddressLine2(e.target.value)} value={addressLine2} />
                </label>

                <label className="field">
                  <span>Code postal</span>
                  <input className="input" onChange={(e) => setPostalCode(e.target.value)} value={postalCode} />
                </label>

                <label className="field">
                  <span>Ville</span>
                  <input className="input" onChange={(e) => setCity(e.target.value)} value={city} />
                </label>

                <label className="field field-span-2">
                  <span>Site web</span>
                  <input className="input" onChange={(e) => setWebsite(e.target.value)} value={website} />
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <span className="panel-label">Étape 2</span>
              <h3>Informations client</h3>
              <p className="metric-subtext">
                Repars d’un client existant puis ajuste l’objet, l’échéance et les montants de la facture.
              </p>

              <div className="account-form-grid quote-form-grid">
                <label className="field field-span-2">
                  <span>Client existant</span>
                  <select className="input" onChange={(e) => handleClientSelection(e.target.value)} value={clientName}>
                    <option value="">Choisir un client</option>
                    {clientOptions.map((client) => (
                      <option key={`${client.client}-${client.email}`} value={client.client}>
                        {client.client}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Nom client</span>
                  <input className="input" onChange={(e) => setClientName(e.target.value)} required value={clientName} />
                </label>

                <label className="field">
                  <span>Contact</span>
                  <input className="input" onChange={(e) => setClientContact(e.target.value)} value={clientContact} />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input className="input" onChange={(e) => setClientEmail(e.target.value)} type="email" value={clientEmail} />
                </label>

                <label className="field">
                  <span>Adresse client</span>
                  <input className="input" onChange={(e) => setClientAddress(e.target.value)} value={clientAddress} />
                </label>

                <label className="field field-span-2">
                  <span>Intitulé de la facture</span>
                  <input className="input" onChange={(e) => setInvoiceTitle(e.target.value)} value={invoiceTitle} />
                </label>

                <label className="field">
                  <span>Montant HT</span>
                  <input className="input" inputMode="decimal" onChange={(e) => setAmountHt(e.target.value)} value={amountHt} />
                </label>

                <label className="field">
                  <span>TVA %</span>
                  <input className="input" inputMode="decimal" onChange={(e) => setTaxRate(e.target.value)} value={taxRate} />
                </label>

                <label className="field">
                  <span>Échéance</span>
                  <select className="input" onChange={(e) => setDueDelay(e.target.value)} value={dueDelay}>
                    <option value="7">7 jours</option>
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="45">45 jours</option>
                    <option value="60">60 jours</option>
                  </select>
                </label>

                <label className="field">
                  <span>Condition de paiement</span>
                  <input className="input" onChange={(e) => setPaymentNote(e.target.value)} value={paymentNote} />
                </label>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <span className="panel-label">Étape 3</span>
              <h3>Aperçu et personnalisation</h3>
              <p className="metric-subtext">
                Ajuste le style de la facture avant de l’ajouter au suivi d’encaissement.
              </p>

              <div className="account-form-grid quote-form-grid">
                <div className="field field-span-2">
                  <span>Police</span>
                  <div className="quote-theme-grid quote-theme-grid-fonts">
                    {fontThemes.map((theme) => (
                      <button
                        className={`quote-theme-card ${fontTheme === theme.id ? "is-active" : ""}`}
                        key={theme.id}
                        onClick={() => setFontTheme(theme.id)}
                        type="button"
                      >
                        <span className="quote-font-preview" style={{ fontFamily: theme.family }}>
                          Aa
                        </span>
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field field-span-2">
                  <span>Couleurs</span>
                  <div className="quote-theme-grid">
                    {styleThemes.map((theme) => (
                      <button
                        className={`quote-theme-card ${colorTheme === theme.id ? "is-active" : ""}`}
                        key={theme.id}
                        onClick={() => {
                          setColorTheme(theme.id);
                          setBackgroundColor(theme.panel);
                          setTextColor(theme.text);
                        }}
                        type="button"
                      >
                        <span className="quote-theme-swatches" aria-hidden="true">
                          {theme.swatches.map((swatch) => (
                            <span className="quote-theme-swatch" key={swatch} style={{ background: swatch }} />
                          ))}
                        </span>
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field">
                  <span>Couleur du fond</span>
                  <input
                    className="input quote-color-input"
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    type="color"
                    value={backgroundColor}
                  />
                </label>

                <label className="field">
                  <span>Couleur du texte</span>
                  <input
                    className="input quote-color-input"
                    onChange={(e) => setTextColor(e.target.value)}
                    type="color"
                    value={textColor}
                  />
                </label>

                <div className="quote-preview-notes field-span-2">
                  <div className="quote-preview-note">
                    <span>Total HT</span>
                    <strong>{formatAmount(subtotal)}</strong>
                  </div>
                  <div className="quote-preview-note">
                    <span>TVA</span>
                    <strong>{formatAmount(taxAmount)}</strong>
                  </div>
                  <div className="quote-preview-note">
                    <span>Total TTC</span>
                    <strong>{formatAmount(totalAmount)}</strong>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <div className="quote-builder-actions">
            <button className="button button-secondary" disabled={step === 1} onClick={goBack} type="button">
              Retour
            </button>

            {step < 3 ? (
              <button className="button button-primary" onClick={goNext} type="button">
                Suivant
              </button>
            ) : (
              <div className="quote-preview-final-actions">
                <button className="button button-primary" disabled={isPending} onClick={handleDownload} type="button">
                  {isPending ? "Préparation..." : "Télécharger la facture"}
                </button>
                <button className="button button-primary" disabled={isPending} onClick={handleSend} type="button">
                  {isPending ? "Envoi..." : "Envoyer directement"}
                </button>
              </div>
            )}
          </div>
        </article>

        <article
          className="quote-document-preview"
          style={
            {
              "--quote-accent": selectedTheme.accent,
              "--quote-panel": backgroundColor,
              "--quote-text": textColor,
              "--quote-surface": selectedTheme.surface,
              fontFamily: selectedFont.family
            } as CSSProperties
          }
        >
          <div className="quote-preview-head">
            <div className="quote-preview-brand">
              <div className="quote-preview-logo">
                {logoUrl ? (
                  <img alt="Logo entreprise" src={logoUrl} />
                ) : (
                  <span>{previewInitial}</span>
                )}
              </div>
              <div className="quote-preview-brand-copy">
                <strong>{companyName || "Nom entreprise"}</strong>
                <p>{legalName || "Raison sociale"}</p>
              </div>
            </div>

            <div className="quote-preview-meta">
              <strong>FACTURE</strong>
              <span>FA-{new Date().getFullYear()}-Aperçu</span>
              <span>Échéance {dueLabel}</span>
            </div>
          </div>

          <div className="quote-preview-columns">
            <div className="quote-preview-column-card">
              <span className="quote-preview-label">Émetteur</span>
              <div className="quote-preview-stack">
                <p>{addressLine1 || "Adresse à compléter"}</p>
                <p>{[postalCode, city].filter(Boolean).join(" ") || "Code postal et ville"}</p>
                <p>{professionalEmail || "Email pro"}</p>
                <p>{phone || "Téléphone"}</p>
              </div>
            </div>

            <div className="quote-preview-column-card">
              <span className="quote-preview-label">Client</span>
              <div className="quote-preview-stack">
                <p>{clientName || "Nom du client"}</p>
                <p>{clientContact || "Contact principal"}</p>
                <p>{clientEmail || "email@client.fr"}</p>
                <p>{clientAddress || "Adresse du client"}</p>
              </div>
            </div>
          </div>

          <div className="quote-preview-title-block">
            <span className="quote-preview-label">Objet facturé</span>
            <h4>{invoiceTitle}</h4>
            <p>{paymentNote}</p>
          </div>

          <div className="quote-preview-line">
            <div className="quote-preview-line-item">
              <span>Prestation</span>
              <strong>{invoiceTitle}</strong>
            </div>
            <div className="quote-preview-line-item quote-preview-line-item-right">
              <span>Montant HT</span>
              <strong>{formatAmount(subtotal)}</strong>
            </div>
          </div>

          <div className="quote-preview-totals">
            <div className="quote-preview-total-card">
              <span>Total HT</span>
              <strong>{formatAmount(subtotal)}</strong>
            </div>
            <div className="quote-preview-total-card">
              <span>TVA {taxRate}%</span>
              <strong>{formatAmount(taxAmount)}</strong>
            </div>
            <div className="quote-preview-total-card is-highlighted">
              <span>Total TTC</span>
              <strong>{formatAmount(totalAmount)}</strong>
            </div>
          </div>

          <div className="quote-preview-legal">
            <span>SIRET {siretNumber || "à compléter"}</span>
            <span>TVA {vatNumber || "à compléter"}</span>
            <span>Règlement {paymentLabel}</span>
            <span>{website || "site web optionnel"}</span>
          </div>
        </article>
      </div>
    </form>
  );
}
