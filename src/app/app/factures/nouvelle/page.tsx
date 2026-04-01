import { redirect } from "next/navigation";

export default function LegacyNewInvoicePage() {
  redirect("/editor");
}
