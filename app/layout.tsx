import "./globals.css";
import type { Metadata } from "next";
import { AuthStorageSync } from "@/components/AuthStorageSync";

export const metadata: Metadata = {
  title: "Atelio Flow",
  description: "Atelio Flow, l’outil simple pour tes documents pro."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthStorageSync>{children}</AuthStorageSync>
      </body>
    </html>
  );
}
