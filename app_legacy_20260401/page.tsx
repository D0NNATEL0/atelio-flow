import Image from "next/image";
import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";
import { MetricCard } from "@/components/metric-card";
import { PlanCard } from "@/components/plan-card";
import { dashboardMetrics, features, plans, workflowSteps } from "@/lib/content";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-brand">
            <Image
              alt="Logo Atelio"
              className="hero-logo"
              height={72}
              priority
              src="/atelio-logo.png"
              width={72}
            />
            <span className="eyebrow">Atelio</span>
          </div>
          <h1>L&apos;app simple pour gérer vos devis, factures et relances.</h1>
          <p className="hero-text">
            Pensée pour les indépendants et les petites structures, Atelio
            centralise vos clients, vos documents commerciaux et vos relances
            dans une interface claire, rapide et intuitive.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" href="/app">
              Ouvrir l'app
            </Link>
            <Link className="button button-secondary" href="/auth/signup">
              Créer un compte
            </Link>
            <a className="button button-secondary" href="#pricing">
              Démarrer gratuitement
            </a>
          </div>

          <div className="hero-badges">
            <span>Email, Google et Apple</span>
            <span>Français et English</span>
            <span>Freemium avec abonnement premium</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <p className="panel-label">Tableau de bord</p>
                <h2>Vue rapide de l&apos;activité</h2>
              </div>
              <span className="panel-chip">MVP web</span>
            </div>

            <div className="metric-grid">
              {dashboardMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div className="activity-card">
              <div>
                <p className="panel-label">Relance intelligente</p>
                <strong>Devis AC-2026-014 en attente depuis 6 jours</strong>
              </div>
              <button className="button button-primary button-small">
                Relancer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="mvp">
        <div className="section-heading">
          <span className="eyebrow">MVP</span>
          <h2>Le socle produit recommandé pour lancer Atelio vite.</h2>
          <p>
            On commence avec les écrans et parcours qui apportent de la valeur
            immédiatement aux professionnels.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="section workflow">
        <div className="section-heading">
          <span className="eyebrow">Parcours</span>
          <h2>Un workflow conçu pour aller du prospect au paiement.</h2>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <article className="workflow-card" key={step.step}>
              <span className="workflow-step">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing" id="pricing">
        <div className="section-heading">
          <span className="eyebrow">Freemium</span>
          <h2>Une offre gratuite utile et un premium qui débloque la puissance.</h2>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </section>
    </main>
  );
}
