/* AI backgrounds for the weak-stock concepts (c1 irritated cheek, c7 calm scalp).
   Run: node tools/gen-deck-bg.js <OPENROUTER_KEY> */
const fs=require("fs"),path=require("path"),sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const KEY=process.argv[2]; if(!KEY){console.error("pass OpenRouter key");process.exit(1);}
const W=1080,H=1350;
const OUT=path.join(__dirname,"..","marketing","social","carousels","_stock","_ai");fs.mkdirSync(OUT,{recursive:true});
const ORH={Authorization:`Bearer ${KEY}`,"Content-Type":"application/json","HTTP-Referer":"https://www.eliraliving.com","X-Title":"Elira Living"};
const STYLE="Photorealistic, editorial skincare photography, soft natural daylight, shallow depth of field, calm neutral tones, vertical 4:5, no text, no watermark, no logos.";
const JOBS=[
 {id:"c1",prompt:"Extreme close-up of a woman's cheek with mild natural redness and slight irritation on bare fair skin, real skin texture, no makeup, gentle and non-graphic. "+STYLE},
 {id:"c7",prompt:"Close-up of a calm, healthy scalp seen through softly parted brown hair, clean and flake-free, gentle daylight. "+STYLE},
];
async function gen(j){
 const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:ORH,
  body:JSON.stringify({model:"google/gemini-2.5-flash-image",modalities:["image","text"],max_tokens:8192,messages:[{role:"user",content:[{type:"text",text:j.prompt}]}]})});
 const d=await res.json();
 if(!res.ok)throw new Error(`${res.status} ${JSON.stringify(d).slice(0,300)}`);
 const img=d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
 if(!img)throw new Error("no image "+JSON.stringify(d).slice(0,300));
 await sharp(Buffer.from(img.split(",")[1],"base64")).resize(W,H,{fit:"cover"}).jpeg({quality:92,mozjpeg:true}).toFile(path.join(OUT,j.id+".jpg"));
 console.log("✓ gen",j.id);
}
(async()=>{for(const j of JOBS)await gen(j);console.log("done →",path.relative(process.cwd(),OUT));})().catch(e=>{console.error("ERR",e.message);process.exit(1);});
