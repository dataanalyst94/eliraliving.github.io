/* LinkedIn covers: profile banner 1584x396 + company page 1128x191.
   Calm botanical bg (Gemini) + scrim + white wordmark + positioning + gold proof line.
   Run: node tools/_linkedin-cover.js <OPENROUTER_KEY> */
const fs=require("fs"),path=require("path"),sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const KEY=process.argv[2]; if(!KEY){console.error("pass OpenRouter key");process.exit(1);}
const ROOT=path.join(__dirname,"..");
const BRAND=path.join(ROOT,"assets","img","brand");
const b64=f=>fs.readFileSync(path.join(__dirname,"fonts",f)).toString("base64");
const FONTCSS=`<style>@font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${b64("Inter.ttf")}) format('truetype');}</style>`;
const ORH={Authorization:`Bearer ${KEY}`,"Content-Type":"application/json","HTTP-Referer":"https://www.eliraliving.com","X-Title":"Elira Living"};
const PROMPT="Wide minimalist clean-beauty banner background, soft eucalyptus and green botanical leaves arranged only along the far left and far right edges, large calm empty negative space across the centre, pale neutral linen and stone surface, soft natural daylight, muted sage and cream tones, elegant premium editorial, no text, no logos, no product labels.";
const logoBuf=fs.readFileSync(path.join(BRAND,"logo-hires-transparent.png"));

async function genRaw(){
  const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:ORH,
    body:JSON.stringify({model:"google/gemini-2.5-flash-image",modalities:["image","text"],max_tokens:8192,messages:[{role:"user",content:[{type:"text",text:PROMPT}]}]})});
  const d=await res.json(); if(!res.ok)throw new Error(`${res.status} ${JSON.stringify(d).slice(0,300)}`);
  const img=d.choices?.[0]?.message?.images?.[0]?.image_url?.url; if(!img)throw new Error("no image");
  return Buffer.from(img.split(",")[1],"base64");
}
async function compose(raw,W,H,logoW,posSize,proofSize,out,withPos){
  const bg=await sharp(raw).resize(W,H,{fit:"cover",position:"centre"}).toBuffer();
  const scrim=Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="r" cx="50%" cy="44%" r="65%"><stop offset="0%" stop-color="#171B12" stop-opacity="0.60"/><stop offset="100%" stop-color="#171B12" stop-opacity="0.40"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`);
  const lg=await sharp(logoBuf).resize({width:logoW}).toBuffer();
  const lm=await sharp(lg).metadata();
  const blockH=lm.height+(withPos?posSize+24:0)+40+proofSize;
  const top=Math.round((H-blockH)/2);
  const lleft=Math.round((W-logoW)/2);
  const posY=top+lm.height+posSize+10;
  const ruleY=withPos?posY+34:top+lm.height+40;
  const proofY=ruleY+proofSize+18;
  const pos=withPos?`<text x="${W/2}" y="${posY}" fill="#ECE7DB" font-family="InterEmbed,sans-serif" font-size="${posSize}" letter-spacing="1" text-anchor="middle">Certified natural skincare for sensitive skin</text>`:"";
  const overlay=Buffer.from(`<svg width="${W}" height="${H}">${FONTCSS}
    ${pos}
    <line x1="${W/2-130}" y1="${ruleY}" x2="${W/2+130}" y2="${ruleY}" stroke="#C8A24E" stroke-width="2" opacity="0.9"/>
    <text x="${W/2}" y="${proofY}" fill="#ECE7DB" font-family="InterEmbed,sans-serif" font-size="${proofSize}" letter-spacing="6" text-anchor="middle">COSMOS NATURAL  ·  VEGAN  ·  MADE IN THE EU</text>
  </svg>`);
  await sharp(bg).composite([{input:scrim},{input:lg,top,left:lleft},{input:overlay}])
    .jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(path.join(BRAND,out));
  const m=await sharp(path.join(BRAND,out)).metadata();
  console.log("wrote",out,m.width+"x"+m.height);
}
(async()=>{
  const raw=await genRaw();
  await compose(raw,1584,396,360,26,22,"linkedin-banner-1584x396.jpg",true);   // personal profile banner
  await compose(raw,1128,191,230,0,16,"linkedin-company-1128x191.jpg",false);  // company page (tight)
})().catch(e=>{console.error(e.message);process.exit(1);});
