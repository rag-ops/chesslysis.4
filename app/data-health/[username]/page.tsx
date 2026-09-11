import DataHealthClient from "@/components/data-health/DataHealthClient";
export const dynamic = "force-dynamic";
export default async function DataHealthPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <DataHealthClient username={username} />;
}
