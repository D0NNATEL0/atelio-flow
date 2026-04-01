import { AppShell } from "@/components/app-shell";
import { PlanCard } from "@/components/plan-card";
import { plans } from "@/lib/content";

export default function SubscriptionPage() {
  return (
    <AppShell
      title="Abonnement"
      description="Le modèle freemium d’Atelio permet de commencer gratuitement puis de monter en puissance."
      actionLabel="Passer en Premium"
    >
      <div className="pricing-grid">
        {plans.map((plan) => (
          <PlanCard key={plan.name} {...plan} />
        ))}
      </div>
    </AppShell>
  );
}
