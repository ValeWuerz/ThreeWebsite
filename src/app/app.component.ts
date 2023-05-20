import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Raycaster, Vector2 } from 'three';
import { Clock } from 'three';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private selectedObject: THREE.Object3D | null = null;;
  private priorcolor: any;
  private clock!: THREE.Clock;
  private mixer!: THREE.AnimationMixer | null;
  private animationStarted: boolean = false;
  private glob_object:any;
  ngOnInit(): void {
    // Create your Three.js scene and objects here
    this.scene = new THREE.Scene();
    this.mixer = null;
    this.clock= new Clock();
    this.scene.background = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
        // Load HDR texture
        const loader = new RGBELoader();
        loader.load('assets/textures/pine_attic_4k.hdr', (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
          this.scene.background = texture
                // Create a directional light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        //this.scene.add(light);

              // Create an ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      //this.scene.add(ambientLight);
        });
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xB2B2DD,
          envMap: this.scene.environment, // Set the environment texture as the envMap
          roughness: 0,
          metalness: 1
        });
        const cube = new THREE.Mesh(geometry, material);
        //this.scene.add(cube);
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('assets/models/cubes.glb', (gltf) => {
          const object = gltf.scene;
          this.glob_object=gltf;
          this.scene.add(object);
          //const animations = gltf.animations;
          //if (animations && animations.length > 0) {
          //  // Play or manipulate the animations as desired
          //  this.mixer = new THREE.AnimationMixer(object);
//
          //  const animationAction = this.mixer.clipAction(animations[0]);
          //  animationAction.play();
    //
          //
          //}
        });
  }

  ngAfterViewInit(): void {
    // Create and configure the renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    // Create the camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Create and configure the OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Start rendering the scene
    this.render();
  }
  private onMouseMove(event: MouseEvent): void {
    //change color of all object that are not selected to 0x6FA8DC
    if ( this.selectedObject ) {

      this.selectedObject.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          // Change the color of the intersected object
          child.material.color.set(this.priorcolor); // Set the color to red
          //child.scale.set(1.0, 1.0, 1.0); // Set the color to red
          //child.scale.multiplyScalar(0.8);
        }
      });
      this.selectedObject = null;
      this.priorcolor=null
    }
    event.preventDefault();
  
    // Calculate normalized device coordinates (NDC) based on mouse position
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
  this.raycaster.setFromCamera(this.mouse, this.camera);

  }
  
  private render(): void {
      // Update the raycaster with the current mouse position

  // Perform the raycasting and get the intersected objects
  const intersects = this.raycaster.intersectObjects(this.scene.children, true);


  // Handle the intersected objects
  if (intersects.length > 0) {
    const res = intersects.filter( function ( res ) {

      return res && res.object;

    } )[ 0 ];
    if ( res && res.object ) {

      this.selectedObject = res.object;
      this.selectedObject.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          if(!this.priorcolor){
          this.priorcolor=child.material.color.clone();
}
          // Change the color of the intersected object
          child.material.color.set(0xff0000);
          //child.scale.set(1.2, 1.2, 1.2); // Set the color to red
          //child.scale.multiplyScalar(1.2);


          
          if (!this.animationStarted) {
            //this.mixer.timeScale = 1; // Set the animation time scale (e.g., speed)
            const animations = this.glob_object.animations;

            if (animations && animations.length > 0) {
            //  // Play or manipulate the animations as desired
             this.mixer = new THREE.AnimationMixer(this.glob_object.scene);
  
             const animationAction = this.mixer.clipAction(animations[0]);
            animationAction.setLoop(THREE.LoopOnce, 1);

                // Add event listener for the "finished" event
        this.mixer.addEventListener('finished', () => {
      // Perform actions at the end of the animation
      console.log('Animation finished');
          this.animationStarted=false;
      // Trigger your desired function or code here
    });
            animationAction.play();
            this.animationStarted = true;
          }
          }
        }
      });

    }

    // For example, change the color of the intersected object
  }
  // Render the scene

  // Request the next frame
  const delta = this.clock.getDelta();
  if (this.mixer) {
    this.mixer.update(delta);
  }
  this.renderer.render(this.scene, this.camera);
  this.controls.update();
  requestAnimationFrame(() => this.render());

    
  }
}
