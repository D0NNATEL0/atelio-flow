"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { OauthIcon } from "@/components/auth/oauth-icon";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [activityLabel, setActivityLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("fr");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isLogin = mode === "login";

  function getFriendlyAuthError(message: string) {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes("invalid login credentials")) {
      return "Email ou mot de passe incorrect. Si tu viens juste de créer ton compte, recrée-le une fois après avoir désactivé la confirmation email dans Supabase.";
    }

    if (
      normalizedMessage.includes("email not confirmed") ||
      normalizedMessage.includes("email_not_confirmed")
    ) {
      return "Ton email n'est pas encore confirmé. Vérifie les réglages Email dans Supabase ou désactive temporairement la confirmation pour les tests.";
    }

    if (normalizedMessage.includes("password should be at least")) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (normalizedMessage.includes("user already registered")) {
      return "Un compte existe déjà avec cet email. Essaie de te connecter à la place.";
    }

    return message;
  }

  function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setError(
          "Ajoute d'abord les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        if (isLogin) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
          });

          if (signInError) {
            setError(getFriendlyAuthError(signInError.message));
            return;
          }

          setMessage("Connexion réussie. Redirection vers ton espace...");
          router.push("/app");
          router.refresh();
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password
        });

        if (signUpError) {
          setError(getFriendlyAuthError(signUpError.message));
          return;
        }

        localStorage.setItem(
          "atelio_onboarding_draft",
          JSON.stringify({
            fullName: fullName.trim(),
            companyName: companyName.trim(),
            activityLabel: activityLabel.trim(),
            professionalEmail: normalizedEmail,
            phone: phone.trim(),
            defaultLanguage
          })
        );

        setMessage("Compte créé. Redirection en cours...");

        router.push(signUpData.session ? "/onboarding" : "/auth/login");
        router.refresh();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? getFriendlyAuthError(caughtError.message)
            : "Une erreur est survenue."
        );
      }
    });
  }

  function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setError(
          "Ajoute d'abord les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/app`
          }
        });

        if (oauthError) {
          setError(oauthError.message);
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Une erreur est survenue."
        );
      }
    });
  }

  return (
    <div className="auth-form-shell">
      <form className="auth-form" onSubmit={handleEmailAuth}>
        {!isLogin ? (
          <>
            <label className="field">
              <span>Nom complet</span>
              <input
                className="input"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Mathis Dupont"
                autoComplete="name"
                required
              />
            </label>

            <label className="field">
              <span>Nom de l'entreprise</span>
              <input
                className="input"
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Atelio Studio"
                autoComplete="organization"
                required
              />
            </label>

            <label className="field">
              <span>Activité</span>
              <input
                className="input"
                type="text"
                value={activityLabel}
                onChange={(event) => setActivityLabel(event.target.value)}
                placeholder="Photographe, agence, artisan..."
                required
              />
            </label>

            <label className="field">
              <span>Téléphone</span>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </label>

            <label className="field">
              <span>Langue par défaut</span>
              <select
                className="input"
                value={defaultLanguage}
                onChange={(event) => setDefaultLanguage(event.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
          </>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="vous@atelio.app"
            required
          />
        </label>

        <label className="field">
          <span>Mot de passe</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Minimum 8 caracteres"
            minLength={8}
            required
          />
        </label>

        <button className="button button-primary auth-submit" disabled={isPending} type="submit">
          {isPending
            ? "Chargement..."
            : isLogin
              ? "Se connecter"
              : "Creer mon compte"}
        </button>
      </form>

      {isLogin ? (
        <>
          <div className="auth-divider">
            <span>ou continuer avec</span>
          </div>

          <div className="oauth-grid">
            <button
              className="button button-secondary oauth-button"
              disabled={isPending}
              onClick={() => handleOAuth("google")}
              type="button"
            >
              <OauthIcon provider="google" />
              Google
            </button>
          </div>
        </>
      ) : null}

      {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
      {message ? <p className="form-feedback form-feedback-success">{message}</p> : null}

      <p className="auth-alt-link">
        {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
        <Link href={isLogin ? "/auth/signup" : "/auth/login"}>
          {isLogin ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </div>
  );
}
