"use client";

import { useMemo, useState } from "react";
import { monthlyStats, recentActivity, topClients } from "@/data";
import styles from "./page.module.css";

function getStatusClass(status: string) {
  if (status === "Payée") return "status-success";
  if (status === "En attente") return "status-warning";
  if (status === "En retard") return "status-danger";
  return "status-cyan";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"semaine" | "mois" | "annee">("mois");
  const [selectedWeek, setSelectedWeek] = useState("2026-W14");
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [comparison, setComparison] = useState<"precedente" | "annee">("precedente");
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

  const chartData = useMemo(() => {
    if (period === "semaine") {
      return [
        { label: "Lun", value: 2400 },
        { label: "Mar", value: 1850 },
        { label: "Mer", value: 3120 },
        { label: "Jeu", value: 2740 },
        { label: "Ven", value: 3560 },
        { label: "Sam", value: 920 },
        { label: "Dim", value: 640 }
      ];
    }

    if (period === "annee") {
      return [
        { label: "Jan", value: 18400 },
        { label: "Fev", value: 16200 },
        { label: "Mar", value: 21180 },
        { label: "Avr", value: 26420 },
        { label: "Mai", value: 22840 },
        { label: "Jun", value: 25160 },
        { label: "Jul", value: 19840 },
        { label: "Aou", value: 17400 },
        { label: "Sep", value: 23120 },
        { label: "Oct", value: 24860 },
        { label: "Nov", value: 26640 },
        { label: "Dec", value: 28900 }
      ];
    }

    const monthDataMap: Record<string, { label: string; value: number }[]> = {
      "01": [
        { label: "S1", value: 12600 },
        { label: "S2", value: 14900 },
        { label: "S3", value: 13850 },
        { label: "S4", value: 16120 }
      ],
      "02": [
        { label: "S1", value: 14200 },
        { label: "S2", value: 15820 },
        { label: "S3", value: 14950 },
        { label: "S4", value: 17240 }
      ],
      "03": [
        { label: "S1", value: 16850 },
        { label: "S2", value: 19120 },
        { label: "S3", value: 20440 },
        { label: "S4", value: 21860 }
      ],
      "04": [
        { label: "S1", value: 18400 },
        { label: "S2", value: 23900 },
        { label: "S3", value: 21180 },
        { label: "S4", value: 26420 }
      ],
      "05": [
        { label: "S1", value: 17620 },
        { label: "S2", value: 20840 },
        { label: "S3", value: 22610 },
        { label: "S4", value: 24780 }
      ],
      "06": [
        { label: "S1", value: 16240 },
        { label: "S2", value: 19480 },
        { label: "S3", value: 21820 },
        { label: "S4", value: 23160 }
      ],
      "07": [
        { label: "S1", value: 14900 },
        { label: "S2", value: 16840 },
        { label: "S3", value: 18120 },
        { label: "S4", value: 19420 }
      ],
      "08": [
        { label: "S1", value: 12100 },
        { label: "S2", value: 13420 },
        { label: "S3", value: 14560 },
        { label: "S4", value: 15880 }
      ],
      "09": [
        { label: "S1", value: 17480 },
        { label: "S2", value: 20120 },
        { label: "S3", value: 21640 },
        { label: "S4", value: 22980 }
      ],
      "10": [
        { label: "S1", value: 18220 },
        { label: "S2", value: 21420 },
        { label: "S3", value: 23680 },
        { label: "S4", value: 24860 }
      ],
      "11": [
        { label: "S1", value: 19640 },
        { label: "S2", value: 22880 },
        { label: "S3", value: 24420 },
        { label: "S4", value: 26640 }
      ],
      "12": [
        { label: "S1", value: 20840 },
        { label: "S2", value: 23420 },
        { label: "S3", value: 25180 },
        { label: "S4", value: 28900 }
      ]
    };

    return monthDataMap[selectedMonth];
  }, [period, selectedMonth]);

  const revenueSummary = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const peak = chartData.reduce((max, item) => (item.value > max.value ? item : max), chartData[0]);
    const average = Math.round(total / chartData.length);

    return {
      total: `${total.toLocaleString("fr-FR")} €`,
      average: `${average.toLocaleString("fr-FR")} €`,
      peak,
      comparisonLabel: comparison === "precedente" ? "vs période précédente" : "vs année précédente",
      comparisonValue: comparison === "precedente" ? "+12,4%" : "+8,1%"
    };
  }, [chartData, comparison]);

  const maxValue = Math.max(...chartData.map((item) => item.value));

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <div className={styles.tag}>Vue générale</div>
          <h1 className={styles.title}>
            Bonjour, <span className={styles.gradient}>Mathis</span>
          </h1>
        </div>
        <button className="button button-secondary button-small" type="button">
          Avril 2026
        </button>
      </section>

      <section className={styles.revenuePanel}>
        <div className={styles.revenueHead}>
          <div>
            <div className={styles.revenueLabel}>Suivi du chiffre d’affaires</div>
            <h2 className={styles.revenueTitle}>CA sur la période choisie</h2>
          </div>

          <div className={styles.revenueControls}>
            <div className={styles.segmented}>
                  {(["semaine", "mois", "annee"] as const).map((item) => (
                    <button
                      className={`${styles.segmentButton} ${period === item ? styles.segmentButtonActive : ""}`}
                      key={item}
                      onClick={() => setPeriod(item)}
                      type="button"
                    >
                  {item === "semaine" ? "Semaine" : item === "mois" ? "Mois" : "Année"}
                    </button>
                  ))}
                </div>

            {period === "semaine" ? (
              <input
                className={styles.dateInput}
                onChange={(event) => setSelectedWeek(event.target.value)}
                type="week"
                value={selectedWeek}
              />
            ) : (
              <select
                className={styles.compareSelect}
                onChange={(event) => setSelectedYear(event.target.value)}
                value={selectedYear}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}

            <select
              className={styles.compareSelect}
              onChange={(event) => setComparison(event.target.value as "precedente" | "annee")}
              value={comparison}
            >
              <option value="precedente">Comparer à la période précédente</option>
              <option value="annee">Comparer à l’année précédente</option>
            </select>
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
              <span className={styles.revenueStatMeta}>{revenueSummary.comparisonValue} {revenueSummary.comparisonLabel}</span>
            </article>
            <article className={styles.revenueStatCard}>
              <span className={styles.revenueStatLabel}>Moyenne</span>
              <strong className={styles.revenueStatValue}>{revenueSummary.average}</strong>
              <span className={styles.revenueStatMeta}>par {period === "semaine" ? "jour" : period === "mois" ? "semaine" : "mois"}</span>
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
            {recentActivity.map((item) => (
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
            ))}
          </div>
        </article>

        <div className={styles.stack}>
          <article className={styles.sectionCompact}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Résumé mensuel</h2>
            </div>
            {monthlyStats.map((item) => (
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
            {topClients.map((client) => (
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
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
