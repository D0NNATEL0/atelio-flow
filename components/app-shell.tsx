"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navigationGroups = [
  {
    title: "Pilotage",
    items: [
      { href: "/app", label: "Accueil", token: "AC" },
      { href: "/app/tableau-de-bord", label: "Tableau de bord", token: "TB" },
      { href: "/app/clients", label: "Clients", token: "CL" },
      { href: "/app/devis", label: "Devis", token: "DV" },
      { href: "/app/factures", label: "Factures", token: "FA" }
    ]
  },
  {
    title: "Configuration",
    items: [
      { href: "/app/compte", label: "Compte", token: "CP" },
      { href: "/app/abonnement", label: "Abonnement", token: "AB" }
    ]
  }
] as const;

type AppShellProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: Route;
  secondaryActionLabel?: string;
  secondaryActionHref?: Route;
  secondaryActionPrimary?: boolean;
  hideHeader?: boolean;
  children: ReactNode;
};

function getTodayLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

export function AppShell({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  secondaryActionPrimary = false,
  hideHeader = false,
  children
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block brand-block-shell">
          <div className="brand-lockup brand-lockup-shell">
            <Image
              alt="Logo Atelio"
              className="brand-logo"
              height={48}
              priority
              src="/atelio-logo.png"
              width={48}
            />
            <div className="brand-shell-copy">
              <strong>Atelio</strong>
              <p>Espace pro</p>
            </div>
          </div>
          <span className="sidebar-date-pill">{getTodayLabel()}</span>
        </div>

        <nav className="sidebar-groups" aria-label="Navigation principale">
          {navigationGroups.map((group) => (
            <div className="sidebar-group" key={group.title}>
              <span className="panel-label">{group.title}</span>
              <div className="sidebar-nav">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

                  return (
                    <Link
                      className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                      href={item.href}
                      key={item.href}
                    >
                      <span className="nav-token">{item.token}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-card sidebar-card-premium sidebar-card-shell">
          <p className="panel-label">Plan</p>
          <strong>Free</strong>
          <p className="metric-subtext">Passez en premium pour aller plus vite.</p>
          <Link className="button button-primary button-small" href="/app/abonnement">
            Voir les offres
          </Link>
        </div>
      </aside>

      <section className="app-content">
        {!hideHeader ? (
          <header className="app-page-head">
            <div className="app-page-head-main">
              <div className="app-page-copy">
                <span className="panel-label">Espace Atelio</span>
                <h2>{title}</h2>
                <p className="metric-subtext">{description}</p>
              </div>

              <div className="app-page-side">
                <div className="app-page-chip">Mode travail</div>
                {actionLabel || secondaryActionLabel ? (
                  <div className="header-actions">
                    {secondaryActionLabel ? (
                      secondaryActionHref ? (
                        <Link
                          className={`button ${secondaryActionPrimary ? "button-primary" : "button-secondary"}`}
                          href={secondaryActionHref}
                        >
                          {secondaryActionLabel}
                        </Link>
                      ) : (
                        <button
                          className={`button ${secondaryActionPrimary ? "button-primary" : "button-secondary"}`}
                          type="button"
                        >
                          {secondaryActionLabel}
                        </button>
                      )
                    ) : null}
                    {actionLabel ? (
                      actionHref ? (
                        <Link className="button button-primary" href={actionHref}>
                          {actionLabel}
                        </Link>
                      ) : (
                        <button className="button button-primary" type="button">
                          {actionLabel}
                        </button>
                      )
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </header>
        ) : null}

        {children}
      </section>
    </main>
  );
}
