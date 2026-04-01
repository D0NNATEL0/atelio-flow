import { WorkspaceShell } from "@/components/WorkspaceShell";

export default function EditorLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
