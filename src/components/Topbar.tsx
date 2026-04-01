"use client";

import { usePathname } from "next/navigation";
import styles from "./Topbar.module.css";

type TopbarProps = {
  onMenuToggle: () => void;
};

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/documents": "Documents",
  "/clients": "Clients",
  "/editor": "Éditeur",
  "/app": "Dashboard",
  "/app/tableau-de-bord": "Dashboard",
  "/app/devis": "Documents",
  "/app/factures": "Documents",
  "/app/clients": "Clients",
  "/app/devis/nouveau": "Éditeur",
  "/app/factures/nouvelle": "Éditeur"
};

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <button className={styles.menuButton} onClick={onMenuToggle} type="button">
          ☰
        </button>
        <strong className={styles.title}>{titles[pathname] ?? "Atelio"}</strong>
      </div>

      <div className={styles.right}>
        <button className={styles.iconButton} type="button">
          ◌
          <span className={styles.iconDot} />
        </button>
        <a className="button button-primary button-small" href="/editor">
          + Créer
        </a>
      </div>
    </header>
  );
}
