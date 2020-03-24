// 1. Enable shadow mapping in the renderer. 
// 2. Enable shadows and set shadow parameters for the lights that cast shadows. 
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows. 
// 3. Indicate which geometry objects cast and receive shadows.

let renderer = null, 
scene = null, 
camera = null,
root = null,
group = null,
objectList = [],
orbitControls = null;

let objLoader = null, jsonLoader = null;

let duration = 20000; // ms
let currentTime = Date.now();

let directionalLight = null;
let spotLight = null;
let ambientLight = null;
let pointLight = null;
let mapUrl = "../images/checker_large.gif";

let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
// let objModelUrl = {obj:'../models/obj/Penguin_obj/penguin.obj', map:'../models/obj/Penguin_obj/peng_texture.jpg'};
let objModelUrl = {obj:'../models/obj/cerberus/Cerberus.obj', map:'../models/obj/cerberus/Cerberus_A.jpg', normalMap:'../models/obj/cerberus/Cerberus_N.jpg', specularMap: '../models/obj/cerberus/Cerberus_M.jpg'};

// objeto de humano
let objModelHumanUrl = {obj:'../models/obj/human/human.obj', map:'../models/obj/human/cow.jpg'}

let jsonModelUrl = { url:'../models/json/teapot-claraio.json' };

function promisifyLoader ( loader, onProgress ) 
{
    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

const onError = ( ( err ) => { console.error( err ); } );

async function loadJson(url, objectList)
{
    const jsonPromiseLoader = promisifyLoader(new THREE.ObjectLoader());
    
    try {
        const object = await jsonPromiseLoader.load(url);

        object.castShadow = true;
        object.receiveShadow = true;
        object.position.y = -1;
        object.position.x = 1.5;
        object.name = "jsonObject";
        objectList.push(object);
        scene.add(object);

    }
    catch (err) {
        return onError(err);
    }
}

async function loadObj(objModelHumanUrl, objectList)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelHumanUrl.obj);
        
        let texture = objModelHumanUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelHumanUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }
        });

       object.position.z = 0;
       object.position.x = 0;
       object.rotation.y = 0;
       object.name = "objObject";
       objectList.push(object);
       scene.add(object);


    }
    catch (err) {
        return onError(err);
    }
}

function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

function createScene(canvas) 
{
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);


    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    //camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera = new THREE.PerspectiveCamera( 20, canvas.width / canvas.height, 1, 4000 );
    // **** camera.position.set(-2, 6, 12);
    camera.position.set(0, 4, 25);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    //let transform = new THREE.TransformControls(camera, renderer.domElement ); 

    orbitControls.addEventListener( 'change', render );


    let transform = new THREE.TransformControls(camera, renderer.domElement ); 
	transform.addEventListener( 'change', render );

    transform.addEventListener( 'dragging-changed', function ( event ) {

        orbitControls.enabled = ! event.value;

    } );

    orbitControls.enableZoom = false;
    orbitControls.enablePan = false;
    orbitControls.target.y = 2;
    orbitControls.update();

    // Create a group to hold all the objects
    root = new THREE.Object3D;
  
    // Add a directional light to show off the object
    
    directionalLight = new THREE.DirectionalLight( 0x111111, 1);

    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(2, 8, 15);
    spotLight.target.position.set(-2, 5, -2);
    root.add(spotLight);
    
    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow. camera.far = 200; 
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0xffffff, 0.8);
    root.add(ambientLight);
    
    // Create the objects
    loadObj(objModelHumanUrl, objectList);

    transform.attach(objectList[0]);
    transform.setMode( "rotate" );
    
    transform.showX = false;
    transform.showY = true;
    transform.showZ = false;
    transform.size = 0.5;
    transform.setRotationSnap( null );

    function render() {

        renderer.render( scene, camera );

    }
    

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    root.add(transform);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    // color floor
    let color = 0xffffff;

    // let asteroid = new THREE.Object3D();
    // Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y =  0;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );
    
    
    scene.add( root );
}

