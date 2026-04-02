"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultAccount, loadAccount, saveAccount, type StoredAccount } from "@/lib/account-store";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearCurrentUserScope } from "@/lib/user-scope";
import { clearPendingExternalDocument, saveClients, saveDocuments } from "@/lib/workspace-store";
import styles from "./page.module.css";

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<StoredAccount>(defaultAccount());
  const [savedAccount, setSavedAccount] = useState<StoredAccount>(defaultAccount());
  const [message, setMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">("idle");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isSendingResetMail, setIsSendingResetMail] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const nextAccount = loadAccount();
    setAccount(nextAccount);
    setSavedAccount(nextAccount);
  }, []);

  const hasAccountChanges = useMemo(
    () => JSON.stringify(account) !== JSON.stringify(savedAccount),
    [account, savedAccount]
  );

  const hasUnsavedChanges = hasAccountChanges;

  useEffect(() => {
    if (saveState !== "success") return;

    const timeout = window.setTimeout(() => {
      setSaveState("idle");
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [saveState]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!hasUnsavedChanges) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      event.preventDefault();
      setPendingHref(nextUrl.toString());
      setLeaveModalOpen(true);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges]);

  const identitySummary = useMemo(
    () => [
      { label: "Email pro", value: account.professionalEmail || "À compléter" },
      { label: "Téléphone", value: account.phone || "À compléter" },
      { label: "SIRET", value: account.siretNumber || "À compléter" },
      { label: "TVA", value: account.vatNumber || "À compléter" }
    ],
    [account]
  );

  const maskedEmail = useMemo(() => maskEmail(account.professionalEmail), [account.professionalEmail]);
  const maskedPassword = "••••••••••••";

  function updateField<Key extends keyof StoredAccount>(field: Key, value: StoredAccount[Key]) {
    setAccount((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField("logoUrl", typeof reader.result === "string" ? reader.result : "");
      updateField("logoName", file.name);
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  function handleSave() {
    saveAccount(account);
    setSavedAccount(account);
    setMessage("Compte mis à jour. Les futurs documents reprendront automatiquement ces informations.");
    setSaveState("saving");
    window.setTimeout(() => {
      setSaveState("success");
    }, 1100);
  }

  function switchPlan(plan: "free" | "pro") {
    const nextAccount = { ...account, plan };
    setAccount(nextAccount);
    setSavedAccount(nextAccount);
    saveAccount(nextAccount);
    setMessage(plan === "pro" ? "Le compte est passé sur Pro." : "Le compte est revenu sur Gratuit.");
  }

  async function handleSendResetEmail() {
    setSecurityMessage("");

    if (!account.professionalEmail) {
      setSecurityMessage("Ajoute d’abord une adresse mail professionnelle pour recevoir le lien.");
      setResetPasswordModalOpen(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setSecurityMessage("La réinitialisation par email n'est pas encore branchée. Ajoute les clés Supabase pour l'activer.");
      setResetPasswordModalOpen(false);
      return;
    }

    setIsSendingResetMail(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(account.professionalEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setSecurityMessage(error.message);
        return;
      }

      setSecurityMessage(`Un email de réinitialisation a été envoyé à ${account.professionalEmail}.`);
      setResetPasswordModalOpen(false);
    } catch (error) {
      setSecurityMessage(
        error instanceof Error ? error.message : "Impossible d'envoyer l'email de réinitialisation pour le moment."
      );
    } finally {
      setIsSendingResetMail(false);
    }
  }

  async function handleDeleteAccount() {
    const nextAccount = defaultAccount();
    setAccount(nextAccount);
    setSavedAccount(nextAccount);
    setSecurityMessage("");
    setMessage("Le compte local a été vidé.");
    setDeleteModalOpen(false);
    saveClients([]);
    saveDocuments([]);
    clearPendingExternalDocument();
    saveAccount(nextAccount);

    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {}
    }

    clearCurrentUserScope();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleLogout() {
    setSecurityMessage("");
    setIsSigningOut(true);

    try {
      if (isSupabaseConfigured) {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : "Impossible de se déconnecter pour le moment.");
      setIsSigningOut(false);
      return;
    }

    clearCurrentUserScope();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      {saveState === "saving" ? (
        <div className={styles.overlay}>
          <div className={styles.savingCard}>
            <div className={styles.logoSpinnerWrap}>
              <img alt="Logo Atelio Flow" className={styles.logoSpinner} src={account.logoUrl || "/atelio-logo.png"} />
            </div>
            <strong className={styles.overlayTitle}>Enregistrement en cours</strong>
            <p className={styles.overlayText}>On met bien a jour ton espace et tes informations d’entreprise.</p>
          </div>
        </div>
      ) : null}

      {saveState === "success" ? (
        <div className={styles.overlay}>
          <div className={styles.successCard}>
            <button className={styles.closeButton} onClick={() => setSaveState("idle")} type="button">
              ✕
            </button>
            <div className={styles.successBadge}>Bien enregistré</div>
            <strong className={styles.overlayTitle}>Ton compte a bien été mis à jour</strong>
            <p className={styles.overlayText}>Le logo et les informations seront repris automatiquement dans tes documents.</p>
          </div>
        </div>
      ) : null}

      {leaveModalOpen ? (
        <div className={styles.overlay}>
          <div className={styles.leaveCard}>
            <button className={styles.closeButton} onClick={() => setLeaveModalOpen(false)} type="button">
              ✕
            </button>
            <div className={styles.warningBadge}>Modifications non enregistrées</div>
            <strong className={styles.overlayTitle}>N’oublie pas d’enregistrer avant de partir</strong>
            <p className={styles.overlayText}>Tu as encore des changements non enregistrés dans cet espace.</p>
            <div className={styles.modalActions}>
              <button className="button button-secondary" onClick={() => setLeaveModalOpen(false)} type="button">
                Rester ici
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  if (pendingHref) {
                    window.location.href = pendingHref;
                  }
                }}
                type="button"
              >
                Quitter sans enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div className={styles.overlay}>
          <div className={styles.leaveCard}>
            <button className={styles.closeButton} onClick={() => setDeleteModalOpen(false)} type="button">
              ✕
            </button>
            <div className={styles.warningBadge}>Suppression du compte</div>
            <strong className={styles.overlayTitle}>
              {account.plan === "pro" ? "Es-tu sûr de vouloir supprimer ton compte Pro ?" : "Es-tu sûr de vouloir supprimer ton compte ?"}
            </strong>
            <p className={styles.overlayText}>
              {account.plan === "pro"
                ? "Cette action réinitialise cet espace de démo et met fin à l’abonnement associé. Tu pourras toujours recréer un compte ensuite."
                : "Cette action réinitialise les informations du compte sur ce navigateur. Tu pourras toujours les recréer ensuite."}
            </p>
            <div className={styles.modalActions}>
              <button className="button button-secondary" onClick={() => setDeleteModalOpen(false)} type="button">
                Annuler
              </button>
              <button className="button button-primary" onClick={handleDeleteAccount} type="button">
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetPasswordModalOpen ? (
        <div className={styles.overlay}>
          <div className={styles.leaveCard}>
            <button className={styles.closeButton} onClick={() => setResetPasswordModalOpen(false)} type="button">
              ✕
            </button>
            <div className={styles.warningBadge}>Réinitialisation du mot de passe</div>
            <strong className={styles.overlayTitle}>Es-tu sûr ?</strong>
            <p className={styles.overlayText}>
              Un email sera envoyé à <strong>{account.professionalEmail || "ton adresse renseignée"}</strong> pour te permettre de
              réinitialiser ton mot de passe.
            </p>
            <div className={styles.modalActions}>
              <button className="button button-secondary" onClick={() => setResetPasswordModalOpen(false)} type="button">
                Annuler
              </button>
              <button className="button button-primary" disabled={isSendingResetMail} onClick={() => void handleSendResetEmail()} type="button">
                {isSendingResetMail ? "Envoi..." : "Envoyer l'email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Réglages</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <span className={styles.gradient}>Mon compte</span>
            </h1>
            <span className={styles.statusBadge}>{account.plan === "pro" ? "Pro" : "Gratuit"}</span>
            {account.plan === "free" ? (
              <a className="button button-primary button-small" href="/abonnement">
                Passer à Pro
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Renseigne ton identité, ton entreprise, ton logo et tes paramètres de facturation. Tout sera repris
            automatiquement dans tes devis, factures, contrats et avenants.
          </p>
        </div>
        <button className="button button-primary" onClick={handleSave} type="button">
          Enregistrer le compte
        </button>
      </section>

      <section className={styles.summaryGrid}>
        <article className={`${styles.card} ${styles.brandCard}`}>
          <div className={styles.logoPanel}>
            <span className={styles.sectionLabel}>Logo</span>
            <div className={styles.logoPreview}>
              {account.logoUrl ? (
                <img alt="Logo de l'entreprise" src={account.logoUrl} />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <strong>Ajoute ton logo</strong>
                  <span className={styles.hint}>PNG, JPG ou SVG</span>
                </div>
              )}
            </div>
            <div className={styles.logoMeta}>
              <strong>{account.logoName || "Aucun fichier importé"}</strong>
              <span className={styles.hint}>Format conseillé : carré, fond transparent si possible, 512 × 512 px minimum.</span>
            </div>
            <div className={styles.logoActions}>
              <label className={`${styles.uploadButton} button button-primary`}>
                Importer un logo
                <input className={styles.hiddenInput} onChange={handleLogoUpload} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" />
              </label>
              {account.logoUrl ? (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    updateField("logoUrl", "");
                    updateField("logoName", "");
                  }}
                  type="button"
                >
                  Retirer le logo
                </button>
              ) : null}
            </div>
          </div>
        </article>

        <article className={`${styles.card} ${styles.identityCard}`}>
          <div className={styles.identityHead}>
            <span className={styles.sectionLabel}>Aperçu entreprise</span>
            <strong className={styles.identityTitle}>{account.companyName || "Votre entreprise"}</strong>
            <p className={styles.sectionText}>
              Ces informations seront injectées dans l'en-tête et le pied de page de tous tes documents.
            </p>
          </div>

          <div className={styles.identityGrid}>
            {identitySummary.map((item) => (
              <div className={styles.identityItem} key={item.label}>
                <span className={styles.fieldLabel}>{item.label}</span>
                <strong className={styles.identityValue}>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className={styles.planSwitchRow}>
            <span className={styles.planIndicator}>{account.plan === "pro" ? "Pro" : "Gratuit"}</span>
            {account.plan === "free" ? (
              <a className="button button-primary" href="/abonnement">
                Passer à Pro
              </a>
            ) : null}
            <a className="button button-secondary" href="/abonnement">
              Gérer mon abonnement
            </a>
          </div>
        </article>
      </section>

      <section className={styles.sections}>
        <article className={`${styles.card} ${styles.sectionCard}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Profil</span>
            <strong className={styles.sectionTitle}>Informations du professionnel</strong>
            <p className={styles.sectionText}>Le nom, l’email et le téléphone repris dans ton espace et tes documents.</p>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nom complet</span>
              <input className={styles.input} onChange={(event) => updateField("fullName", event.target.value)} value={account.fullName} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email professionnel</span>
              <input className={styles.input} onChange={(event) => updateField("professionalEmail", event.target.value)} type="email" value={account.professionalEmail} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Téléphone</span>
              <input className={styles.input} onChange={(event) => updateField("phone", event.target.value)} type="tel" value={account.phone} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Site web</span>
              <input className={styles.input} onChange={(event) => updateField("website", event.target.value)} value={account.website} />
            </label>
          </div>
        </article>

        <article className={`${styles.card} ${styles.sectionCard}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Entreprise</span>
            <strong className={styles.sectionTitle}>Coordonnées légales</strong>
            <p className={styles.sectionText}>Utilisées automatiquement dans l’émetteur de chaque document.</p>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nom de l'entreprise</span>
              <input className={styles.input} onChange={(event) => updateField("companyName", event.target.value)} value={account.companyName} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Raison sociale</span>
              <input className={styles.input} onChange={(event) => updateField("legalName", event.target.value)} value={account.legalName} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Adresse</span>
              <input className={styles.input} onChange={(event) => updateField("companyAddress", event.target.value)} value={account.companyAddress} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SIRET</span>
              <input className={styles.input} onChange={(event) => updateField("siretNumber", event.target.value)} value={account.siretNumber} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>TVA</span>
              <input className={styles.input} onChange={(event) => updateField("vatNumber", event.target.value)} value={account.vatNumber} />
            </label>
            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Ligne légale affichée</span>
              <textarea className={styles.textarea} onChange={(event) => updateField("companyMeta", event.target.value)} value={account.companyMeta} />
            </label>
          </div>
        </article>

        <article className={`${styles.card} ${styles.sectionCard}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Facturation</span>
            <strong className={styles.sectionTitle}>Paramètres repris par défaut</strong>
            <p className={styles.sectionText}>Évite de ressaisir tes conditions de paiement et ton pied de page à chaque document.</p>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>IBAN</span>
              <input className={styles.input} onChange={(event) => updateField("iban", event.target.value)} value={account.iban} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Conditions de paiement par défaut</span>
              <input className={styles.input} onChange={(event) => updateField("defaultPaymentTerms", event.target.value)} value={account.defaultPaymentTerms} />
            </label>
            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Note de bas de page par défaut</span>
              <textarea className={styles.textarea} onChange={(event) => updateField("footerNote", event.target.value)} value={account.footerNote} />
            </label>
          </div>

          <div className={styles.actions}>
            {message ? <span className={styles.message}>{message}</span> : null}
            <button className="button button-primary" onClick={handleSave} type="button">
              Enregistrer le compte
            </button>
          </div>
        </article>

        <article className={`${styles.card} ${styles.sectionCard}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Sécurité</span>
            <strong className={styles.sectionTitle}>Accès au compte</strong>
            <p className={styles.sectionText}>
              Retrouve ici les informations sensibles de connexion et mets à jour ton mot de passe si besoin.
            </p>
          </div>

          <div className={styles.securitySummary}>
            <div className={styles.securityItem}>
              <span className={styles.fieldLabel}>Adresse mail</span>
              <strong className={styles.securityValue}>{maskedEmail}</strong>
            </div>
            <div className={styles.securityItem}>
              <span className={styles.fieldLabel}>Mot de passe</span>
              <strong className={styles.securityValue}>{maskedPassword}</strong>
            </div>
          </div>

          <div className={styles.securityActions}>
            <div className={styles.securityMeta}>
              {account.passwordUpdatedAt ? (
                <span className={styles.message}>Dernière mise à jour : {account.passwordUpdatedAt}</span>
              ) : null}
              {securityMessage ? <span className={styles.message}>{securityMessage}</span> : null}
            </div>
            <div className={styles.securityButtons}>
              <button className="button button-secondary" disabled={isSigningOut} onClick={() => void handleLogout()} type="button">
                {isSigningOut ? "Déconnexion..." : "Déconnexion"}
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setSecurityMessage("");
                  setResetPasswordModalOpen(true);
                }}
                type="button"
              >
                Modifier mon mot de passe
              </button>
              <button className="button button-secondary" onClick={() => setDeleteModalOpen(true)} type="button">
                Supprimer mon compte
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function maskEmail(value: string) {
  if (!value || !value.includes("@")) return "••••••••••";

  const [local, domain] = value.split("@");
  const localMask = "•".repeat(Math.max(local.length, 6));
  const domainMask = "•".repeat(Math.max(domain.length, 6));
  return `${localMask}@${domainMask}`;
}
