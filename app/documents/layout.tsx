import { WorkspaceShell } from "@/components/WorkspaceShell";

export default function DocumentsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
