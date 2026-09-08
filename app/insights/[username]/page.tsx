import InsightsClient from "@/components/insights/InsightsClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <InsightsClient username={username} />;
}
