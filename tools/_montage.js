const fs=require("fs"),path=require("path"),sharp=require(path.join(__dirname,"..","node_modules","sharp"));
const ROOT=path.join(__dirname,"..","marketing","social","carousels","_stock");
const REV=path.join(ROOT,"_review");fs.mkdirSync(REV,{recursive:true});
const ids=fs.readdirSync(ROOT).filter(d=>d!=="_review"&&fs.statSync(path.join(ROOT,d)).isDirectory());
(async()=>{
 for(const id of ids){
  const dir=path.join(ROOT,id);
  const files=fs.readdirSync(dir).filter(f=>f.endsWith(".jpg"));
  const tw=360,th=480,gap=10;
  const thumbs=[];
  for(const f of files) thumbs.push(await sharp(path.join(dir,f)).resize(tw,th,{fit:"cover"}).jpeg().toBuffer());
  const W=files.length*tw+(files.length+1)*gap, H=th+2*gap;
  const comp=thumbs.map((b,i)=>({input:b,left:gap+i*(tw+gap),top:gap}));
  await sharp({create:{width:W,height:H,channels:3,background:{r:24,g:24,b:24}}}).composite(comp).jpeg({quality:84}).toFile(path.join(REV,id+".jpg"));
  console.log(id,"->",files.join("  |  "));
 }
})();
