import { WorkspaceShell } from "@/components/WorkspaceShell";

export default function ClientsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
