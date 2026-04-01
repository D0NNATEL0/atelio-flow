import { AppShell } from "@/components/app-shell";
import { ClientStudio } from "@/components/client-studio";

export default function ClientsPage() {
  return (
    <AppShell
      title="Clients"
      description="Centralisez vos fiches client, leur contact principal et la valeur générée."
      actionLabel="Ajouter un client"
      actionHref="/app/clients/nouveau"
      hideHeader
    >
      <div className="clients-page-stack">
        <div className="app-page-head app-page-head-inline">
          <div className="app-page-head-main">
            <div className="app-page-copy">
              <span className="panel-label">Espace Atelio</span>
              <h2>Clients</h2>
              <p className="metric-subtext">
                Centralisez vos fiches client, leur contact principal et la valeur générée.
              </p>
            </div>

            <div className="app-page-side">
              <div className="app-page-chip">Mode travail</div>
              <div className="header-actions">
                <a className="button button-primary" href="/app/clients/nouveau">
                  Ajouter un client
                </a>
              </div>
            </div>
          </div>
        </div>

        <ClientStudio />
      </div>
    </AppShell>
  );
}
