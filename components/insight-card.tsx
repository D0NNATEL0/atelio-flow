type InsightCardProps = {
  title: string;
  value: string;
  description: string;
};

export function InsightCard({ title, value, description }: InsightCardProps) {
  return (
    <article className="insight-card">
      <span className="panel-label">{title}</span>
      <strong className="insight-value">{value}</strong>
      <p className="metric-subtext">{description}</p>
    </article>
  );
}
