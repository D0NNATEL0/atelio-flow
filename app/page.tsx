import DashboardPage from "@/app/page";
import { WorkspaceShell } from "@/components/WorkspaceShell";

export default function Home() {
  return (
    <WorkspaceShell>
      <DashboardPage />
    </WorkspaceShell>
  );
}
