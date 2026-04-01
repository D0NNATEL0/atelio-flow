import { AppShell } from "@/components/app-shell";
import { CreateInvoiceForm } from "@/components/create-invoice-form";

export default function NewInvoicePage() {
  return (
    <AppShell
      title="Nouvelle facture"
      description="Préparez une facture et retrouvez-la directement dans le suivi d'encaissement."
    >
      <CreateInvoiceForm />
    </AppShell>
  );
}
