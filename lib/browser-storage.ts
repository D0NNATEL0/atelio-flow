"use client";

export type ClientRecord = {
  client: string;
  contact: string;
  email: string;
  status: string;
  total: string;
};

export type QuoteRecord = {
  id: string;
  client: string;
  amount: string;
  status: string;
  due: string;
};

export type InvoiceRecord = {
  id: string;
  client: string;
  amount: string;
  status: string;
  due: string;
};

const STORAGE_KEYS = {
  clients: "atelio_clients",
  quotes: "atelio_quotes",
  invoices: "atelio_invoices"
} as const;

function readItems<T>(key: string) {
  if (typeof window === "undefined") {
    return [] as T[];
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [] as T[];
  }
}

function writeItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getStoredClients() {
  return readItems<ClientRecord>(STORAGE_KEYS.clients);
}

export function addStoredClient(record: ClientRecord) {
  writeItems(STORAGE_KEYS.clients, [record, ...getStoredClients()]);
}

export function setStoredClients(records: ClientRecord[]) {
  writeItems(STORAGE_KEYS.clients, records);
}

export function getStoredQuotes() {
  return readItems<QuoteRecord>(STORAGE_KEYS.quotes);
}

export function addStoredQuote(record: QuoteRecord) {
  writeItems(STORAGE_KEYS.quotes, [record, ...getStoredQuotes()]);
}

export function setStoredQuotes(records: QuoteRecord[]) {
  writeItems(STORAGE_KEYS.quotes, records);
}

export function getStoredInvoices() {
  return readItems<InvoiceRecord>(STORAGE_KEYS.invoices);
}

export function addStoredInvoice(record: InvoiceRecord) {
  writeItems(STORAGE_KEYS.invoices, [record, ...getStoredInvoices()]);
}

export function setStoredInvoices(records: InvoiceRecord[]) {
  writeItems(STORAGE_KEYS.invoices, records);
}

export function formatEuroAmount(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "0 €";
  }

  return `${amount.toLocaleString("fr-FR")} €`;
}

export function getTodayLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

export function getInvoiceDueLabel(daysToAdd: number) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(targetDate);
}
