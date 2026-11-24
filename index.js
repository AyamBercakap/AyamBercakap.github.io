//main setup shii
import * as THREE from 'three';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight,0.1,100);
camera.position.set(0,0,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff,0.6));
const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(2,3,4);
scene.add(sun);


addEventListener("resize",()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
})

const pageWidth = 1.28;
const pageHeight = 1.71;
const pageDepth = 0.003;
const pageSegments = 30;
const segmentWidth = pageWidth/pageSegments

const INSIDE=0.18;
const OUTSIDE=0.015;
const TURNING=0.04;
const FOLD = (1*Math.PI)/180;
const FLATTEN =0.12;
const FAN = (0.8*Math.PI)/180;

const geometry = new THREE.BoxGeometry(pageWidth,pageHeight,pageDepth,pageSegments,2);
geometry.translate(pageWidth/2,0,0);

const position = geometry.attributes.position;
const skinIndices = [];
const skinWeights =[];
for (let i=0;i<position.count;i++){
    const t = position.getX(i)/segmentWidth;
    const index = THREE.MathUtils.clamp(Math.floor(t),0,pageSegments-1);
    const weight = THREE.MathUtils.clamp(t-index,0,1);
    skinIndices.push(index,index+1,0,0);
    skinWeights.push(1-weight,weight,0,0);
}

geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(skinIndices,4));
geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(skinWeights,4));

const TEX_W = 1024;
const TEX_H = 1368;
const maxAniso = renderer.capabilities.getMaxAnisotropy();

function paintText(ctx, lines, bg, fg) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const k = W / 512;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const lineHeight = 90 * k;
  const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2;
  ctx.font = `bold ${80 * k}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fg;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineHeight));
}

function paintImg(ctx, img, bg) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const iw = img.displayWidth || img.videoWidth || img.naturalWidth || img.width;
  const ih = img.displayHeight || img.videoHeight || img.naturalHeight || img.height;
  const s = Math.max(W / iw, H / ih);
  ctx.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
}

const MIME = { gif: "image/gif", apng: "image/png", png: "image/png", webp: "image/webp" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

//for gifs and stuff
async function playAnimated(url, texture, onFrame) {
  const type = MIME[url.split("?")[0].split(".").pop().toLowerCase()];
  if (!type || !(await ImageDecoder.isTypeSupported(type))) throw new Error("unsupported type");

  const data = await (await fetch(url)).arrayBuffer();
  const decoder = new ImageDecoder({ data, type });
  await decoder.tracks.ready;
  const count = decoder.tracks.selectedTrack.frameCount;

  texture.userData.playing = true;
  let i = 0;
  let next = decoder.decode({ frameIndex: 0 });
  while (texture.userData.playing) {
    if (texture.userData.live === false || document.hidden) {
      await sleep(200);
      continue;
    }
    const { image } = await next;
    const raw = image.duration / 1000;
    const ms = raw <= 10 ? 100 : raw;
    onFrame(image);
    image.close();
    i = (i + 1) % count;
    next = decoder.decode({ frameIndex: i });
    await sleep(ms);
  }
  decoder.close();
}
//detects if text or image
function face(content, bg = "#ffffff", fg = "#1a1d22") {
  const spec = Array.isArray(content) ? { text: content }
             : typeof content === "string" ? { image: content }
             : content;
  const animated = !!spec.image && (spec.animated ?? /\.(gif|apng|webp)(\?|$)/i.test(spec.image));  
  const q = animated ? 0.5 : 1;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W * q;
  canvas.height = TEX_H * q;
  const ctx = canvas.getContext("2d", { alpha: false });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (animated) {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
  } else {
    texture.anisotropy = maxAniso;
  }
  
  paintText(ctx ,spec.text??[], bg, fg)

    if (spec.image) {
    const drawStatic = () => {
      const img = new Image();
      img.onload = () => { paintImg(ctx, img, bg); texture.needsUpdate = true; };
      img.onerror = () => console.warn("Page image failed to load:", spec.image);
      img.src = spec.image;
    };

    if (animated && "ImageDecoder" in window) {
      playAnimated(spec.image, texture, (frame) => {
        paintImg(ctx, frame, bg);
        texture.needsUpdate = true;
      }).catch((err) => {
        console.warn("Animation failed, showing a still:", spec.image, err);
        drawStatic();
      });
    } else {
      drawStatic();
    }
  }
  return texture
}

//page declaration
const sheets = [
  { front: face(["In", "Maintenance", "🚧"], "#2b3a55", "#ffffff"), back: face(["Performance","In"]) },
  { front: face(["Testing","phase"]),
    back:  face("/pages/1.gif") },
  { front: face("[/pages/2.gif"], "#ffffff", "#2b3a55"), back: face(["Page", "4"], "#ffffff", "#2b3a55") },
  { front: face(["Page", "5"], "#ffffff", "#2b3a55"), back: face(["The", "End"], "#2b3a55", "#ffffff") },
];

//book

const book = new THREE.Group();
scene.add(book);

const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

function fitDistance(single) {
  const s = book.scale.x;
  const needW = (single ? pageWidth * 1.25 : pageWidth * 2 * 1.1) * s; 
  const needH = pageHeight * 1.5 * s;
  return Math.max(needH / (2 * tanHalf), needW / (2 * tanHalf * camera.aspect));
}
camera.position.z = fitDistance(true);
const side = new THREE.MeshStandardMaterial({color:"#ffffff"});

function createPage(number, frontTex, backTex){
    const bones = [];
    for (let i=0; i<=pageSegments;i++){
        const bone = new THREE.Bone();
        bone.position.x=i===0?0:segmentWidth;
        if (i>0)bones[i-1].add(bone);
        bones.push(bone);
    }
    const mesh = new THREE.SkinnedMesh(geometry,[side,side,side,side,
        new THREE.MeshStandardMaterial({map:frontTex}),
        new THREE.MeshStandardMaterial({map:backTex})        
    ]);
    mesh.add(bones[0]);
    mesh.bind(new THREE.Skeleton(bones));
    mesh.frustumCulled=false;
    book.add(mesh);
    return { number, mesh, bones, opened: false, turnedAt: -10, textures: [frontTex, backTex] };
}

const pages = sheets.map((s,i)=> createPage(i,s.front,s.back));

let currentPage = 0;
const go = (p) => {currentPage = THREE.MathUtils.clamp(p,0,pages.length);};

addEventListener("click", (e) => step(e.clientX > innerWidth / 2 ? 1 : -1));
addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") step(1);
  if (e.key === "ArrowLeft") step(-1);
});
//controller for swipe and scroll

let lastFlipTime = 0;
const FLIP_COOLDOWN = 350;
function flipPage(direction) {
  const now = performance.now();
  if (now - lastFlipTime < FLIP_COOLDOWN) return;
  lastFlipTime = now;

  step(direction);
}

//scroll control
window.addEventListener("wheel", (e) => {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  const dx = e.deltaX * unit;
  const dy = e.deltaY * unit;
  const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
  if (Math.abs(d) < 15) return;
  flipPage(d > 0 ? 1 : -1);
}, { passive: true });

// mobile swipe
let touchStartX = 0;
window.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  const deltax = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(deltax) < 30) return;

  flipPage(deltax > 0 ? 1 : -1);
}, { passive: true });

let focusLeft = false;                      
const portrait = () => camera.aspect < 1;

function step(direction) {
  if (!portrait()) { go(currentPage + direction); return; }
  let f = focusLeft ? 2 * currentPage - 1 : 2 * currentPage;
  f = THREE.MathUtils.clamp(f + direction, 0, 2 * pages.length - 1);
  focusLeft = f % 2 === 1;
  go(Math.ceil(f / 2));
}

const timer = new THREE.Timer();
renderer.setAnimationLoop(()=>{
    timer.update();
    const dt = Math.min(timer.getDelta(),0.05);
    const now = timer.getElapsed();
    const closed = currentPage === 0 || currentPage === pages.length;
    const single = closed || portrait();     
    camera.position.z = THREE.MathUtils.damp(camera.position.z, fitDistance(single), 3, dt); 

    for (const pg of pages){
      const opened = currentPage> pg.number;
      if (pg.opened !== opened){
          pg.opened = opened;
          pg.turnedAt = now;
      }
      const moving = now - pg.turnedAt < 1.2;
      pg.textures[0].userData.live = moving || pg.number === currentPage;
      pg.textures[1].userData.live = moving || pg.number === currentPage - 1;
      const turnT = Math.sin((Math.min(0.4,now-pg.turnedAt)/0.4)*Math.PI);
      let tr = opened ? -Math.PI/2:Math.PI/2;
      if (!closed) tr += pg.number * FAN;

      for (let i=0;i < pg.bones.length;i++){
          const inside = i < 8 ? Math.sin(i * 0.2 + 0.25):0;
          const outside = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
          const turning = Math.sin((i*Math.PI)/pg.bones.length)*turnT;
          
          let rotY = INSIDE * inside * tr - OUTSIDE * outside * tr + TURNING * turning *tr;
          if (i===0) rotY -= Math.PI/2 + Math.sign(tr) * FLATTEN
          
          const fold = i > 8 ? Math.sin((i*Math.PI)/pg.bones.length -0.5) * turnT :0;
          let rotX = Math.sign(tr) * FOLD * fold;
          
          if (closed){
              rotY = i === 0 ? tr - Math.PI / 2 : 0;
              rotX = 0;
          }

          pg.bones[i].rotation.y = THREE.MathUtils.damp(pg.bones[i].rotation.y, rotY, 2.5, dt);
          pg.bones[i].rotation.x = THREE.MathUtils.damp(pg.bones[i].rotation.x, rotX, 4, dt);
      }
      const targetZ = -pageDepth * (opened ? currentPage - 1 - pg.number : pg.number - currentPage);
      pg.mesh.position.z = THREE.MathUtils.damp(pg.mesh.position.z, targetZ, 4, dt);
    }
    const onLeft = portrait() ? focusLeft : currentPage === pages.length;   
    const shift = (pageWidth * book.scale.x)/2;
    const targetX = single ? (onLeft ? shift : -shift) : 0;
    book.position.x = THREE.MathUtils.damp(book.position.x, targetX, 4, dt);


renderer.render(scene,camera);
})
