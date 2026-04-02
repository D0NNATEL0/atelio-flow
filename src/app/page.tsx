"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAccount } from "@/lib/account-store";
import { hydrateClients, loadClients, loadDocuments, type StoredDocument } from "@/lib/workspace-store";
import styles from "./page.module.css";

type ActivityItem = {
  icon: string;
  title: string;
  detail: string;
  amount: string;
  status: string;
};

function getStatusClass(status: string) {
  if (status === "Payée") return "status-success";
  if (status === "En attente") return "status-warning";
  if (status === "En retard") return "status-danger";
  return "status-cyan";
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
}

function parseDocumentDate(value: string) {
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  const normalized = value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(\d{1,2}) ([a-zéû]+) (\d{4})$/);
  if (!match) return 0;

  const monthMap: Record<string, number> = {
    janvier: 0,
    fevrier: 1,
    février: 1,
    mars: 2,
    avril: 3,
    avr: 3,
    mai: 4,
    juin: 5,
    juillet: 6,
    aout: 7,
    août: 7,
    septembre: 8,
    octobre: 9,
    novembre: 10,
    decembre: 11,
    décembre: 11
  };

  const [, day, monthLabel, year] = match;
  const month = monthMap[monthLabel];
  if (month === undefined) return 0;

  return new Date(Number(year), month, Number(day)).getTime();
}

export default function DashboardPage() {
  const [firstName, setFirstName] = useState("toi");
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [period, setPeriod] = useState<"mois" | "annee">("mois");
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");

  const monthOptions = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Fev" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Avr" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aou" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" }
  ] as const;
  const yearOptions = ["2024", "2025", "2026", "2027"] as const;

  useEffect(() => {
    function syncDashboard() {
      const account = loadAccount();
      const nextDocuments = loadDocuments();
      setDocuments(nextDocuments);
      setFirstName((account.fullName || "").split(" ").filter(Boolean)[0] || "toi");
    }

    syncDashboard();
    window.addEventListener("atelio-workspace-updated", syncDashboard);
    window.addEventListener("atelio-account-updated", syncDashboard);

    return () => {
      window.removeEventListener("atelio-workspace-updated", syncDashboard);
      window.removeEventListener("atelio-account-updated", syncDashboard);
    };
  }, []);

  const chartData = useMemo(() => {
    if (period === "annee") {
      const monthlyTotals = new Array(12).fill(0);

      documents.forEach((document) => {
        const date = new Date(parseDocumentDate(document.date));
        if (Number.isNaN(date.getTime())) return;
        if (String(date.getFullYear()) !== selectedYear) return;
        monthlyTotals[date.getMonth()] += parseAmount(document.amount);
      });

      return monthOptions.map((month, index) => ({
        label: month.label,
        value: monthlyTotals[index]
      }));
    }

    const weeklyTotals = [0, 0, 0, 0];

    documents.forEach((document) => {
      const date = new Date(parseDocumentDate(document.date));
      if (Number.isNaN(date.getTime())) return;
      if (String(date.getFullYear()) !== selectedYear) return;
      if (String(date.getMonth() + 1).padStart(2, "0") !== selectedMonth) return;

      const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7));
      weeklyTotals[weekIndex] += parseAmount(document.amount);
    });

    return weeklyTotals.map((value, index) => ({
      label: `S${index + 1}`,
      value
    }));
  }, [documents, period, selectedMonth, selectedYear]);

  const revenueSummary = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const peak = chartData.reduce(
      (max, item) => (item.value > max.value ? item : max),
      chartData[0] ?? { label: "—", value: 0 }
    );
    const average = chartData.length ? Math.round(total / chartData.length) : 0;

    return {
      total: `${total.toLocaleString("fr-FR")} €`,
      average: `${average.toLocaleString("fr-FR")} €`,
      peak
    };
  }, [chartData]);

  const monthlySummary = useMemo(() => {
    const currentMonthDocs = documents.filter((document) => {
      const date = new Date(parseDocumentDate(document.date));
      return (
        !Number.isNaN(date.getTime()) &&
        String(date.getFullYear()) === selectedYear &&
        String(date.getMonth() + 1).padStart(2, "0") === selectedMonth
      );
    });

    return [
      { label: "Documents du mois", value: String(currentMonthDocs.length), accent: "amber" },
      {
        label: "Brouillons",
        value: String(currentMonthDocs.filter((document) => document.status === "Brouillon").length),
        accent: "violet"
      },
      {
        label: "En retard",
        value: String(currentMonthDocs.filter((document) => document.status === "En retard").length),
        accent: "coral"
      },
      {
        label: "Finalisés",
        value: String(currentMonthDocs.filter((document) => document.status === "Payée" || document.status === "Signé").length),
        accent: "green"
      }
    ] as const;
  }, [documents, selectedMonth, selectedYear]);

  const recentDashboardActivity = useMemo<ActivityItem[]>(() => {
    return [...documents]
      .sort((left, right) => parseDocumentDate(right.date) - parseDocumentDate(left.date))
      .slice(0, 5)
      .map((document) => ({
        icon: document.type === "Facture" ? "F" : document.type === "Devis" ? "D" : document.type === "Contrat" ? "C" : "A",
        title: document.id,
        detail: `${document.client} · ${document.date}`,
        amount: document.amount,
        status: document.status
      }));
  }, [documents]);

  const topDashboardClients = useMemo(() => {
    return hydrateClients(loadClients(), documents)
      .sort((left, right) => parseAmount(right.total) - parseAmount(left.total))
      .slice(0, 4);
  }, [documents]);

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const selectedMonthLabel = monthOptions.find((month) => month.value === selectedMonth)?.label ?? "Avr";

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Vue générale</div>
          <h1 className={styles.title}>
            Bonjour, <span className={styles.gradient}>{firstName}</span>
          </h1>
        </div>
        <button className="button button-secondary button-small" type="button">
          {selectedMonthLabel} {selectedYear}
        </button>
      </section>

      <section className={styles.revenuePanel}>
        <div className={styles.revenueHead}>
          <div>
            <div className={styles.revenueLabel}>Suivi du chiffre d’affaires</div>
            <h2 className={styles.revenueTitle}>
              {period === "mois" ? `CA du mois de ${selectedMonthLabel} ${selectedYear}` : `CA de l'année ${selectedYear}`}
            </h2>
          </div>

          <div className={styles.revenueControls}>
            <div className={styles.segmented}>
              {(["mois", "annee"] as const).map((item) => (
                <button
                  className={`${styles.segmentButton} ${period === item ? styles.segmentButtonActive : ""}`}
                  key={item}
                  onClick={() => setPeriod(item)}
                  type="button"
                >
                  {item === "mois" ? "Mois" : "Année"}
                </button>
              ))}
            </div>

            <div className={styles.periodSelectors}>
              <select className={styles.compareSelect} onChange={(event) => setSelectedYear(event.target.value)} value={selectedYear}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {period === "mois" ? (
          <div className={styles.monthPicker}>
            {monthOptions.map((month) => (
              <button
                className={`${styles.monthButton} ${selectedMonth === month.value ? styles.monthButtonActive : ""}`}
                key={month.value}
                onClick={() => setSelectedMonth(month.value)}
                type="button"
              >
                {month.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.revenueBody}>
          <div className={styles.revenueSummaryRow}>
            <article className={styles.revenueStatCard}>
              <span className={styles.revenueStatLabel}>CA cumulé</span>
              <strong className={styles.revenueStatValue}>{revenueSummary.total}</strong>
              <span className={styles.revenueStatMeta}>
                {period === "mois" ? `sur ${selectedMonthLabel.toLowerCase()} ${selectedYear}` : `sur l'année ${selectedYear}`}
              </span>
            </article>
            <article className={styles.revenueStatCard}>
              <span className={styles.revenueStatLabel}>Moyenne</span>
              <strong className={styles.revenueStatValue}>{revenueSummary.average}</strong>
              <span className={styles.revenueStatMeta}>par {period === "mois" ? "semaine" : "mois"}</span>
            </article>
            <article className={styles.revenueStatCard}>
              <span className={styles.revenueStatLabel}>Pic observé</span>
              <strong className={styles.revenueStatValue}>{revenueSummary.peak.label}</strong>
              <span className={styles.revenueStatMeta}>{revenueSummary.peak.value.toLocaleString("fr-FR")} €</span>
            </article>
          </div>

          <div className={styles.revenueChart}>
            <div className={styles.chartBars}>
              {chartData.map((item) => (
                <div className={styles.chartColumn} key={item.label}>
                  <div className={styles.chartTrack}>
                    <div className={styles.chartBar} style={{ height: `${(item.value / maxValue) * 100}%` }} />
                  </div>
                  <div className={styles.chartFooter}>
                    <div className={styles.chartLabel}>{item.label}</div>
                    <div className={styles.chartValue}>{item.value.toLocaleString("fr-FR")} €</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Activité récente</h2>
            <button className="button button-secondary button-small" type="button">
              Voir tout
            </button>
          </div>

          <div className={styles.activityList}>
            {recentDashboardActivity.length ? (
              recentDashboardActivity.map((item) => (
                <div className={styles.activityItem} key={`${item.title}-${item.detail}`}>
                  <span className={styles.dot}>{item.icon}</span>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityTitle}>{item.title}</div>
                    <div className={styles.activityMeta}>{item.detail}</div>
                  </div>
                  <div className={styles.activitySide}>
                    <strong className={styles.amount}>{item.amount}</strong>
                    <span className={`status-pill ${getStatusClass(item.status)}`}>{item.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>Aucune activité pour l’instant. Crée un premier document pour alimenter le suivi.</div>
            )}
          </div>
        </article>

        <div className={styles.stack}>
          <article className={styles.sectionCompact}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Résumé mensuel</h2>
            </div>
            {monthlySummary.map((item) => (
              <div className={styles.statRow} key={item.label}>
                <span className={styles.statLabel}>{item.label}</span>
                <strong className={`${styles.statValue} ${styles[`accent${item.accent}`]}`}>{item.value}</strong>
              </div>
            ))}
          </article>

          <article className={styles.sectionCompact}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Top clients</h2>
            </div>
            {topDashboardClients.length ? (
              topDashboardClients.map((client) => (
                <div className={styles.clientItem} key={client.name}>
                  <span className={`${styles.clientToken} ${styles[`clientAccent${client.accent}`]}`}>{client.initials}</span>
                  <div className={styles.clientInfo}>
                    <div className={styles.clientTitle}>{client.name}</div>
                    <div className={styles.clientMeta}>{client.docs} documents</div>
                  </div>
                  <strong className={`${styles.amount} ${styles[`accent${client.accent === "pink" ? "coral" : client.accent}`]}`}>
                    {client.total}
                  </strong>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>Aucun client pour l’instant.</div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
