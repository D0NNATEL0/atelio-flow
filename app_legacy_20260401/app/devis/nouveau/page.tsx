import { AppShell } from "@/components/app-shell";
import { CreateQuoteForm } from "@/components/create-quote-form";

export default function NewQuotePage() {
  return (
    <AppShell
      title="Nouveau devis"
      description="Créez rapidement un devis et retrouvez-le aussitôt dans votre suivi."
    >
      <CreateQuoteForm />
    </AppShell>
  );
}
