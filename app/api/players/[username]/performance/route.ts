import { NextResponse } from "next/server";
import { getPlayerPerformance } from "@/lib/db/performance";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_r:Request,{params}:{params:Promise<{username:string}>}){const {username}=await params; try{const data=await getPlayerPerformance(username); if(!data)return NextResponse.json({error:"Player not imported yet",code:"PLAYER_NOT_IMPORTED"},{status:404}); return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});}catch(e){console.error(e);return NextResponse.json({error:"Performance data is temporarily unavailable",code:"PERFORMANCE_UNAVAILABLE"},{status:503});}}
