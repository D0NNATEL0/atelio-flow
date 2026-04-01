"use client";

import Link from "next/link";
import { useMemo } from "react";

type RevenuePoint = {
  day: string;
  amount: number;
};

type RevenueChartProps = {
  total: string;
};

function buildMonthPoints(today: Date): RevenuePoint[] {
  const dayCount = today.getDate();

  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const base = 180 + ((day * 73) % 820);
    const wave = Math.round((Math.sin(day / 2.8) + 1) * 180);

    return {
      day: String(day),
      amount: base + wave
    };
  });
}

export function RevenueChart({ total }: RevenueChartProps) {
  const now = new Date();

  const { points, monthLabel } = useMemo(() => {
    return {
      points: buildMonthPoints(now),
      monthLabel: new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric"
      }).format(now)
    };
  }, [now]);

  const max = Math.max(...points.map((point) => point.amount), 1);

  return (
    <section className="revenue-card">
      <div className="revenue-head">
        <div className="revenue-copy">
          <span className="panel-label">Encaissements du mois</span>
          <h3>CA encaissé, jour après jour</h3>
          <p className="metric-subtext">Mois en cours : {monthLabel}</p>
        </div>

        <div className="revenue-side">
          <div className="revenue-total-block">
            <span className="panel-label">Total</span>
            <strong className="revenue-total">{total}</strong>
          </div>

          <Link className="button button-primary button-small" href="/app/tableau-de-bord">
            Voir en détail
          </Link>
        </div>
      </div>

      <div className="revenue-legend">
        <span>Jour du mois</span>
        <span>CA encaissé</span>
      </div>

      <div className="revenue-bars">
        {points.map((point, index) => {
          const height = `${Math.max((point.amount / max) * 100, 8)}%`;
          const showLabel =
            index === 0 ||
            index === points.length - 1 ||
            (index + 1) % 5 === 0 ||
            index === points.length - 2;

          return (
            <div className="revenue-bar-group" key={point.day}>
              <div className="revenue-bar-track">
                <div className="revenue-bar-fill" style={{ height }} />
              </div>
              <span className={`revenue-bar-label${showLabel ? "" : " is-muted"}`}>
                {showLabel ? point.day : "·"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
