/** Lightweight board-geometry pattern detector. It intentionally labels only
 * patterns that can be inferred from a move's before/after position without
 * pretending to know a tactic from engine evaluation alone. */
type Piece = { type: string; color: "w" | "b" };
type Board = (Piece | null)[][];

const files = "abcdefgh";
function sq(file: number, rank: number) { return files[file] + (8 - rank); }
function coords(square: string) { return [files.indexOf(square[0]), 8 - Number(square[1])] as const; }
function inside(f:number,r:number){ return f>=0&&f<8&&r>=0&&r<8; }
const values: Record<string, number> = { p:1,n:3,b:3,r:5,q:9,k:100 };

function attacks(board: Board, from: string, piece: Piece): string[] {
 const [f,r]=coords(from); const out:string[]=[];
 const add=(ff:number,rr:number)=>{if(inside(ff,rr))out.push(sq(ff,rr));};
 if(piece.type==='n'){ for(const [df,dr] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) add(f+df,r+dr); return out; }
 if(piece.type==='k'){ for(const df of [-1,0,1])for(const dr of [-1,0,1])if(df||dr)add(f+df,r+dr); return out; }
 if(piece.type==='p'){ const dir=piece.color==='w'?-1:1; add(f-1,r+dir);add(f+1,r+dir);return out; }
 const dirs = piece.type==='b' ? [[1,1],[1,-1],[-1,1],[-1,-1]] : piece.type==='r' ? [[1,0],[-1,0],[0,1],[0,-1]] : [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
 for(const [df,dr] of dirs){ let ff=f+df,rr=r+dr; while(inside(ff,rr)){ out.push(sq(ff,rr)); if(board[rr][ff]) break; ff+=df;rr+=dr; } } return out;
}
function lineBetween(a:string,b:string,board:Board){ const [af,ar]=coords(a),[bf,br]=coords(b); const df=Math.sign(bf-af),dr=Math.sign(br-ar); if(!(af===bf||ar===br||Math.abs(bf-af)===Math.abs(br-ar)))return false; let f=af+df,r=ar+dr; while(f!==bf||r!==br){ if(board[r][f])return false; f+=df;r+=dr;} return true; }

export function detectTacticalPatterns(fenAfter:string, uci:string): string[] {
 const board = fenAfter.split(" ")[0].split("/").map(row=>{const out:(Piece|null)[]=[]; for(const c of row){if(/\d/.test(c))for(let i=0;i<Number(c);i++)out.push(null);else out.push({type:c.toLowerCase(),color:c===c.toUpperCase()?"w":"b"});}return out;});
 const to=uci.slice(2,4); const [f,r]=coords(to); const moved=board[r]?.[f]; if(!moved) return [];
 const tags:string[]=[]; const enemy=moved.color==='w'?'b':'w'; const targets=attacks(board,to,moved).map(s=>({s,p:board[coords(s)[1]][coords(s)[0]]})).filter((x):x is {s:string;p:Piece}=>!!x.p&&x.p.color===enemy);
 if(targets.filter(x=>values[x.p.type]>=3).length>=2) tags.push("fork");
 // Pin/skewer: a sliding piece attacks an enemy piece with a more valuable enemy piece directly behind it.
 if(['b','r','q'].includes(moved.type)) for(const first of targets){ if(!['b','n','r','q'].includes(first.p.type)) continue; const [ff,fr]=coords(first.s); const df=Math.sign(ff-f),dr=Math.sign(fr-r); let x=ff+df,y=fr+dr; while(inside(x,y)){const p=board[y][x]; if(p){if(p.color===enemy&&values[p.type]>values[first.p.type]) tags.push(p.type==='k'?"pin":"skewer"); break;} x+=df;y+=dr;}
 }
 // Simple hanging-piece signal: the moved piece attacks an enemy major/minor piece that has no friendly blocker relationship; useful as a conservative training tag.
 if(targets.some(x=>values[x.p.type]>=5)&&tags.length===0) tags.push("piece attack");
 return [...new Set(tags)].slice(0,2);
}
