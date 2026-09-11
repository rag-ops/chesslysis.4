import OpeningIntelligenceClient from "@/components/openings/OpeningIntelligenceClient";
export const dynamic = "force-dynamic";
export default async function OpeningsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <OpeningIntelligenceClient username={username} />;
}
