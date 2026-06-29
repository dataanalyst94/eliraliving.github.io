/* Add EN link + hashtags to the live IG carousel poster's "Pick next carousel" code node. */
const KEY=process.env.N8N_API_KEY;
const BASE="https://n8n.eliraliving.com";
const ID="Z5dLwRfJe7KHRZEZ"; // Elira — Instagram carousel poster
const H={"X-N8N-API-KEY":KEY,"Content-Type":"application/json",accept:"application/json"};
const EN_LINK="en:'https://www.eliraliving.com/',";
const EN_TAGS="en:'#veganskincare #sensitiveskin #cleanbeauty #cosmosnatural #naturalskincare #madeintheeu #eliraliving',";
async function api(m,p,b){const r=await fetch(BASE+p,{method:m,headers:H,body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status}\n${t}`);return t?JSON.parse(t):{};}
(async()=>{
  if(!KEY)throw new Error("set N8N_API_KEY");
  const wf=await api("GET",`/api/v1/workflows/${ID}`);
  const node=wf.nodes.find(n=>(n.parameters&&typeof n.parameters.jsCode==="string"&&n.parameters.jsCode.includes("langLinks")));
  if(!node)throw new Error("code node with langLinks not found");
  let code=node.parameters.jsCode;
  let changed=[];
  if(!/en:\s*'https:\/\/www\.eliraliving\.com\/'/.test(code)){code=code.replace("const langLinks={","const langLinks={"+EN_LINK);changed.push("link");}
  if(!/en:\s*'#veganskincare/.test(code)){code=code.replace("const hashtags={","const hashtags={"+EN_TAGS);changed.push("hashtags");}
  if(!changed.length){console.log("already patched, nothing to do");return;}
  node.parameters.jsCode=code;
  await api("PUT",`/api/v1/workflows/${ID}`,{name:wf.name,nodes:wf.nodes,connections:wf.connections,settings:wf.settings||{executionOrder:"v1"}});
  const re=await api("POST",`/api/v1/workflows/${ID}/activate`);
  console.log("patched:",changed.join(", "),"| active:",re.active);
  console.log("EN line now present:", /en:\s*'#veganskincare/.test(node.parameters.jsCode));
})().catch(e=>{console.error(e.message);process.exit(1);});
