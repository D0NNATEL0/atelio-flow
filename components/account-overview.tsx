"use client";

import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

type AccountFormState = {
  fullName: string;
  companyName: string;
  legalName: string;
  activityLabel: string;
  professionalEmail: string;
  phone: string;
  website: string;
  vatNumber: string;
  siretNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  defaultLanguage: string;
  logoUrl: string;
};

type OnboardingDraft = Partial<AccountFormState>;

type ProfileRecord = {
  organization_id: string | null;
  full_name: string | null;
  email: string | null;
  preferred_locale: string | null;
};

type OrganizationRecord = {
  name: string | null;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  vat_number: string | null;
  siret_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  postal_code: string | null;
  city: string | null;
  country_code: string | null;
  locale: string | null;
  logo_url: string | null;
};

const defaultFormState: AccountFormState = {
  fullName: "Mathis Dupont",
  companyName: "Atelio Studio",
  legalName: "Atelio Studio",
  activityLabel: "Photographe indépendant",
  professionalEmail: "contact@atelio.app",
  phone: "+33 6 12 34 56 78",
  website: "",
  vatNumber: "",
  siretNumber: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "Paris",
  countryCode: "FR",
  defaultLanguage: "fr",
  logoUrl: ""
};

function getLanguageLabel(locale: string) {
  return locale === "en" ? "English" : "Français";
}

function readDraft(): OnboardingDraft {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawDraft = localStorage.getItem("atelio_onboarding_draft");
    return rawDraft ? (JSON.parse(rawDraft) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function AccountOverview() {
  const [form, setForm] = useState<AccountFormState>(defaultFormState);
  const [sessionEmail, setSessionEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const languageLabel = useMemo(
    () => getLanguageLabel(form.defaultLanguage),
    [form.defaultLanguage]
  );

  useEffect(() => {
    const draft = readDraft();

    setForm((currentForm) => ({
      ...currentForm,
      ...draft,
      legalName: draft.legalName || draft.companyName || currentForm.legalName,
      countryCode: draft.countryCode || currentForm.countryCode,
      defaultLanguage: draft.defaultLanguage || currentForm.defaultLanguage
    }));

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setIsReady(true);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          setIsReady(true);
          return;
        }

        setSessionEmail(user.email ?? "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("organization_id, full_name, email, preferred_locale")
          .eq("id", user.id)
          .maybeSingle();

        const profile = profileData as ProfileRecord | null;

        let nextForm: Partial<AccountFormState> = {
          fullName: profile?.full_name || draft.fullName || defaultFormState.fullName,
          professionalEmail:
            profile?.email || user.email || draft.professionalEmail || defaultFormState.professionalEmail,
          defaultLanguage:
            profile?.preferred_locale || draft.defaultLanguage || defaultFormState.defaultLanguage
        };

        if (profile?.organization_id) {
          const { data: organizationData } = await supabase
            .from("organizations")
            .select(
              "name, legal_name, email, phone, website, vat_number, siret_number, address_line_1, address_line_2, postal_code, city, country_code, locale, logo_url"
            )
            .eq("id", profile.organization_id)
            .maybeSingle();

          const organization = organizationData as OrganizationRecord | null;

          if (organization) {
            nextForm = {
              ...nextForm,
              companyName: organization.name || draft.companyName || defaultFormState.companyName,
              legalName:
                organization.legal_name ||
                organization.name ||
                draft.legalName ||
                draft.companyName ||
                defaultFormState.legalName,
              professionalEmail:
                organization.email ||
                nextForm.professionalEmail ||
                draft.professionalEmail ||
                defaultFormState.professionalEmail,
              phone: organization.phone || draft.phone || defaultFormState.phone,
              website: organization.website || draft.website || defaultFormState.website,
              vatNumber: organization.vat_number || draft.vatNumber || defaultFormState.vatNumber,
              siretNumber:
                organization.siret_number || draft.siretNumber || defaultFormState.siretNumber,
              addressLine1:
                organization.address_line_1 || draft.addressLine1 || defaultFormState.addressLine1,
              addressLine2:
                organization.address_line_2 || draft.addressLine2 || defaultFormState.addressLine2,
              postalCode:
                organization.postal_code || draft.postalCode || defaultFormState.postalCode,
              city: organization.city || draft.city || defaultFormState.city,
              countryCode:
                organization.country_code || draft.countryCode || defaultFormState.countryCode,
              defaultLanguage:
                organization.locale || nextForm.defaultLanguage || defaultFormState.defaultLanguage,
              logoUrl: organization.logo_url || draft.logoUrl || defaultFormState.logoUrl
            };
          }
        }

        setForm((currentForm) => ({
          ...currentForm,
          ...nextForm
        }));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger les informations du compte."
        );
      } finally {
        setIsReady(true);
      }
    });
  }, []);

  function updateField<Key extends keyof AccountFormState>(key: Key, value: AccountFormState[Key]) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value
    }));
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setLogoFile(selectedFile);

    if (!selectedFile) {
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    updateField("logoUrl", previewUrl);
  }

  function persistDraft(nextForm: AccountFormState) {
    localStorage.setItem(
      "atelio_onboarding_draft",
      JSON.stringify({
        fullName: nextForm.fullName,
        companyName: nextForm.companyName,
        legalName: nextForm.legalName,
        activityLabel: nextForm.activityLabel,
        professionalEmail: nextForm.professionalEmail,
        phone: nextForm.phone,
        website: nextForm.website,
        vatNumber: nextForm.vatNumber,
        siretNumber: nextForm.siretNumber,
        addressLine1: nextForm.addressLine1,
        addressLine2: nextForm.addressLine2,
        postalCode: nextForm.postalCode,
        city: nextForm.city,
        countryCode: nextForm.countryCode,
        defaultLanguage: nextForm.defaultLanguage,
        logoUrl: nextForm.logoUrl
      })
    );
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const nextForm = {
      ...form,
      fullName: form.fullName.trim(),
      companyName: form.companyName.trim(),
      legalName: form.legalName.trim(),
      activityLabel: form.activityLabel.trim(),
      professionalEmail: form.professionalEmail.trim().toLowerCase(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      vatNumber: form.vatNumber.trim(),
      siretNumber: form.siretNumber.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      defaultLanguage: form.defaultLanguage,
      logoUrl: form.logoUrl
    };

    persistDraft(nextForm);
    setForm(nextForm);

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setMessage("Informations enregistrées localement. Il faudra brancher Supabase pour la sauvegarde en ligne.");
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Connecte-toi pour enregistrer ton compte professionnel.");
          return;
        }

        let logoUrl = nextForm.logoUrl;

        if (logoFile) {
          const fileExt = logoFile.name.split(".").pop()?.toLowerCase() || "png";
          const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("organization-assets")
            .upload(filePath, logoFile, { upsert: true });

          if (uploadError) {
            throw new Error(
              "Le logo n'a pas pu être envoyé. Vérifie que le bucket organization-assets est bien créé dans Supabase."
            );
          }

          const { data: publicAsset } = supabase.storage
            .from("organization-assets")
            .getPublicUrl(filePath);

          logoUrl = publicAsset.publicUrl;
        }

        const { data: organization, error: organizationError } = await supabase
          .from("organizations")
          .upsert(
            {
              owner_user_id: user.id,
              name: nextForm.companyName,
              legal_name: nextForm.legalName || nextForm.companyName,
              email: nextForm.professionalEmail,
              phone: nextForm.phone || null,
              website: nextForm.website || null,
              vat_number: nextForm.vatNumber || null,
              siret_number: nextForm.siretNumber || null,
              address_line_1: nextForm.addressLine1 || null,
              address_line_2: nextForm.addressLine2 || null,
              postal_code: nextForm.postalCode || null,
              city: nextForm.city || null,
              country_code: nextForm.countryCode || "FR",
              locale: nextForm.defaultLanguage,
              logo_url: logoUrl || null
            },
            { onConflict: "owner_user_id" }
          )
          .select("id")
          .single();

        if (organizationError || !organization) {
          throw organizationError ?? new Error("Impossible d'enregistrer l'organisation.");
        }

        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            organization_id: organization.id,
            full_name: nextForm.fullName,
            email: nextForm.professionalEmail || user.email || sessionEmail,
            preferred_locale: nextForm.defaultLanguage,
            role: "owner"
          },
          { onConflict: "id" }
        );

        if (profileError) {
          throw profileError;
        }

        updateField("logoUrl", logoUrl);
        setLogoFile(null);
        persistDraft({ ...nextForm, logoUrl });
        setMessage("Compte professionnel enregistré. Tes futurs devis et factures pourront reprendre ces informations.");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible d'enregistrer les informations du compte."
        );
      }
    });
  }

  return (
    <div className="account-page-stack">
      <section className="account-summary-grid">
        <article className="account-card account-brand-card">
          <span className="panel-label">Aperçu entreprise</span>
          <div className="account-brand-header">
            <div className="account-logo-preview">
              {form.logoUrl ? <img alt="Logo de l'entreprise" src={form.logoUrl} /> : <span>Logo</span>}
            </div>
            <div>
              <h3>{form.companyName || "Votre entreprise"}</h3>
              <p className="metric-subtext">
                Ces informations seront réutilisées pour les devis, factures et documents client.
              </p>
            </div>
          </div>

          <div className="account-badge-row">
            <span className="account-chip">{languageLabel}</span>
            <span className="account-chip">{form.countryCode || "FR"}</span>
            <span className="account-chip">{form.activityLabel || "Activité à compléter"}</span>
          </div>
        </article>

        <article className="account-card">
          <span className="panel-label">Documents</span>
          <h3>Identité de facturation</h3>
          <div className="account-stack">
            <div className="account-line">
              <span>Email pro</span>
              <strong>{form.professionalEmail || sessionEmail || "À compléter"}</strong>
            </div>
            <div className="account-line">
              <span>SIRET</span>
              <strong>{form.siretNumber || "À compléter"}</strong>
            </div>
            <div className="account-line">
              <span>TVA</span>
              <strong>{form.vatNumber || "À compléter"}</strong>
            </div>
          </div>
        </article>
      </section>

      <form className="account-editor-grid" onSubmit={handleSave}>
        <article className="account-card">
          <span className="panel-label">Profil</span>
          <h3>Informations du professionnel</h3>

          <div className="account-form-grid">
            <label className="field">
              <span>Nom complet</span>
              <input
                className="input"
                onChange={(event) => updateField("fullName", event.target.value)}
                value={form.fullName}
              />
            </label>

            <label className="field">
              <span>Activité</span>
              <input
                className="input"
                onChange={(event) => updateField("activityLabel", event.target.value)}
                value={form.activityLabel}
              />
            </label>

            <label className="field">
              <span>Email professionnel</span>
              <input
                className="input"
                onChange={(event) => updateField("professionalEmail", event.target.value)}
                type="email"
                value={form.professionalEmail}
              />
            </label>

            <label className="field">
              <span>Téléphone</span>
              <input
                className="input"
                onChange={(event) => updateField("phone", event.target.value)}
                type="tel"
                value={form.phone}
              />
            </label>

            <label className="field">
              <span>Langue par défaut</span>
              <select
                className="input"
                onChange={(event) => updateField("defaultLanguage", event.target.value)}
                value={form.defaultLanguage}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="field">
              <span>Site web</span>
              <input
                className="input"
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://www.mon-site.fr"
                value={form.website}
              />
            </label>
          </div>
        </article>

        <article className="account-card">
          <span className="panel-label">Entreprise</span>
          <h3>Coordonnées légales</h3>

          <div className="account-form-grid">
            <label className="field">
              <span>Nom de l'entreprise</span>
              <input
                className="input"
                onChange={(event) => updateField("companyName", event.target.value)}
                value={form.companyName}
              />
            </label>

            <label className="field">
              <span>Raison sociale</span>
              <input
                className="input"
                onChange={(event) => updateField("legalName", event.target.value)}
                value={form.legalName}
              />
            </label>

            <label className="field">
              <span>SIRET</span>
              <input
                className="input"
                onChange={(event) => updateField("siretNumber", event.target.value)}
                placeholder="123 456 789 00012"
                value={form.siretNumber}
              />
            </label>

            <label className="field">
              <span>Numéro de TVA</span>
              <input
                className="input"
                onChange={(event) => updateField("vatNumber", event.target.value)}
                placeholder="FR12 123456789"
                value={form.vatNumber}
              />
            </label>

            <label className="field field-span-2">
              <span>Adresse</span>
              <input
                className="input"
                onChange={(event) => updateField("addressLine1", event.target.value)}
                placeholder="12 rue des Ateliers"
                value={form.addressLine1}
              />
            </label>

            <label className="field field-span-2">
              <span>Complément d'adresse</span>
              <input
                className="input"
                onChange={(event) => updateField("addressLine2", event.target.value)}
                placeholder="Bâtiment, étage, boîte postale..."
                value={form.addressLine2}
              />
            </label>

            <label className="field">
              <span>Code postal</span>
              <input
                className="input"
                onChange={(event) => updateField("postalCode", event.target.value)}
                value={form.postalCode}
              />
            </label>

            <label className="field">
              <span>Ville</span>
              <input
                className="input"
                onChange={(event) => updateField("city", event.target.value)}
                value={form.city}
              />
            </label>

            <label className="field">
              <span>Pays</span>
              <input
                className="input"
                maxLength={2}
                onChange={(event) => updateField("countryCode", event.target.value)}
                placeholder="FR"
                value={form.countryCode}
              />
            </label>

            <label className="field">
              <span>Logo de l'entreprise</span>
              <input
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="input"
                onChange={handleLogoChange}
                type="file"
              />
            </label>
          </div>
        </article>

        <div className="account-actions">
          <div>
            {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
            {message ? <p className="form-feedback form-feedback-success">{message}</p> : null}
            {!isReady ? (
              <p className="metric-subtext">Chargement des informations du compte...</p>
            ) : null}
          </div>
          <button className="button button-primary" disabled={isPending || !isReady} type="submit">
            {isPending ? "Enregistrement..." : "Enregistrer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}
