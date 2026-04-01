import { clientRows, documentRows } from "@/data";

export type StoredClient = {
  name: string;
  email: string;
  contactEmail: string;
  phone: string;
  coordinates: string;
  initials: string;
  total: string;
  docs: number;
  accent: "violet" | "coral" | "cyan" | "green" | "amber" | "pink";
};

export type StoredDocument = {
  id: string;
  client: string;
  date: string;
  due: string;
  amount: string;
  status: string;
  type: string;
};

const CLIENTS_KEY = "atelio_clients_v1";
const DOCUMENTS_KEY = "atelio_documents_v1";

const accents: StoredClient["accent"][] = ["violet", "coral", "cyan", "green", "amber", "pink"];

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

function formatAmount(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CL"
  );
}

export function defaultClients(): StoredClient[] {
  return clientRows.map((client) => ({
    ...client,
    email: client.email,
    contactEmail: client.email,
    phone: "À compléter",
    coordinates: `${client.email} · Coordonnées à compléter`
  }));
}

export function defaultDocuments(): StoredDocument[] {
  return documentRows.map((row) => ({ ...row }));
}

export function hydrateClients(clients: StoredClient[], documents: StoredDocument[]) {
  return clients.map((client) => {
    const linkedDocs = documents.filter((row) => row.client === client.name);
    const total = linkedDocs.reduce((sum, row) => sum + parseAmount(row.amount), 0);

    return {
      ...client,
      docs: linkedDocs.length,
      total: linkedDocs.length ? formatAmount(total) : client.total
    };
  });
}

export function loadClients(): StoredClient[] {
  if (!canUseStorage()) return defaultClients();

  const raw = window.localStorage.getItem(CLIENTS_KEY);
  if (!raw) return defaultClients();

  try {
    return JSON.parse(raw) as StoredClient[];
  } catch {
    return defaultClients();
  }
}

export function saveClients(clients: StoredClient[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function loadDocuments(): StoredDocument[] {
  if (!canUseStorage()) return defaultDocuments();

  const raw = window.localStorage.getItem(DOCUMENTS_KEY);
  if (!raw) return defaultDocuments();

  try {
    return JSON.parse(raw) as StoredDocument[];
  } catch {
    return defaultDocuments();
  }
}

export function saveDocuments(documents: StoredDocument[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

export function upsertClientFromDocument(
  clients: StoredClient[],
  recipient: { name: string; email?: string; coordinates: string }
) {
  const existing = clients.find((client) => client.name === recipient.name);
  if (existing) {
    return clients.map((client) =>
      client.name === recipient.name
        ? {
            ...client,
            contactEmail: recipient.email || client.contactEmail,
            email: recipient.email || client.email,
            coordinates: recipient.coordinates || client.coordinates
          }
        : client
    );
  }

  const nextClient: StoredClient = {
    name: recipient.name,
    email: recipient.email || "contact@client.fr",
    contactEmail: recipient.email || "contact@client.fr",
    phone: "À compléter",
    coordinates: recipient.coordinates || "Coordonnées à compléter",
    initials: initialsFromName(recipient.name),
    total: "0 €",
    docs: 0,
    accent: accents[clients.length % accents.length]
  };

  return [nextClient, ...clients];
}
