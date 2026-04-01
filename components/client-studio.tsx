"use client";

import { useMemo, useState } from "react";
import { clientsTable } from "@/lib/content";
import { ClientRecord, setStoredClients } from "@/lib/browser-storage";

const initialClients = [...clientsTable] as ClientRecord[];

export function ClientStudio() {
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord>(initialClients[0]);

  const filteredClients = useMemo(() => {
    if (!query.trim()) {
      return clients;
    }

    const normalized = query.toLowerCase();
    return clients.filter(
      (client) =>
        client.client.toLowerCase().includes(normalized) ||
        client.contact.toLowerCase().includes(normalized) ||
        client.email.toLowerCase().includes(normalized)
    );
  }, [clients, query]);

  function handleSelect(client: ClientRecord) {
    setSelectedClient(client);
  }

  function updateClient<Key extends keyof ClientRecord>(key: Key, value: ClientRecord[Key]) {
    setSelectedClient((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const nextClients = clients.map((client) =>
      client.client === selectedClient.client && client.email === selectedClient.email
        ? selectedClient
        : client
    );

    setClients(nextClients);
    setStoredClients(nextClients);
  }

  return (
    <div className="studio-grid">
      <section className="studio-panel studio-panel-list">
        <div className="studio-head">
          <div>
            <span className="panel-label">Portefeuille</span>
            <h3>Clients suivis</h3>
          </div>
          <input
            className="input studio-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un client"
            value={query}
          />
        </div>

        <div className="studio-list">
          {filteredClients.map((client) => {
            const isActive =
              client.client === selectedClient.client && client.email === selectedClient.email;

            return (
              <button
                className={`studio-list-item ${isActive ? "is-active" : ""}`}
                key={`${client.client}-${client.email}`}
                onClick={() => handleSelect(client)}
                type="button"
              >
                <div className="studio-avatar">{client.client.slice(0, 2).toUpperCase()}</div>
                <div className="studio-list-copy">
                  <strong>{client.client}</strong>
                  <span>{client.contact}</span>
                </div>
                <em
                  className={`status-pill status-pill-${
                    client.status === "Actif" ? "success" : client.status === "Nouveau" ? "warning" : "danger"
                  }`}
                >
                  <span className="status-dot" aria-hidden="true" />
                  {client.status}
                </em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="studio-panel studio-panel-editor">
        <div className="studio-head">
          <div>
            <span className="panel-label">Fiche client</span>
            <h3>{selectedClient.client}</h3>
          </div>
          <button className="button button-primary button-small" onClick={handleSave} type="button">
            Enregistrer
          </button>
        </div>

        <div className="account-form-grid studio-form-grid">
          <label className="field">
            <span>Nom du client</span>
            <input
              className="input"
              onChange={(event) => updateClient("client", event.target.value)}
              value={selectedClient.client}
            />
          </label>
          <label className="field">
            <span>Contact</span>
            <input
              className="input"
              onChange={(event) => updateClient("contact", event.target.value)}
              value={selectedClient.contact}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              onChange={(event) => updateClient("email", event.target.value)}
              type="email"
              value={selectedClient.email}
            />
          </label>
          <label className="field">
            <span>Statut</span>
            <select
              className="input"
              onChange={(event) => updateClient("status", event.target.value)}
              value={selectedClient.status}
            >
              <option value="Actif">Actif</option>
              <option value="Nouveau">Nouveau</option>
              <option value="À relancer">À relancer</option>
            </select>
          </label>
          <label className="field field-span-2">
            <span>Valeur générée</span>
            <input
              className="input"
              onChange={(event) => updateClient("total", event.target.value)}
              value={selectedClient.total}
            />
          </label>
        </div>

        <div className="studio-insight-band">
          <div className="studio-insight">
            <span className="panel-label">Email principal</span>
            <strong>{selectedClient.email}</strong>
          </div>
          <div className="studio-insight">
            <span className="panel-label">Relation</span>
            <strong>{selectedClient.status}</strong>
          </div>
          <div className="studio-insight">
            <span className="panel-label">Valeur</span>
            <strong>{selectedClient.total}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
