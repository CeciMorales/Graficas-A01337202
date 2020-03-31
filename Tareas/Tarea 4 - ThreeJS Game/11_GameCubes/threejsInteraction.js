let container;
let camera, scene, raycaster, renderer;

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let radius = 100, theta = 0;

let floorUrl = "../images/checker_large.gif";

let objLoader = null, jsonLoader = null;

let objectList = [];
let points = 0;
let clickedObjects = 0;
let lostOjbects = 0;
let objectsScene = 10;
let continueGame = true;


let duration = 5000; // ms
let currentTime = Date.now();

let objModelUrl = {obj:'../models/obj/Penguin_obj/penguin.obj', map:'../models/obj/Penguin_obj/peng_texture.jpg'};


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


async function loadObj(objModelUrl, objectList, index)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);
        
        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        //let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        //let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
               //  child.material.normalMap = normalMap;
                //child.material.specularMap = specularMap;
            }
        });

        object.name = 'Object' + index; 
        var chosenValue = Math.random() < 0.5 ? -250 : 250;
        object.position.set(chosenValue, Math.random() * 300 - 100, -200);
        object.scale.set(1, 1, 1);

        objectList.push(object);
        scene.add(object);

    }
    catch (err) {
        return onError(err);
    }
}

function update(){
    for (object of objectList) {
        if (object.position.x > 0){
            object.position.x -= 1;
        }else if(object.position.x < 0){
            object.position.x += 1;
        }else if(object.position.x == 0){
            scene.remove(object);
        }    

        if (object.position.y > 0){
            object.position.y -= 0.05;
        }else if(object.position.y < 0){
            object.position.y += 0.05
        }
    }
    
}

function createScene(canvas) 
{
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );
    
    let light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    // floor
    let map = new THREE.TextureLoader().load(floorUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    let floor = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({color:0xffffff, map:map, side:THREE.DoubleSide}));
    floor.rotation.x = -Math.PI / 2;
    scene.add( floor );

    
    for (let i=0; i<10; i++){
       loadObj(objModelUrl, objectList, i);
    }
    
    
    // lanza rasho
    raycaster = new THREE.Raycaster();
        
    // agregar eventos y estar al pendiente de esas acciones
    // hay dos, cuando el mouse se mueve en la pantalla
    // y cuando el mouse da click 
    // para cada una de las acciones se activa un rayo
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mousedown', onDocumentMouseDown);
    
    window.addEventListener( 'resize', onWindowResize);
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) 
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    // intersects es un arreglo de objetos con lo que chocó
    let intersects = raycaster.intersectObjects( scene.children );
    
    if ( intersects.length > 0 ) 
    {
        // de mi arreglo de objetos, quien es el que quedó hasta el final
        let closer = intersects.length - 1;

        if ( INTERSECTED != intersects[ closer ].object ) 
        {
            if ( INTERSECTED)
            {
                // emissive es como el color/luz
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            }

            INTERSECTED = intersects[ closer ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
    } 
    else 
    {
        if ( INTERSECTED ) 
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;
    }
}

function onDocumentMouseDown(event){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children, true );
    console.log("intersects", intersects);

    if ( intersects.length > 0 ) 
    {
        CLICKED = intersects[ intersects.length - 1 ].object;
        
        scene.remove(CLICKED.parent);
        clickedObjects += 1;

        if (continueGame) {
            loadObj(objModelUrl, objectList, objectList.length);
        }else{
            console.log("No mas objetos");
        }  
    } 
    else 
    {
        if ( CLICKED ) 
            CLICKED.material.emissive.setHex( CLICKED.currentHex );
            
        CLICKED = null;
    }
}

function countPoints() {
    lostObjects = objectList.length - clickedObjects;
    points = clickedObjects - lostObjects ;
    console.log("Score: ", points)

    document.getElementById("contador").innerHTML = points;

}

function stopGame(){
    continueGame = false;

    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
}

function reloadPage(){
    window.location.reload(1);
}

function setTimer() {

    if (continueGame) {
        var timeleft = 25;
        var downloadTimer = setInterval(function(){
        if(timeleft <= 0){
            clearInterval(downloadTimer);
        }
        document.getElementById("tiempo").innerHTML = timeleft - 1;
        console.log(timeleft - 1);
        timeleft -= 1;
        }, 1000);
    }
}

function run() 
{
    requestAnimationFrame( run );
    //animate();
    update();
    render();

    // no se mandan rayos en run porque eso significa que
    // manda rayos a cada rato y alenta todo
}

function render() 
{
    renderer.render( scene, camera );
}