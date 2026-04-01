"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [activityLabel, setActivityLabel] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("fr");

  useEffect(() => {
    const rawDraft = localStorage.getItem("atelio_onboarding_draft");

    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as {
        fullName?: string;
        companyName?: string;
        activityLabel?: string;
        professionalEmail?: string;
      };

      setFullName(draft.fullName ?? "");
      setCompanyName(draft.companyName ?? "");
      setActivityLabel(draft.activityLabel ?? "");
      setProfessionalEmail(draft.professionalEmail ?? "");
    } catch {
      localStorage.removeItem("atelio_onboarding_draft");
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(
      "atelio_onboarding_draft",
      JSON.stringify({
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        activityLabel: activityLabel.trim(),
        professionalEmail: professionalEmail.trim().toLowerCase(),
        phone: phone.trim(),
        defaultLanguage
      })
    );
    setSubmitted(true);

    window.setTimeout(() => {
      router.push("/app");
      router.refresh();
    }, 800);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Nom complet</span>
        <input
          className="input"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Mathis Dupont"
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
        <span>Email professionnel</span>
        <input
          className="input"
          type="email"
          value={professionalEmail}
          onChange={(event) => setProfessionalEmail(event.target.value)}
          placeholder="contact@atelio.app"
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

      <button className="button button-primary auth-submit" type="submit">
        Continuer vers l'app
      </button>

      {submitted ? (
        <p className="form-feedback form-feedback-success">
          Informations enregistrées. Redirection vers votre espace Atelio...
        </p>
      ) : null}
    </form>
  );
}
