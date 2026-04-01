import { AccountOverview } from "@/components/account-overview";
import { AppShell } from "@/components/app-shell";

export default function AccountPage() {
  return (
    <AppShell
      title="Compte"
      description="Retrouvez les informations de votre profil professionnel et les réglages clés de votre espace."
    >
      <AccountOverview />
    </AppShell>
  );
}
