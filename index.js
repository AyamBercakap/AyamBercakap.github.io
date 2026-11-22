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

const pageWidth = 1.28;
const pageHeight = 1.71;
const pageDepth = 0.003;
const pageSegments = 30;
const segmentWidth = pageWidth/pageSegments
const geometry = new THREE.BoxGeometry(pageWidth,pageHeight,pageDepth,pageSegments,2);
geometry.translate(pageWidth/2,0,0);

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


const side = new THREE.MeshStandardMaterial({color:"#ffffff"});
const front = new THREE.MeshStandardMaterial({map:texture});
const back = new THREE.MeshStandardMaterial({map:texture});

const page = new THREE.Mesh(geometry,[side,side,side,side,front,back]);
page.position.x = -pageWidth/2;
scene.add(page);

const timer = new THREE.Timer();
renderer.setAnimationLoop(() =>{
    const et = timer.getElapsed()
    page.rotation.y = -((Math.sin(et)+1)/2)*Math.PI;
    renderer.render(scene,camera);
    timer.update();
});
addEventListener("resize",()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
})