"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/data";
import styles from "./MobileNav.module.css";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bar}>
      <div className={styles.list}>
        {navItems.map((item) => (
          <Link
            className={`${styles.link} ${pathname === item.href ? styles.active : ""}`}
            href={item.href}
            key={item.href}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
