import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Inscription"
        title="Créez votre compte Atelio."
        description="Démarrez gratuitement puis débloquez les fonctions premium quand vous êtes prêt."
        footer={
          <Link className="button button-secondary" href="/">
            Retour à l'accueil
          </Link>
        }
      >
        <AuthForm mode="signup" />
      </AuthCard>
    </main>
  );
}
