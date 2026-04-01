"use client";

import { useMemo, useState } from "react";
import { InsightCard } from "@/components/insight-card";
import { appInsightsByPeriod, dashboardPeriods } from "@/lib/content";

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseWeekValue(value: string) {
  const [year, weekPart] = value.split("-W");
  return { year: Number(year), week: Number(weekPart) };
}

function getDateFromWeek(year: number, week: number) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay() || 7;

  if (day <= 4) {
    simple.setUTCDate(simple.getUTCDate() - day + 1);
  } else {
    simple.setUTCDate(simple.getUTCDate() + 8 - day);
  }

  return new Date(simple.getUTCFullYear(), simple.getUTCMonth(), simple.getUTCDate());
}

function formatWeekValue(date: Date) {
  const target = new Date(date.valueOf());
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / 604800000);

  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateForInput(date);
}

function addWeeks(value: string, amount: number) {
  const { year, week } = parseWeekValue(value);
  const monday = getDateFromWeek(year, week);
  monday.setDate(monday.getDate() + amount * 7);
  return formatWeekValue(monday);
}

function getFrenchMonthLabel(value: string) {
  const [year, month] = value.split("-");
  if (!year || !month) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric"
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

function getFrenchDateLabel(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function getWeekLabel(value: string) {
  if (!value) return "";

  const { year, week } = parseWeekValue(value);
  const monday = getDateFromWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const short = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short"
  });

  return `Semaine ${String(week).padStart(2, "0")} · ${short.format(monday)} au ${short.format(sunday)}`;
}

function getRecentDayChoices(selectedDate: string) {
  const baseDate = new Date(`${selectedDate}T12:00:00`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - 3 + index);

    return {
      value: formatDateForInput(date),
      label: new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric"
      }).format(date)
    };
  });
}

function getRecentWeekChoices(selectedWeek: string) {
  const { year, week } = parseWeekValue(selectedWeek);
  const monday = getDateFromWeek(year, week);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() - 14 + index * 7);
    const value = formatWeekValue(date);
    const { week: weekNumber } = parseWeekValue(value);

    return {
      value,
      label: `S${String(weekNumber).padStart(2, "0")}`
    };
  });
}

function getMonthChoices(selectedYear: string) {
  return Array.from({ length: 12 }, (_, index) => ({
    value: `${selectedYear}-${String(index + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("fr-FR", {
      month: "short"
    }).format(new Date(Number(selectedYear), index, 1))
  }));
}

function getYearChoices(selectedYear: string) {
  const current = Number(selectedYear);
  return Array.from({ length: 5 }, (_, index) => String(current - 2 + index));
}

function formatComparisonPeriodLabel(
  period: (typeof dashboardPeriods)[number]["id"],
  selectedDate: string,
  selectedWeek: string,
  selectedMonth: string,
  selectedYear: string
) {
  if (period === "day") return getFrenchDateLabel(selectedDate);
  if (period === "week") return getWeekLabel(selectedWeek);
  if (period === "month") return getFrenchMonthLabel(selectedMonth);
  return `Année ${selectedYear}`;
}

export function DashboardOverview() {
  const [period, setPeriod] = useState<(typeof dashboardPeriods)[number]["id"]>("month");
  const [selectedDate, setSelectedDate] = useState("2026-03-30");
  const [selectedWeek, setSelectedWeek] = useState("2026-W14");
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [selectedYear, setSelectedYear] = useState("2026");

  const insights = appInsightsByPeriod[period];

  const selectedLabel = useMemo(() => {
    if (period === "day") return getFrenchDateLabel(selectedDate);
    if (period === "week") return getWeekLabel(selectedWeek);
    if (period === "month") return getFrenchMonthLabel(selectedMonth);
    return `Année ${selectedYear}`;
  }, [period, selectedDate, selectedMonth, selectedWeek, selectedYear]);

  const selectedMonthNumber = selectedMonth.split("-")[1] ?? "03";
  const comparison = useMemo(() => {
    if (period === "day") {
      const previousDate = addDays(selectedDate, -1);
      return {
        currentLabel: getFrenchDateLabel(selectedDate),
        previousLabel: getFrenchDateLabel(previousDate),
        currentValue: "620 €",
        previousValue: "540 €",
        delta: "+14,8 %",
        insight: "Le chiffre du jour progresse légèrement par rapport à la veille."
      };
    }

    if (period === "week") {
      const previousWeek = addWeeks(selectedWeek, -1);
      return {
        currentLabel: getWeekLabel(selectedWeek),
        previousLabel: getWeekLabel(previousWeek),
        currentValue: "2 480 €",
        previousValue: "2 120 €",
        delta: "+17,0 %",
        insight: "La semaine en cours encaisse mieux que la précédente."
      };
    }

    if (period === "month") {
      const [year, month] = selectedMonth.split("-");
      const currentDate = new Date(Number(year), Number(month) - 1, 1);
      const previousDate = new Date(Number(year), Number(month) - 2, 1);

      return {
        currentLabel: getFrenchMonthLabel(selectedMonth),
        previousLabel: new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric"
        }).format(previousDate),
        currentValue: "8 420 €",
        previousValue: "7 360 €",
        delta: "+14,4 %",
        insight: `Le mois de ${new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(currentDate)} fait mieux que le précédent.`
      };
    }

    const previousYear = String(Number(selectedYear) - 1);
    return {
      currentLabel: `Année ${selectedYear}`,
      previousLabel: `Année ${previousYear}`,
      currentValue: "74 800 €",
      previousValue: "68 200 €",
      delta: "+9,7 %",
      insight: "L’année en cours reste au-dessus du rythme de l’an passé."
    };
  }, [period, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  return (
    <>
      <div className="toolbar-card">
        <div>
          <span className="panel-label">Pilotage</span>
          <h3 className="toolbar-title">Vue par période</h3>
          <p className="toolbar-subtitle">{selectedLabel}</p>
        </div>

        <div className="toolbar-controls">
          <div className="segmented-control" role="tablist" aria-label="Période">
            {dashboardPeriods.map((item) => (
              <button
                key={item.id}
                className={`segment-button${period === item.id ? " active" : ""}`}
                onClick={() => setPeriod(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="period-selector-card">
            <div className="period-selector-head">
              <span className="panel-label">Sélection</span>

              {period === "day" ? (
                <div className="period-nav">
                  <button
                    className="period-nav-button"
                    onClick={() => setSelectedDate((current) => addDays(current, -1))}
                    type="button"
                  >
                    ←
                  </button>
                  <button
                    className="period-nav-button"
                    onClick={() => setSelectedDate((current) => addDays(current, 1))}
                    type="button"
                  >
                    →
                  </button>
                </div>
              ) : null}

              {period === "week" ? (
                <div className="period-nav">
                  <button
                    className="period-nav-button"
                    onClick={() => setSelectedWeek((current) => addWeeks(current, -1))}
                    type="button"
                  >
                    ←
                  </button>
                  <button
                    className="period-nav-button"
                    onClick={() => setSelectedWeek((current) => addWeeks(current, 1))}
                    type="button"
                  >
                    →
                  </button>
                </div>
              ) : null}

              {period === "month" || period === "year" ? (
                <div className="period-nav">
                  <button
                    className="period-nav-button"
                    onClick={() => {
                      if (period === "month") {
                        setSelectedYear((current) => {
                          const nextYear = String(Number(current) - 1);
                          setSelectedMonth(`${nextYear}-${selectedMonthNumber}`);
                          return nextYear;
                        });
                        return;
                      }

                      setSelectedYear((current) => String(Number(current) - 1));
                    }}
                    type="button"
                  >
                    ←
                  </button>
                  <button
                    className="period-nav-button"
                    onClick={() => {
                      if (period === "month") {
                        setSelectedYear((current) => {
                          const nextYear = String(Number(current) + 1);
                          setSelectedMonth(`${nextYear}-${selectedMonthNumber}`);
                          return nextYear;
                        });
                        return;
                      }

                      setSelectedYear((current) => String(Number(current) + 1));
                    }}
                    type="button"
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>

            {period === "day" ? (
              <div className="period-pill-grid">
                {getRecentDayChoices(selectedDate).map((item) => (
                  <button
                    key={item.value}
                    className={`period-pill${selectedDate === item.value ? " active" : ""}`}
                    onClick={() => setSelectedDate(item.value)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {period === "week" ? (
              <div className="period-pill-grid period-pill-grid-compact">
                {getRecentWeekChoices(selectedWeek).map((item) => (
                  <button
                    key={item.value}
                    className={`period-pill${selectedWeek === item.value ? " active" : ""}`}
                    onClick={() => setSelectedWeek(item.value)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {period === "month" ? (
              <div className="period-selector-stack">
                <div className="period-selector-year">{selectedYear}</div>
                <div className="period-pill-grid period-pill-grid-months">
                  {getMonthChoices(selectedYear).map((item) => (
                    <button
                      key={item.value}
                      className={`period-pill${selectedMonth === item.value ? " active" : ""}`}
                      onClick={() => setSelectedMonth(item.value)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {period === "year" ? (
              <div className="period-pill-grid period-pill-grid-years">
                {getYearChoices(selectedYear).map((item) => (
                  <button
                    key={item}
                    className={`period-pill${selectedYear === item ? " active" : ""}`}
                    onClick={() => setSelectedYear(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="insight-grid">
        {insights.map((insight) => (
          <InsightCard key={insight.title} {...insight} />
        ))}
      </div>

      <section className="dashboard-comparison-card">
        <div className="dashboard-comparison-head">
          <div>
            <span className="panel-label">Comparatif</span>
            <h3>Comparer les périodes</h3>
          </div>
          <span className="dashboard-comparison-delta">{comparison.delta}</span>
        </div>

        <div className="dashboard-comparison-grid">
          <article className="dashboard-period-card">
            <span className="panel-label">Période actuelle</span>
            <strong>{comparison.currentLabel}</strong>
            <p className="dashboard-period-value">{comparison.currentValue}</p>
          </article>

          <article className="dashboard-period-card">
            <span className="panel-label">Période précédente</span>
            <strong>{comparison.previousLabel}</strong>
            <p className="dashboard-period-value">{comparison.previousValue}</p>
          </article>

          <article className="dashboard-period-card dashboard-period-card-highlight">
            <span className="panel-label">Lecture rapide</span>
            <strong>{comparison.delta}</strong>
            <p className="metric-subtext">{comparison.insight}</p>
          </article>
        </div>

        <div className="dashboard-comparison-bar">
          <div className="dashboard-comparison-track">
            <div className="dashboard-comparison-fill dashboard-comparison-fill-current" />
          </div>
          <div className="dashboard-comparison-track">
            <div className="dashboard-comparison-fill dashboard-comparison-fill-previous" />
          </div>
        </div>
        <div className="dashboard-comparison-legend">
          <span>{comparison.currentLabel}</span>
          <span>{comparison.previousLabel}</span>
        </div>
      </section>
    </>
  );
}
