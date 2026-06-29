const fs=require("fs"),path=require("path"),sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const id=process.argv[2]||"c9",lang=process.argv[3]||"en";
const dir=path.join(__dirname,"..","marketing","social","carousels",lang,id);
const files=fs.readdirSync(dir).filter(f=>f.endsWith(".jpg")).sort();
(async()=>{
 const tw=300,th=375,gap=8;const thumbs=[];
 for(const f of files) thumbs.push(await sharp(path.join(dir,f)).resize(tw,th,{fit:"cover"}).jpeg().toBuffer());
 const W=files.length*tw+(files.length+1)*gap,H=th+2*gap;
 const comp=thumbs.map((b,i)=>({input:b,left:gap+i*(tw+gap),top:gap}));
 const out=path.join(__dirname,"..","marketing","social","carousels","_stock","_review",`deck-${id}-${lang}.jpg`);
 await sharp({create:{width:W,height:H,channels:3,background:{r:18,g:18,b:18}}}).composite(comp).jpeg({quality:88}).toFile(out);
 console.log("->",out);
})();
