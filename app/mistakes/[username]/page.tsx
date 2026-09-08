import RecurringMistakesClient from "@/components/mistakes/RecurringMistakesClient";
export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{username:string}>}){const {username}=await params;return <RecurringMistakesClient username={username}/>}
