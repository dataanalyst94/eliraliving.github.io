/* Set/restore a workflow's schedule cron. Usage:
   node _temp-cron.js <id> temp     -> fire ~3 min from now (today)
   node _temp-cron.js <id> restore <expr>  -> set cron back */
const KEY=process.env.N8N_API_KEY;const BASE="https://n8n.eliraliving.com";
const ID=process.argv[2],MODE=process.argv[3],EXPR=process.argv[4];
const H={"X-N8N-API-KEY":KEY,"Content-Type":"application/json",accept:"application/json"};
async function api(m,p,b){const r=await fetch(BASE+p,{method:m,headers:H,body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status}\n${t}`);return t?JSON.parse(t):{};}
(async()=>{
  const wf=await api("GET",`/api/v1/workflows/${ID}`);
  const node=wf.nodes.find(n=>n.type==="n8n-nodes-base.scheduleTrigger");
  let cron;
  if(MODE==="temp"){const d=new Date();d.setMinutes(d.getMinutes()+3);cron=`${d.getMinutes()} ${d.getHours()} * * *`;}
  else cron=EXPR;
  const iv=node.parameters.rule.interval[0];
  iv.expression=cron; iv.field="cronExpression";
  await api("PUT",`/api/v1/workflows/${ID}`,{name:wf.name,nodes:wf.nodes,connections:wf.connections,settings:wf.settings||{executionOrder:"v1"}});
  const re=await api("POST",`/api/v1/workflows/${ID}/activate`);
  console.log(`set cron="${cron}" | active=${re.active}`);
})().catch(e=>{console.error(e.message);process.exit(1);});
