/* Copy the 10 new carousels (en/de/nl) into the media-worker and append manifest entries. */
const fs=require("fs"),path=require("path");
const ROOT=path.join(__dirname,"..");
const SRC=path.join(ROOT,"marketing","social","carousels");
const PUB=path.join(ROOT,"media-worker","public","carousel");
const MAN=path.join(ROOT,"media-worker","public","carousels.json");
const HOST="https://elira-media.elira-living.workers.dev";
const DECKS=JSON.parse(fs.readFileSync(path.join(ROOT,"marketing","social","carousel-decks.json"),"utf8")).decks;
const NAME={c1:"Sensitive Moisturizer",c2:"Two-Step Routine",c3:"Retinol Alternative",c4:"Certified Value",c5:"What COSMOS Means",c6:"Gentle Cleanser",c7:"Sensitive Scalp Shampoo",c8:"Read the Label",c9:"Sensitive Skin",c10:"Skincare Myths"};
const LANGS=["en","de","nl"];
const IDS=DECKS.map(d=>d.id);

let man=JSON.parse(fs.readFileSync(MAN,"utf8"));
// drop any prior entries for our ids (idempotent re-runs)
man=man.filter(e=>!IDS.includes(e.product));

let copied=0, added=0;
for(const lang of LANGS){
  for(const deck of DECKS){
    const sdir=path.join(SRC,lang,deck.id);
    if(!fs.existsSync(sdir)){console.warn("missing",lang,deck.id);continue;}
    const ddir=path.join(PUB,lang,deck.id);fs.mkdirSync(ddir,{recursive:true});
    const cards=fs.readdirSync(sdir).filter(f=>/^card-\d+\.jpg$/.test(f)).sort((a,b)=>parseInt(a.match(/\d+/))-parseInt(b.match(/\d+/)));
    for(const f of cards){fs.copyFileSync(path.join(sdir,f),path.join(ddir,f));copied++;}
    const urls=cards.map(f=>`${HOST}/carousel/${lang}/${deck.id}/${f}`);
    man.push({product:deck.id,name:NAME[deck.id]||deck.id,lang,caption:deck.slides[lang][0],cards:urls});
    added++;
  }
}
fs.writeFileSync(MAN,JSON.stringify(man));
console.log(`copied ${copied} card files · manifest now ${man.length} carousels (+${added} new)`);
