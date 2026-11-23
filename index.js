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
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 717;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
const lines = ['In', 'Maintenace','🚧'];
const lineHeight = 90;
const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

ctx.font = 'bold 80px Georgia, serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#1a1d22';

lines.forEach((line, i) => {
  ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
});
const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;

const pageWidth = 1.28;
const pageHeight = 1.71;
const pageDepth = 0.003;
const pageSegments = 30;
const segmentWidth = pageWidth/pageSegments
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

const bones = [];
for (let i=0; i<=pageSegments;i++){
    const bone = new THREE.Bone();
    bone.position.x=i===0?0:segmentWidth;
    if (i>0)bones[i-1].add(bone);
    bones.push(bone);
}
const skeleton = new THREE.Skeleton(bones);

const side = new THREE.MeshStandardMaterial({color:"#ffffff"});
const front = new THREE.MeshStandardMaterial({map:texture});
const back = new THREE.MeshStandardMaterial({map:texture});

const page = new THREE.SkinnedMesh(geometry,[side,side,side,side,front,back]);
page.add(bones[0]);
page.bind(skeleton);
page.frustumCulled = false;
page.position.x = -pageWidth/2;
scene.add(page);

const INSIDE=0.18;
const OUTSIDE=0.015;
const TURNING=0.04;
const FOLD = (1*Math.PI)/180;
const FLATTEN =0.12;

let opened=false;
let turnedAt=-10;
addEventListener("click",()=>{
    opened=!opened;
    turnedAt = timer.getElapsed();
});


const timer = new THREE.Timer();
renderer.setAnimationLoop(()=>{
    timer.update();
    const dt = Math.min(timer.getDelta(),0.05);
    const now = timer.getElapsed();
    const turnT = Math.sin((Math.min(0.4,now-turnedAt)/0.4)*Math.PI);
    const tr = opened ? -Math.PI/2:Math.PI/2;


for (let i=0;i < bones.length;i++){
    const inside = i < 8 ? Math.sin(i * 0.2 + 0.25):0;
    const outside = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
    const turning = Math.sin((i*Math.PI)/bones.length)*turnT;
    
    let rotY = INSIDE * inside * tr - OUTSIDE * outside * tr + TURNING * turning *tr;
    if (i===0) rotY -= Math.PI/2 + Math.sign(tr) * FLATTEN
    
    const fold = i > 8 ? Math.sin((i*Math.PI)/bones.length -0.5) * turnT :0;
    const rotX = Math.sign(tr) * FOLD * fold;
    
    bones[i].rotation.y = THREE.MathUtils.damp(bones[i].rotation.y, rotY, 4, dt);
    bones[i].rotation.x = THREE.MathUtils.damp(bones[i].rotation.x, rotX, 6, dt);
}
renderer.render(scene,camera);
})
