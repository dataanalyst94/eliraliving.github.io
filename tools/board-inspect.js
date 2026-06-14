const T = process.env.NOTION_TOKEN;
const DB = "37ea4815-a826-81cb-9ee9-e60372973062";
const h = { Authorization: `Bearer ${T}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
(async () => {
  const d = await (await fetch(`https://api.notion.com/v1/databases/${DB}`, { headers: h })).json();
  console.log("ALL PROPERTIES:");
  for (const [k, v] of Object.entries(d.properties)) {
    let opts = "";
    if (v.type === "status") opts = " = STATUS opts: " + v.status.options.map(o => o.name).join(" | ");
    if (v.type === "select") opts = " = SELECT opts: " + v.select.options.map(o => o.name).join(" | ");
    if (v.type === "checkbox") opts = " = CHECKBOX";
    console.log(" -", k, `(${v.type})` + opts);
  }
  // sample one task's full values
  const q = await (await fetch(`https://api.notion.com/v1/databases/${DB}/query`, { method: "POST", headers: h, body: JSON.stringify({ page_size: 3 }) })).json();
  console.log("\nSAMPLE TASK VALUES:");
  for (const r of q.results) {
    const out = {};
    for (const [k, v] of Object.entries(r.properties)) {
      if (v.type === "title") out[k] = (v.title[0] || {}).plain_text;
      else if (v.type === "status") out[k] = (v.status || {}).name;
      else if (v.type === "select") out[k] = (v.select || {}).name;
      else if (v.type === "checkbox") out[k] = v.checkbox;
    }
    console.log(JSON.stringify(out));
  }
})().catch(e => console.error(e.message));
