/* Fix the brittle array-grab in the Pick code nodes of all three posters.
   The HTTP manifest fetch returns the JSON array split into items, so
   `Array.isArray($json) ? $json : ($json.body||[])` yields []. Replace with a
   robust gatherer that handles split-items, single-array, .body and .data wraps. */
const KEY=process.env.N8N_API_KEY;
const BASE="https://n8n.eliraliving.com";
const IDS=["dw8ZukQfdaCXOA4L","BfpbLkhZEVlPmf6q","Z5dLwRfJe7KHRZEZ"]; // IG, FB, IG-carousel
const H={"X-N8N-API-KEY":KEY,"Content-Type":"application/json",accept:"application/json"};
const RE=/const\s+(\w+)\s*=\s*Array\.isArray\(\$json\)\s*\?\s*\$json\s*:\s*\(\$json\.body\s*\|\|\s*\[\]\)\s*;/;
function robust(v){return `let ${v}=$input.all().map(i=>i.json);if(${v}.length===1){const _j=${v}[0];if(Array.isArray(_j))${v}=_j;else if(Array.isArray(_j.body))${v}=_j.body;else if(Array.isArray(_j.data))${v}=_j.data;}`;}
async function api(m,p,b){const r=await fetch(BASE+p,{method:m,headers:H,body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status}\n${t}`);return t?JSON.parse(t):{};}
(async()=>{
  if(!KEY)throw new Error("set N8N_API_KEY");
  for(const id of IDS){
    const wf=await api("GET",`/api/v1/workflows/${id}`);
    let hit=null;
    for(const n of wf.nodes){
      if(n.parameters&&typeof n.parameters.jsCode==="string"&&RE.test(n.parameters.jsCode)){
        const v=n.parameters.jsCode.match(RE)[1];
        n.parameters.jsCode=n.parameters.jsCode.replace(RE,robust(v));
        hit=`${n.name} (var=${v})`;
      }
    }
    if(!hit){console.log(`· ${wf.name}: no brittle pattern found (already fixed or different)`);continue;}
    await api("PUT",`/api/v1/workflows/${id}`,{name:wf.name,nodes:wf.nodes,connections:wf.connections,settings:wf.settings||{executionOrder:"v1"}});
    const re=await api("POST",`/api/v1/workflows/${id}/activate`);
    console.log(`✓ ${wf.name}: fixed ${hit} | active=${re.active}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
