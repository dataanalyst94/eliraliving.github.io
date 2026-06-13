/* Edge flood-fill background removal: removes the background-connected uniform
   region (so an interior white cap is preserved), outputs a transparent PNG.
   Usage: node tools/cutout.js <in.jpg> <out.png> [tolerance] */
const sharp = require("sharp");
const fs = require("fs");

(async () => {
  const [inp, outp, tolArg] = process.argv.slice(2);
  const tol = +(tolArg || 30);
  const { data, info } = await sharp(fs.readFileSync(inp)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  // background reference = average of the four corners
  const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
  let br = 0, bg = 0, bb = 0;
  for (const [x, y] of corners) { const i = (y * W + x) * C; br += data[i]; bg += data[i + 1]; bb += data[i + 2]; }
  br /= 4; bg /= 4; bb /= 4;
  const near = (i) => Math.abs(data[i] - br) < tol && Math.abs(data[i + 1] - bg) < tol && Math.abs(data[i + 2] - bb) < tol;
  const visited = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => { if (x >= 0 && x < W && y >= 0 && y < H && !visited[y * W + x]) stack.push(y * W + x); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue; visited[p] = 1;
    const i = p * C;
    if (!near(i)) continue;       // boundary: stop, keep this pixel opaque
    data[i + 3] = 0;              // background → transparent
    const x = p % W, y = (p / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(outp);
  console.log("✓ cutout", outp, W + "x" + H, "bg=" + [br | 0, bg | 0, bb | 0]);
})().catch(e => { console.error(e); process.exit(1); });
