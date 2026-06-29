/* Render the 10 competitor-informed carousels from carousel-decks.json.
   Reuses the proven sharp+SVG pipeline (render + embedded Bodoni/Inter) from carousels.js.
   Premium template: photo/AI cover hook, editorial ink content cards, COSMOS proof, CTA.
   Run: node tools/render-decks.js [id1,id2|all] [en,de,nl]
*/
const fs=require("fs"),path=require("path");
const sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const ROOT=path.join(__dirname,"..");
// embed fonts locally so we control encode quality (highest)
const b64=f=>fs.readFileSync(path.join(__dirname,"fonts",f)).toString("base64");
const FONTCSS=`<style>@font-face{font-family:'BodoniEmbed';src:url(data:font/ttf;base64,${b64("Bodoni.ttf")}) format('truetype');}@font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${b64("Inter.ttf")}) format('truetype');}</style>`;
async function render(bgBuf,svgInner,defs){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">${FONTCSS}<defs>${defs||""}</defs>${svgInner}</svg>`;
  return sharp(bgBuf).resize(1080,1350,{fit:"cover"}).composite([{input:Buffer.from(svg)}])
    .jpeg({quality:95,mozjpeg:true,chromaSubsampling:"4:4:4"}).toBuffer();
}
const DECKS=JSON.parse(fs.readFileSync(path.join(ROOT,"marketing","social","carousel-decks.json"),"utf8")).decks;
const STOCK=path.join(ROOT,"marketing","social","carousels","_stock");
const PICKS=JSON.parse(fs.readFileSync(path.join(STOCK,"picks.json"),"utf8"));
const CLEAN=path.join(ROOT,"marketing","social","nano","clean");
const OUT=path.join(ROOT,"marketing","social","carousels");
const W=1080,H=1350;
const CC={cream:"#ECE7DB",gold:"#C8A24E",ink:"#171B12",charcoal:"#23291C"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const ONLY=(process.argv[2]||"all").split(",").filter(Boolean);
const LANGS=(process.argv[3]||"en").split(",").filter(Boolean);

function wrap(t,m){const w=String(t).split(" ");const o=[];let l="";for(const x of w){if((l+" "+x).trim().length>m){o.push(l.trim());l=x;}else l+=" "+x;}if(l.trim())o.push(l.trim());return o;}
function solid(hex){return sharp({create:{width:W,height:H,channels:3,background:hex}}).jpeg().toBuffer();}
function chrome(idx,total,color,swipe){
  const mark=`<text x="70" y="92" fill="${color}" font-family="BodoniEmbed,serif" font-size="34" letter-spacing="2">elira living</text>`;
  const ctr=`<text x="${W-70}" y="${H-50}" fill="${color}" font-family="InterEmbed,sans-serif" font-size="25" text-anchor="end" opacity="0.8">${idx} / ${total}</text>`;
  const sw=swipe?`<text x="${W-70}" y="92" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="23" text-anchor="end" letter-spacing="3">${esc(swipe)} →</text>`:"";
  return mark+ctr+sw;
}
function scrim(op){const id="g"+Math.random().toString(36).slice(2,7);return{def:`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${CC.ink}" stop-opacity="0"/><stop offset="48%" stop-color="${CC.ink}" stop-opacity="${op*0.55}"/><stop offset="100%" stop-color="${CC.ink}" stop-opacity="${op}"/></linearGradient>`,rect:`<rect width="${W}" height="${H}" fill="url(#${id})"/>`};}

const SWIPE={en:"swipe",de:"wischen",nl:"veeg"};
async function hookCard(bg,eyebrow,headline,total,lang){
  const g=scrim(0.9);const hl=wrap(headline,17);const base=H-160;const top=base-hl.length*90;
  const eb=`<text x="72" y="${top-58}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="27" letter-spacing="6" font-weight="600">${esc(eyebrow.toUpperCase())}</text>`;
  const head=hl.map((l,i)=>`<text x="70" y="${top+i*90}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="82">${esc(l)}</text>`).join("");
  return render(bg,g.rect+chrome(1,total,CC.cream,SWIPE[lang])+eb+head,g.def);
}
async function textCard(idx,eyebrow,text,total){
  const bg=await solid(CC.ink);const tl=wrap(text,26);const top=H/2-tl.length*32;
  const rule=`<rect x="72" y="${top-86}" width="64" height="5" fill="${CC.gold}"/>`;
  const eb=`<text x="72" y="${top-44}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="25" letter-spacing="5" font-weight="600">${esc(eyebrow.toUpperCase())}</text>`;
  const body=tl.map((l,i)=>`<text x="72" y="${top+i*64}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="50">${esc(l)}</text>`).join("");
  return render(bg,rule+eb+body+chrome(idx,total,CC.cream),"");
}
async function proofCard(idx,line,total){
  const bg=await solid(CC.cream);const cx=W/2,cy=470;
  const seal=`<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${CC.gold}" stroke-width="4"/>`+
    `<circle cx="${cx}" cy="${cy}" r="132" fill="none" stroke="${CC.gold}" stroke-width="1.5" opacity="0.7"/>`+
    `<text x="${cx}" y="${cy-12}" fill="${CC.ink}" font-family="BodoniEmbed,serif" font-size="58" text-anchor="middle">COSMOS</text>`+
    `<text x="${cx}" y="${cy+40}" fill="${CC.ink}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="4" text-anchor="middle">NATURAL CERTIFIED</text>`;
  const ll=wrap(line,30);const ly=cy+250;
  const txt=ll.map((l,i)=>`<text x="${cx}" y="${ly+i*52}" fill="${CC.ink}" font-family="BodoniEmbed,serif" font-size="46" text-anchor="middle">${esc(l)}</text>`).join("");
  const tag=`<text x="${cx}" y="${ly+ll.length*52+50}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="24" letter-spacing="4" text-anchor="middle">VERIFIED · NOT CLAIMED</text>`;
  return render(bg,seal+txt+tag+chrome(idx,total,CC.ink),"");
}
async function ctaCard(idx,bg,offer,total,lang){
  const g=scrim(0.92);const ol=wrap(offer,20);const top=H-150-ol.length*78;
  const eb=`<text x="72" y="${top-54}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="5" font-weight="600">${lang==="de"?"JETZT ENTDECKEN":lang==="nl"?"ONTDEK NU":"SHOP NOW"}</text>`;
  const head=ol.map((l,i)=>`<text x="70" y="${top+i*78}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="64">${esc(l)}</text>`).join("");
  const url=`<text x="72" y="${H-110}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="34" font-weight="600">eliraliving.com</text>`;
  const save=`<text x="72" y="${H-64}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="27" letter-spacing="2">${lang==="de"?"Speichere das":lang==="nl"?"Bewaar dit":"Save this"} 🔖</text>`;
  return render(bg,g.rect+eb+head+url+save+chrome(idx,total,CC.cream),g.def);
}

const EYE={c1:"REACTIVE SKIN",c2:"TWO STEPS, NOT EIGHT",c3:"GENTLE RETINOL",c4:"CERTIFIED VALUE",c5:"READ THE LABEL",c6:"GENTLE CLEANSING",c7:"SENSITIVE SCALP",c8:"INGREDIENT HONESTY",c9:"SENSITIVE SKIN",c10:"SKINCARE MYTHS"};
const STEPS=["", "THE PROBLEM","WHY","THE FIX"]; // for content cards 2..4

// explicit cover source per concept. product = OUR OWN shot (never stock); seal = typographic cover.
const COVER={
  c1:{type:"ai"}, c2:{type:"pick"}, c3:{type:"pick"},
  c4:{type:"product",file:"cream-hero.jpg"}, c5:{type:"seal"},
  c6:{type:"pick"}, c7:{type:"ai"}, c8:{type:"product",file:"cream-flatlay.jpg"},
  c9:{type:"pick"}, c10:{type:"pick"},
};
function coverPath(id){
  const c=COVER[id]||{type:"pick"};
  if(c.type==="ai") return path.join(STOCK,"_ai",id+".jpg");
  if(c.type==="product") return path.join(CLEAN,c.file);
  if(c.type==="pick"&&PICKS[id]) return path.join(STOCK,id,PICKS[id]);
  return null; // seal / fallback -> solid
}
async function bgBuf(id){const p=coverPath(id);return p&&fs.existsSync(p)?fs.readFileSync(p):await solid(CC.ink);}
// typographic cover (c5): centered hook + seal motif so it never looks bare
async function sealHookCard(eyebrow,headline,total,lang){
  const bg=await solid(CC.ink);const cx=W/2,cy=430;
  const seal=`<circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${CC.gold}" stroke-width="3"/>`+
    `<text x="${cx}" y="${cy-6}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="48" text-anchor="middle">COSMOS</text>`+
    `<text x="${cx}" y="${cy+34}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="20" letter-spacing="3" text-anchor="middle">NATURAL CERTIFIED</text>`;
  const hl=wrap(headline,18);const top=cy+230;
  const eb=`<text x="${cx}" y="${top-50}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="6" text-anchor="middle" font-weight="600">${esc(eyebrow.toUpperCase())}</text>`;
  const head=hl.map((l,i)=>`<text x="${cx}" y="${top+i*78}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="70" text-anchor="middle">${esc(l)}</text>`).join("");
  return render(bg,seal+eb+head+chrome(1,total,CC.cream,SWIPE[lang]),"");
}

async function renderDeck(deck,lang){
  const s=deck.slides[lang]; if(!s){console.warn("· no",lang,"for",deck.id);return;}
  const total=s.length;const cover=await bgBuf(deck.id);
  const isSeal=(COVER[deck.id]||{}).type==="seal";
  const cards=[];
  cards.push(isSeal ? await sealHookCard(EYE[deck.id]||"ELIRA",s[0],total,lang)
                    : await hookCard(cover,EYE[deck.id]||"ELIRA",s[0],total,lang));
  for(let i=1;i<=total-3;i++) cards.push(await textCard(i+1,STEPS[i]||"WHY",s[i],total));
  cards.push(await proofCard(total-1,s[total-2],total));        // 2nd-last = COSMOS proof line
  cards.push(await ctaCard(total,cover,s[total-1],total,lang)); // last = CTA
  const dir=path.join(OUT,lang,deck.id);fs.mkdirSync(dir,{recursive:true});
  for(let i=0;i<cards.length;i++) fs.writeFileSync(path.join(dir,`card-${i+1}.jpg`),cards[i]);
  console.log(`✓ ${lang}/${deck.id} (${cards.length} cards)`);
}
(async()=>{
  const ids=ONLY[0]==="all"?DECKS.map(d=>d.id):ONLY;
  for(const lang of LANGS) for(const id of ids){const d=DECKS.find(x=>x.id===id);if(d)await renderDeck(d,lang);}
  console.log("done.");
})().catch(e=>{console.error(e);process.exit(1);});
