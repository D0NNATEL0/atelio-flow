import { AppShell } from "@/components/app-shell";
import { CreateClientForm } from "@/components/create-client-form";

export default function NewClientPage() {
  return (
    <AppShell
      title="Nouveau client"
      description="Ajoutez un client pour préparer ensuite vos devis et vos factures."
    >
      <CreateClientForm />
    </AppShell>
  );
}
