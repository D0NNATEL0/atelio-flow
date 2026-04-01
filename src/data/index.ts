export const navItems = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/documents", label: "Documents", icon: "◫", badge: "6" },
  { href: "/clients", label: "Clients", icon: "◉" },
  { href: "/editor", label: "Éditeur", icon: "✎" }
] as const;

export const documentRows = [
  { id: "FAC-2026-089", client: "TechCorp SAS", date: "28 mars 2026", due: "27 avr. 2026", amount: "4 850 €", status: "Payée", type: "Facture" },
  { id: "DEV-2026-034", client: "Studio Pixel", date: "25 mars 2026", due: "—", amount: "1 200 €", status: "En attente", type: "Devis" },
  { id: "FAC-2026-088", client: "LogiPro SARL", date: "20 mars 2026", due: "19 avr. 2026", amount: "7 320 €", status: "En retard", type: "Facture" },
  { id: "CTR-2026-012", client: "Agence Nova", date: "15 mars 2026", due: "—", amount: "12 500 €", status: "Signé", type: "Contrat" },
  { id: "FAC-2026-087", client: "BioTech Labs", date: "10 mars 2026", due: "9 avr. 2026", amount: "2 100 €", status: "Payée", type: "Facture" },
  { id: "DEV-2026-033", client: "Retail XP", date: "5 mars 2026", due: "—", amount: "890 €", status: "Brouillon", type: "Devis" }
] as const;

export const clientRows = [
  { name: "TechCorp SAS", email: "contact@techcorp.fr", initials: "TC", total: "48 200 €", docs: 14, accent: "violet" },
  { name: "Studio Pixel", email: "hello@studiopixel.fr", initials: "SP", total: "12 400 €", docs: 7, accent: "coral" },
  { name: "LogiPro SARL", email: "info@logipro.fr", initials: "LP", total: "31 750 €", docs: 11, accent: "cyan" },
  { name: "Agence Nova", email: "nova@agence.fr", initials: "AN", total: "25 000 €", docs: 5, accent: "green" },
  { name: "BioTech Labs", email: "labs@biotech.fr", initials: "BL", total: "9 600 €", docs: 3, accent: "amber" },
  { name: "Retail XP", email: "xp@retail.fr", initials: "RX", total: "6 200 €", docs: 4, accent: "pink" }
] as const;

export const dashboardKpis = [
  { label: "Chiffre d'affaires", value: "134 720 €", change: "+12,4% ce mois", accent: "coral" },
  { label: "Factures émises", value: "89", change: "+8 ce mois", accent: "violet" },
  { label: "En attente", value: "18 400 €", change: "6 factures", accent: "amber" },
  { label: "Clients actifs", value: "34", change: "+3 nouveaux", accent: "green" }
] as const;

export const recentActivity = [
  { icon: "◉", title: "TechCorp SAS", detail: "FAC-2026-089 · 28 mars 2026", amount: "4 850 €", status: "Payée", accent: "green" },
  { icon: "◫", title: "Studio Pixel", detail: "DEV-2026-034 · 25 mars 2026", amount: "1 200 €", status: "En attente", accent: "amber" },
  { icon: "◉", title: "LogiPro SARL", detail: "FAC-2026-088 · 20 mars 2026", amount: "7 320 €", status: "En retard", accent: "coral" },
  { icon: "✎", title: "Agence Nova", detail: "CTR-2026-012 · 15 mars 2026", amount: "12 500 €", status: "Signé", accent: "cyan" }
] as const;

export const monthlyStats = [
  { label: "Factures payées", value: "11", accent: "green" },
  { label: "Devis acceptés", value: "4", accent: "cyan" },
  { label: "En retard", value: "2", accent: "coral" },
  { label: "Taux de recouvrement", value: "94%", accent: "violet" }
] as const;

export const topClients = clientRows.slice(0, 3);

export const editorClients = clientRows.map((client) => client.name);
