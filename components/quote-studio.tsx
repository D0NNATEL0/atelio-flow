"use client";

import { useMemo, useState } from "react";
import { quotesTable } from "@/lib/content";
import { QuoteRecord, setStoredQuotes } from "@/lib/browser-storage";

const statusColumns = ["Brouillon", "Envoyé", "En attente", "Accepté"] as const;
const initialQuotes = [...quotesTable] as QuoteRecord[];

function normalizeStatus(status: string) {
  return statusColumns.includes(status as (typeof statusColumns)[number]) ? status : "Envoyé";
}

export function QuoteStudio() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>(
    initialQuotes.map((quote) => ({ ...quote, status: normalizeStatus(quote.status) }))
  );
  const [selectedId, setSelectedId] = useState(quotes[0]?.id ?? "");

  const selectedQuote = quotes.find((quote) => quote.id === selectedId) ?? quotes[0];

  const groupedQuotes = useMemo(
    () =>
      statusColumns.map((status) => ({
        status,
        items: quotes.filter((quote) => quote.status === status)
      })),
    [quotes]
  );

  function updateQuote(id: string, patch: Partial<QuoteRecord>) {
    const nextQuotes = quotes.map((quote) => (quote.id === id ? { ...quote, ...patch } : quote));
    setQuotes(nextQuotes);
    setStoredQuotes(nextQuotes);
  }

  return (
    <div className="quote-studio">
      <section className="studio-panel studio-panel-board">
        <div className="studio-head">
          <div>
            <span className="panel-label">Pipeline devis</span>
            <h3>Suivi par statut</h3>
          </div>
          <div className="studio-inline-note">Déplacez mentalement vos devis, puis changez leur statut à droite.</div>
        </div>

        <div className="quote-board-grid">
          {groupedQuotes.map((column) => (
            <article className="quote-column" key={column.status}>
              <div className="quote-column-head">
                <span>{column.status}</span>
                <strong>{column.items.length}</strong>
              </div>
              <div className="quote-column-stack">
                {column.items.length ? (
                  column.items.map((quote) => (
                    <button
                      className={`quote-card ${selectedQuote?.id === quote.id ? "is-active" : ""}`}
                      key={quote.id}
                      onClick={() => setSelectedId(quote.id)}
                      type="button"
                    >
                      <span className="panel-label">{quote.id}</span>
                      <strong>{quote.client}</strong>
                      <p>{quote.amount}</p>
                      <small>{quote.due}</small>
                    </button>
                  ))
                ) : (
                  <div className="quote-column-empty">Aucun devis dans cette étape.</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-panel studio-panel-editor">
        {selectedQuote ? (
          <>
            <div className="studio-head">
              <div>
                <span className="panel-label">Pilotage du devis</span>
                <h3>{selectedQuote.id}</h3>
              </div>
              <span className="studio-amount-badge">{selectedQuote.amount}</span>
            </div>

            <div className="account-form-grid studio-form-grid">
              <label className="field">
                <span>Client</span>
                <input
                  className="input"
                  onChange={(event) => updateQuote(selectedQuote.id, { client: event.target.value })}
                  value={selectedQuote.client}
                />
              </label>
              <label className="field">
                <span>Montant</span>
                <input
                  className="input"
                  onChange={(event) => updateQuote(selectedQuote.id, { amount: event.target.value })}
                  value={selectedQuote.amount}
                />
              </label>
              <label className="field">
                <span>Statut</span>
                <select
                  className="input"
                  onChange={(event) => updateQuote(selectedQuote.id, { status: event.target.value })}
                  value={selectedQuote.status}
                >
                  {statusColumns.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Action suivante</span>
                <input
                  className="input"
                  onChange={(event) => updateQuote(selectedQuote.id, { due: event.target.value })}
                  value={selectedQuote.due}
                />
              </label>
            </div>

            <div className="studio-insight-band">
              <div className="studio-insight">
                <span className="panel-label">Envoi</span>
                <strong>{selectedQuote.status === "Brouillon" ? "Pas encore envoyé" : "Déjà diffusé"}</strong>
              </div>
              <div className="studio-insight">
                <span className="panel-label">Priorité</span>
                <strong>{selectedQuote.due}</strong>
              </div>
              <div className="studio-insight">
                <span className="panel-label">Montant</span>
                <strong>{selectedQuote.amount}</strong>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
