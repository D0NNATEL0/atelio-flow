import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Onboarding"
        title="Configurez votre espace de travail."
        description="Ajoutez vos premières informations pour personnaliser Atelio avant de passer à l'utilisation."
        footer={
          <Link className="button button-secondary" href="/app">
            Passer pour l'instant
          </Link>
        }
      >
        <OnboardingForm />
      </AuthCard>
    </main>
  );
}
