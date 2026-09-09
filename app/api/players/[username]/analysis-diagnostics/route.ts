import { NextResponse } from "next/server";
import { getAnalysisQueueDiagnostics, recoverStaleAnalysisWork } from "@/lib/analysis/queue";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{username:string}>}){const {username}=await params; await recoverStaleAnalysisWork().catch(()=>0); const data=await getAnalysisQueueDiagnostics(username); return data?NextResponse.json(data):NextResponse.json({error:"Player not found"},{status:404});}
