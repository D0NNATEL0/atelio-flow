import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atelio",
  description: "Atelio aide les professionnels à créer des devis, factures et relances."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
