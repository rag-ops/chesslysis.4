import AppShell from "@/components/layout/AppShell";
import InspectorClient from "@/components/inspector/InspectorClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <AppShell username={username}><InspectorClient username={username} /></AppShell>;
}
