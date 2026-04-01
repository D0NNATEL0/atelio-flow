type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  tag: string;
  featured?: boolean;
  features: readonly string[];
};

export function PlanCard({
  name,
  price,
  period,
  tag,
  featured = false,
  features
}: PlanCardProps) {
  return (
    <article className={`plan-card${featured ? " featured" : ""}`}>
      <div className="plan-header">
        <h3 className="plan-name">{name}</h3>
        <span className="plan-tag">{tag}</span>
      </div>

      <div className="plan-price">
        <span className="plan-amount">{price}</span>
        <span>{period}</span>
      </div>

      <ul className="plan-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}
