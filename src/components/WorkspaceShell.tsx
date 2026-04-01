"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import "@/styles/globals.css";
import styles from "@/app/layout.module.css";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.app}>
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        <Topbar onMenuToggle={() => setSidebarOpen((value) => !value)} />
        <div className={styles.content}>{children}</div>
      </div>

      <MobileNav />
    </div>
  );
}
