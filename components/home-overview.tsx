import Link from "next/link";
import { RevenueChart } from "@/components/revenue-chart";
import { clientsTable, invoicesTable, quotesTable } from "@/lib/content";

const recentActivity = [
  {
    title: "Devis DV-2026-016 envoyé",
    detail: "Atelier Bloom · aujourd’hui"
  },
  {
    title: "Facture FA-2026-038 payée",
    detail: "Studio Noma · 28 mars"
  },
  {
    title: "Client Maison Aster ajouté",
    detail: "Julie Pons · cette semaine"
  }
] as const;

const quickLinks = [
  {
    eyebrow: "Base commerciale",
    title: "Clients",
    description: "Retrouve les fiches, notes et prochains dossiers à lancer.",
    href: "/app/clients",
    cta: "Ouvrir les clients"
  },
  {
    eyebrow: "Cycle de vente",
    title: "Devis",
    description: "Suis les propositions envoyées, en attente ou prêtes à convertir.",
    href: "/app/devis",
    cta: "Voir les devis"
  },
  {
    eyebrow: "Encaissements",
    title: "Factures",
    description: "Surveille les paiements, les échéances et les montants encore ouverts.",
    href: "/app/factures",
    cta: "Voir les factures"
  }
] as const;

const clientHighlights = clientsTable.slice(0, 3);
const quoteHighlights = quotesTable.slice(0, 3);
const invoiceHighlights = invoicesTable.slice(0, 3);

export function HomeOverview() {
  return (
    <div className="home-stack">
      <RevenueChart total="8 420 €" />

      <section className="home-secondary-grid">
        <article className="home-activity-card">
          <div className="home-section-head">
            <div>
              <span className="panel-label">Activité récente</span>
              <h3>Le fil de ta journée</h3>
            </div>
          </div>

          <div className="home-activity-list">
            {recentActivity.map((item) => (
              <div className="home-activity-item" key={item.title}>
                <span className="home-activity-dot" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p className="metric-subtext">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="home-watch-card">
          <div className="home-section-head">
            <div>
              <span className="panel-label">À surveiller</span>
              <h3>Clients et documents clés</h3>
            </div>
          </div>

          <div className="home-watch-grid">
            <div className="home-watch-list">
              <span className="panel-label">Clients récents</span>
              {clientHighlights.map((client) => (
                <div className="home-watch-item" key={client.client}>
                  <strong>{client.client}</strong>
                  <span>{client.contact}</span>
                </div>
              ))}
            </div>

            <div className="home-watch-list">
              <span className="panel-label">Devis à suivre</span>
              {quoteHighlights.map((quote) => (
                <div className="home-watch-item" key={quote.id}>
                  <strong>{quote.id}</strong>
                  <span>{quote.client}</span>
                </div>
              ))}
            </div>

            <div className="home-watch-list">
              <span className="panel-label">Factures ouvertes</span>
              {invoiceHighlights.map((invoice) => (
                <div className="home-watch-item" key={invoice.id}>
                  <strong>{invoice.id}</strong>
                  <span>{invoice.client}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="home-links-grid">
        {quickLinks.map((section) => (
          <article className="home-link-card" key={section.title}>
            <span className="panel-label">{section.eyebrow}</span>
            <h3>{section.title}</h3>
            <p className="metric-subtext">{section.description}</p>
            <Link className="button button-primary button-small" href={section.href}>
              {section.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
