import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
export type UciInfo={depth?:number;scoreCp?:number;scoreMate?:number;pv?:string[]};
export type StockfishAnalysisResult={depth:number;evaluation:number;mate:number|null;bestMove:string|null;principalVariation:string[]};
function parseInfo(line:string):UciInfo|null{if(!line.startsWith('info '))return null;const t=line.trim().split(/\s+/),i:UciInfo={};const d=t.indexOf('depth');if(d>=0)i.depth=Number(t[d+1]);const s=t.indexOf('score');if(s>=0){const k=t[s+1],v=Number(t[s+2]);if(k==='cp'&&Number.isFinite(v))i.scoreCp=v;if(k==='mate'&&Number.isFinite(v))i.scoreMate=v;}const p=t.indexOf('pv');if(p>=0)i.pv=t.slice(p+1);return i;}
export function parseUciBestMove(line:string){return /^bestmove\s+(\S+)/.exec(line.trim())?.[1]??null;}
export function parseUciScore(i:UciInfo){return typeof i.scoreMate==='number'?{evaluation:i.scoreMate>0?100000:-100000,mate:i.scoreMate}:{evaluation:(i.scoreCp??0)/100,mate:null};}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export class StockfishUciEngine{
 private process:ChildProcessWithoutNullStreams|null=null;private buffer='';private lines:string[]=[];
 constructor(private readonly executablePath:string){}
 private reset(){this.process?.kill('SIGKILL');this.process=null;this.buffer='';this.lines=[];}
 private send(command:string){if(!this.process||this.process.stdin.destroyed)throw new Error('Stockfish process is not running');this.process.stdin.write(command+'\n');}
 private async waitFor(expected:string,timeoutMs=10000){const end=Date.now()+timeoutMs;while(Date.now()<end){const index=this.lines.findIndex(l=>l.trim()===expected);if(index>=0)return this.lines.splice(0,index+1);if(this.process?.exitCode!=null)throw new Error(`Stockfish exited before ${expected} (code ${this.process.exitCode})`);await sleep(5);}throw new Error(`Stockfish timeout waiting for ${expected}`);}
 private async start(){if(this.process)return;const child=spawn(this.executablePath,[],{stdio:'pipe'});this.process=child;child.stdout.setEncoding('utf8');child.stdout.on('data',(chunk:string)=>{this.buffer+=chunk;const parts=this.buffer.split(/\r?\n/);this.buffer=parts.pop()??'';this.lines.push(...parts);});child.stderr.setEncoding('utf8');let spawnError:Error|undefined;child.once('error',e=>{spawnError=e;});
  this.send('uci');try{await this.waitFor('uciok');if(spawnError)throw spawnError;this.lines=[];this.send('isready');await this.waitFor('readyok');}catch(e){this.reset();throw new Error(`Unable to initialize Stockfish at ${this.executablePath}: ${e instanceof Error?e.message:String(e)}`);}}
 async analyze(fen:string,depth=18,options:{moveTimeMs?:number}={}){await this.start();this.lines=[];this.send(`position fen ${fen}`);const budget=Math.max(80,Math.min(options.moveTimeMs??1000,10_000));this.send(`go movetime ${budget}`);let lines:string[];try{lines=await this.waitForBestMove(Math.max(3000,budget*8));}catch(e){this.reset();throw e;}let latest:UciInfo={};for(const line of lines){const parsed=parseInfo(line);if(parsed&&typeof parsed.depth==='number')latest=parsed;}const score=parseUciScore(latest);return{depth:latest.depth??depth,evaluation:score.evaluation,mate:score.mate,bestMove:lines.map(parseUciBestMove).find(Boolean)??null,principalVariation:latest.pv??[]};}
 private async waitForBestMove(timeoutMs:number){const end=Date.now()+timeoutMs;while(Date.now()<end){const index=this.lines.findIndex(l=>l.startsWith('bestmove '));if(index>=0)return this.lines.splice(0,index+1);if(this.process?.exitCode!=null)throw new Error(`Stockfish exited during analysis (code ${this.process.exitCode})`);await sleep(5);}throw new Error('Stockfish analysis timed out');}
 async close(){if(!this.process)return;try{this.send('quit');await Promise.race([once(this.process,'exit'),sleep(1000)]);}finally{if(this.process?.exitCode==null)this.process?.kill('SIGKILL');this.process=null;}}
}
