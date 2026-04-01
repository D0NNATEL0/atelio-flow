"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/data";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  isOpen?: boolean;
  onNavigate?: () => void;
};

function getTodayLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

export function Sidebar({ isOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.logo}>
        <Image
          alt="Logo Atelio"
          className={styles.logoImage}
          height={42}
          priority
          src="/atelio-logo.png"
          width={42}
        />
        <div className={styles.logoCopy}>
          <strong className={styles.logoTitle}>Atelio</strong>
          <span className={styles.logoMeta}>Espace pro</span>
        </div>
      </div>

      <div className={styles.datePill}>{getTodayLabel()}</div>

      <div className={styles.navGroup}>
        <span className={styles.navLabel}>Principal</span>
        <div className={styles.navList}>
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <span className={styles.token}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {"badge" in item ? <span className={styles.badge}>{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.planCard}>
          <span className={styles.navLabel}>Plan</span>
          <strong>Free</strong>
          <p className={styles.planMeta}>Passez en premium pour aller plus vite et débloquer plus d’automatisation.</p>
          <Link className="button button-primary button-small" href="/documents">
            Voir l’espace
          </Link>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>MA</div>
          <div className={styles.userCopy}>
            <strong className={styles.userName}>Mathis</strong>
            <span className={styles.userRole}>Administrateur</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
