import PlayerDNAClient from "@/components/dna/PlayerDNAClient";
export const dynamic = "force-dynamic";
export default async function PlayerDNAPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <PlayerDNAClient username={username} />;
}
