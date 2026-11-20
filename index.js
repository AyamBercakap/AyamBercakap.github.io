//main setup shii
import * as THREE from 'three';

const scene = new THREE.Scene;

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight,0.1,100);
camera.position.set(0,0,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

document.body.appendChild(renderer.domElement);
const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1.4,0.1),
    new THREE.MeshStandardMaterial({color:"#ffffff"})
);

scene.add(box);
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(2,3,4);
scene.add(sun);

const timer = new THREE.Timer();
renderer.setAnimationLoop(() =>{
    const dt = timer.getDelta();
    box.rotation.y += dt;
    renderer.render(scene,camera);
    timer.update();
});
addEventListener("resize",()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
})