import { redirect } from "next/navigation";

export default function LegacyNewQuotePage() {
  redirect("/editor");
}
