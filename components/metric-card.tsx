type MetricCardProps = {
  label: string;
  value: string;
  subtext: string;
};

export function MetricCard({ label, value, subtext }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <h3 className="metric-value">{value}</h3>
      <p className="metric-subtext">{subtext}</p>
    </article>
  );
}
