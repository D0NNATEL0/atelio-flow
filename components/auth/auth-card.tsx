import { ReactNode } from "react";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  footer,
  children
}: AuthCardProps) {
  return (
    <section className="auth-card">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-description">{description}</p>
      {children}
      {footer ? <div className="auth-footer">{footer}</div> : null}
    </section>
  );
}
