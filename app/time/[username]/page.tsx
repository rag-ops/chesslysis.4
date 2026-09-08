import TimeManagementClient from "@/components/time/TimeManagementClient";
export const dynamic = "force-dynamic";
export default async function TimePage({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; return <TimeManagementClient username={username} />; }
