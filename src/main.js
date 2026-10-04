import * as THREE from "three";
import { Tracear } from "@tracear/sdk";
import { TracearThree } from "@tracear/sdk/three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


// =========================================================
// UI ELEMENTS
// =========================================================

const enterBtn = document.getElementById("enter-btn");
const startArBtn = document.getElementById("start-ar-btn");

const yash = document.getElementById("yash");
const designation = document.getElementById("designation");
const arrow = document.getElementById("ar-arrow");


// =========================================================
// APP STATE
// =========================================================

let appState = "ENTER";

let arStarted = false;


// =========================================================
// ENTER BUTTON
// =========================================================

enterBtn.addEventListener("click", () => {

  console.log("ENTER clicked");

  appState = "START";

  /*
     Move the two panels vertically apart.
  */

  document.body.classList.add("screen-start");


  /*
     Hide ENTER.
  */

  enterBtn.classList.add("hidden");


  /*
     Wait for the panel animation,
     then show START QR.
  */

  setTimeout(() => {

    startArBtn.classList.remove("hidden");

  }, 650);

});


// =========================================================
// START AR BUTTON
// =========================================================

startArBtn.addEventListener("click", async () => {

  console.log("START QR clicked");

  appState = "AR";


  /*
     Move panels further apart.
  */

  document.body.classList.remove("screen-start");

  document.body.classList.add("screen-ar");


  /*
     Hide START QR.
  */

  startArBtn.classList.add("hidden");


  /*
     Show AR graphics.
  */

  setTimeout(() => {

    yash.classList.remove("hidden");

    designation.classList.remove("hidden");

    arrow.classList.remove("hidden");

  }, 500);


  /*
     START CAMERA / AR
  */

  if (!arStarted) {

    try {

      await tracker.start();

      arStarted = true;

      console.log("AR CAMERA STARTED");

    } catch (error) {

      console.error(
        "AR START ERROR:",
        error
      );

    }

  }

});


// =========================================================
// TRACEAR
// =========================================================

const tracker = await Tracear.create({

  container: document.querySelector("#ar"),

  targets: [
    "/invitation.tracear"
  ]

});


// =========================================================
// THREE.JS SCENE
// =========================================================

const scene = new THREE.Scene();


// =========================================================
// LIGHTING
// =========================================================

const light = new THREE.HemisphereLight(

  0xffffff,

  0x444444,

  4

);

scene.add(light);


// =========================================================
// TRACEAR THREE
// =========================================================

const t3 = new TracearThree(tracker);

const anchor = t3.anchor(0);

scene.add(anchor);


// =========================================================
// MODEL SETTINGS
// =========================================================

/*
   Change these values whenever you want
   to reposition / resize / rotate the GLB.
*/

const MODEL_POSITION = {

  x: 0,

  y: 0,

  z: 0

};


const MODEL_SCALE = {

  x: 0.3,

  y: 0.3,

  z: 0.3

};


const MODEL_ROTATION = {

  x: 90,

  y: 0,

  z: 0

};


// =========================================================
// ANIMATION VARIABLES
// =========================================================

let mixer = null;

let animationActions = [];

let modelLoaded = false;

let targetVisible = false;


// =========================================================
// GLB LOADER
// =========================================================

const loader = new GLTFLoader();


loader.load(

  "/model.glb",

  (gltf) => {

    const model = gltf.scene;


    // =====================================================
    // POSITION
    // =====================================================

    model.position.set(

      MODEL_POSITION.x,

      MODEL_POSITION.y,

      MODEL_POSITION.z

    );


    // =====================================================
    // INDEPENDENT XYZ SCALE
    // =====================================================

    model.scale.set(

      MODEL_SCALE.x,

      MODEL_SCALE.y,

      MODEL_SCALE.z

    );


    // =====================================================
    // ROTATION
    // =====================================================

    model.rotation.set(

      THREE.MathUtils.degToRad(
        MODEL_ROTATION.x
      ),

      THREE.MathUtils.degToRad(
        MODEL_ROTATION.y
      ),

      THREE.MathUtils.degToRad(
        MODEL_ROTATION.z
      )

    );


    // =====================================================
    // ADD MODEL TO AR ANCHOR
    // =====================================================

    anchor.add(model);


    // =====================================================
    // MODEL ANIMATIONS
    // =====================================================

    if (gltf.animations.length > 0) {

      console.log(
        "Animations found:",
        gltf.animations.map(
          animation => animation.name
        )
      );


      mixer =
        new THREE.AnimationMixer(model);


      animationActions =
        gltf.animations.map((clip) => {

          const action =
            mixer.clipAction(clip);


          /*
             Loop animation forever.
          */

          action.setLoop(

            THREE.LoopRepeat,

            Infinity

          );


          action.clampWhenFinished = false;


          return action;

        });

    } else {

      console.log(
        "No animations found in model.glb"
      );

    }


    modelLoaded = true;


    /*
       If target was already detected
       before model finished loading.
    */

    if (targetVisible) {

      animationActions.forEach(
        (action) => {

          action.reset();

          action.play();

        }
      );

    }

  },


  undefined,


  (error) => {

    console.error(
      "GLB LOAD ERROR:",
      error
    );

  }

);


// =========================================================
// THREE.JS RENDERER
// =========================================================

const renderer =
  new THREE.WebGLRenderer({

    alpha: true,

    antialias: true

  });


renderer.setClearColor(

  0x000000,

  0

);


renderer.setSize(

  innerWidth,

  innerHeight

);


renderer.setPixelRatio(

  Math.min(
    devicePixelRatio,
    2
  )

);


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


renderer.domElement.style.position =
  "fixed";

renderer.domElement.style.inset =
  "0";

renderer.domElement.style.pointerEvents =
  "none";


/*
   Put Three.js canvas inside AR container.
*/

document
  .querySelector("#ar")
  .appendChild(renderer.domElement);


// =========================================================
// TARGET FOUND
// =========================================================

tracker.on(

  "targetFound",

  () => {

    console.log("TARGET FOUND");

    targetVisible = true;


    if (modelLoaded) {

      animationActions.forEach(
        (action) => {

          /*
             Restart intro animation
             every time target is detected.
          */

          action.reset();

          action.play();

        }
      );

    }

  }

);


// =========================================================
// TARGET LOST
// =========================================================

tracker.on(

  "targetLost",

  () => {

    console.log("TARGET LOST");

    targetVisible = false;


    /*
       Stop animation when card
       leaves camera.
    */

    animationActions.forEach(
      (action) => {

        action.stop();

      }
    );

  }

);


// =========================================================
// ANIMATION LOOP
// =========================================================

const clock =
  new THREE.Clock();


function animate() {

  requestAnimationFrame(
    animate
  );


  const delta =
    clock.getDelta();


  /*
     Update TraceAR.
  */

  t3.update();


  /*
     Update GLB animation.
  */

  if (mixer) {

    mixer.update(delta);

  }


  /*
     Render.
  */

  renderer.render(

    scene,

    t3.camera

  );

}


animate();


// =========================================================
// RESIZE
// =========================================================

window.addEventListener(

  "resize",

  () => {

    renderer.setSize(

      innerWidth,

      innerHeight

    );

  }

);