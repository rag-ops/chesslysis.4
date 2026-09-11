import { NextResponse } from "next/server";
import { getPlayerInsights } from "@/lib/insights/player-insights";
import { errorMessage } from "@/lib/api/errors";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_r:Request,{params}:{params:Promise<{username:string}>}){const{username}=await params; if(!username.trim())return NextResponse.json({error:"Username is required",code:"INVALID_USERNAME"},{status:400});try{const data=await getPlayerInsights(username);if(!data)return NextResponse.json({error:"Player not imported yet",code:"PLAYER_NOT_IMPORTED"},{status:404});return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}})}catch(e){console.error(e);return NextResponse.json({error:"Insights data is temporarily unavailable",detail:errorMessage(e),code:"INSIGHTS_UNAVAILABLE"},{status:503})}}
