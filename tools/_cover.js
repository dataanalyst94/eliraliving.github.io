/* Facebook cover photo: calm botanical bg (Gemini) + scrim + white wordmark + gold proof line.
   Run: node tools/_cover.js <OPENROUTER_KEY> */
const fs=require("fs"),path=require("path"),sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const KEY=process.argv[2]; if(!KEY){console.error("pass OpenRouter key");process.exit(1);}
const W=1702,H=630; // 2x of FB 851x315
const ROOT=path.join(__dirname,"..");
const b64=f=>fs.readFileSync(path.join(__dirname,"fonts",f)).toString("base64");
const FONTCSS=`<style>@font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${b64("Inter.ttf")}) format('truetype');}</style>`;
const ORH={Authorization:`Bearer ${KEY}`,"Content-Type":"application/json","HTTP-Referer":"https://www.eliraliving.com","X-Title":"Elira Living"};
const PROMPT="Wide minimalist clean-beauty banner background, soft eucalyptus and green botanical leaves arranged at the left and right edges, large empty calm negative space through the centre, pale neutral linen and stone surface, soft natural daylight, muted sage and cream tones, elegant and premium, no text, no logos, no product labels.";
async function genBg(){
  const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:ORH,
    body:JSON.stringify({model:"google/gemini-2.5-flash-image",modalities:["image","text"],max_tokens:8192,messages:[{role:"user",content:[{type:"text",text:PROMPT}]}]})});
  const d=await res.json(); if(!res.ok)throw new Error(`${res.status} ${JSON.stringify(d).slice(0,300)}`);
  const img=d.choices?.[0]?.message?.images?.[0]?.image_url?.url; if(!img)throw new Error("no image "+JSON.stringify(d).slice(0,200));
  return sharp(Buffer.from(img.split(",")[1],"base64")).resize(W,H,{fit:"cover",position:"centre"}).toBuffer();
}
(async()=>{
  const bg=await genBg();
  // soft ink scrim for legibility (centre a touch darker)
  const scrim=Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="r" cx="50%" cy="45%" r="62%"><stop offset="0%" stop-color="#171B12" stop-opacity="0.62"/><stop offset="100%" stop-color="#171B12" stop-opacity="0.38"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`);
  // white wordmark, centred
  const logo=fs.readFileSync(path.join(ROOT,"assets","img","brand","logo-hires-transparent.png"));
  const lw=560, lg=await sharp(logo).resize({width:lw}).toBuffer();
  const lm=await sharp(lg).metadata();
  const lleft=Math.round((W-lw)/2), ltop=Math.round((H-lm.height)/2)-34;
  // gold proof line + rule
  const cy=ltop+lm.height+54;
  const overlay=Buffer.from(`<svg width="${W}" height="${H}">${FONTCSS}
    <line x1="${W/2-150}" y1="${cy-44}" x2="${W/2+150}" y2="${cy-44}" stroke="#C8A24E" stroke-width="2" opacity="0.9"/>
    <text x="${W/2}" y="${cy}" fill="#ECE7DB" font-family="InterEmbed,sans-serif" font-size="30" letter-spacing="7" text-anchor="middle">COSMOS NATURAL  ·  VEGAN  ·  MADE IN THE EU</text>
  </svg>`);
  await sharp(bg)
    .composite([{input:scrim},{input:lg,top:ltop,left:lleft},{input:overlay}])
    .jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(path.join(ROOT,"assets","img","brand","facebook-cover.jpg"));
  const m=await sharp(path.join(ROOT,"assets","img","brand","facebook-cover.jpg")).metadata();
  console.log("wrote facebook-cover.jpg",m.width+"x"+m.height);
})().catch(e=>{console.error(e.message);process.exit(1);});
