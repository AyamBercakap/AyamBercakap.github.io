import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
const renderer = new THREE.WebGLRenderer({ antialias: true });
const w = window.innerWidth; const h = window.innerHeight;
renderer.setSize(w,h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w/h;
const near = 0.1;
const far = 30;
const camera = new THREE.PerspectiveCamera(fov,aspect,near,far);
camera.position.z=4;
const scene = new THREE.Scene();

const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=0.03;


const verityGroup = new THREE.Group();
verityGroup.rotation.z= -23.4 * Math.PI /180;
scene.add(verityGroup);

const geo = new THREE.IcosahedronGeometry(1,12);
const loader=new THREE.TextureLoader();
const closed = loader.load("assets/verity-Close.png");
closed.colorSpace=THREE.SRGBColorSpace;
const opened = loader.load("assets/verity-Open.png");
opened.colorSpace=THREE.SRGBColorSpace;
const mat = new THREE.MeshBasicMaterial({
    map: closed
})
const verityMesh = new THREE.Mesh(geo,mat)
verityGroup.add(verityMesh);

const audioElement = document.getElementById("audio");




let audioCtx;
let analyser;
let dataArray;
let isAudioInitialized = false;

window.addEventListener("click", () => {
  if (!isAudioInitialized) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioElement);
    
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    isAudioInitialized = true;
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  
  audioElement.play();
});

function animate(t=0){
    requestAnimationFrame(animate);
    let scale = 1;
    if (isAudioInitialized) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
        }
        const volAvg = Math.round(sum / dataArray.length);
        if(volAvg>104){
            mat.map = opened;
        }else{
            mat.map = closed;
        }
        scale = 1 + (volAvg / 255) * 0.5;

    }

    verityMesh.scale.setScalar(scale);
    renderer.render(scene,camera);    
    controls.update();
}
animate();