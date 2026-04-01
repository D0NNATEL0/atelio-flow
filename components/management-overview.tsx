"use client";

import { ReactNode } from "react";
import { InsightCard } from "@/components/insight-card";

type SummaryCard = {
  title: string;
  value: string;
  description: string;
};

type ManagementOverviewProps = {
  summaries: SummaryCard[];
  panelTitle: string;
  panelDescription: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export function ManagementOverview({
  summaries,
  panelTitle,
  panelDescription,
  fullWidth = false,
  children
}: ManagementOverviewProps) {
  return (
    <>
      {summaries.length ? (
        <div className="insight-grid">
          {summaries.map((summary) => (
            <InsightCard key={summary.title} {...summary} />
          ))}
        </div>
      ) : null}

      <div className={`content-grid management-grid${fullWidth ? " management-grid-full" : ""}`}>
        <section>{children}</section>

        {!fullWidth ? (
          <aside className="stack-grid">
            <div className="mini-card management-panel">
              {panelTitle ? <h3>{panelTitle}</h3> : null}
              {panelDescription ? <p className="metric-subtext">{panelDescription}</p> : null}
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
