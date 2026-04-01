import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Connexion"
        title="Retrouvez votre espace Atelio."
        description="Connectez-vous pour gérer vos clients, devis, factures et relances."
        footer={
          <Link className="button button-secondary" href="/">
            Retour à l'accueil
          </Link>
        }
      >
        <AuthForm mode="login" />
      </AuthCard>
    </main>
  );
}
