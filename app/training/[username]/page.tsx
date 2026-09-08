import TrainingClient from "@/components/training/TrainingClient";
export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{username:string}>}){const {username}=await params;return <TrainingClient username={username}/>}
