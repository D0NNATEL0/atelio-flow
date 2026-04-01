"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addStoredClient } from "@/lib/browser-storage";

export function CreateClientForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      addStoredClient({
        client: companyName.trim(),
        contact: contactName.trim(),
        email: email.trim().toLowerCase(),
        status: "Nouveau",
        total: "0 €"
      });

      router.push("/app/clients");
      router.refresh();
    });
  }

  return (
    <form className="account-editor-grid" onSubmit={handleSubmit}>
      <article className="account-card">
        <span className="panel-label">Nouveau client</span>
        <h3>Créez une fiche client</h3>
        <div className="account-form-grid">
          <label className="field">
            <span>Nom du client</span>
            <input className="input" onChange={(e) => setCompanyName(e.target.value)} required value={companyName} />
          </label>
          <label className="field">
            <span>Contact principal</span>
            <input className="input" onChange={(e) => setContactName(e.target.value)} required value={contactName} />
          </label>
          <label className="field field-span-2">
            <span>Email</span>
            <input className="input" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
          </label>
        </div>
      </article>

      <div className="account-actions">
        <div className="metric-subtext">Le client sera ajouté immédiatement à votre liste.</div>
        <button className="button button-primary" disabled={isPending} type="submit">
          {isPending ? "Création..." : "Créer le client"}
        </button>
      </div>
    </form>
  );
}
