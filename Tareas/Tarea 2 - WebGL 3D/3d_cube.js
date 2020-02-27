let mat4 = glMatrix.mat4;

let projectionMatrix;

let shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

let duration = 10000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
let vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
let fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    let gl = null;
    let msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 100);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -5]);
}

// Create the vertex, color and index data for a multi-colored cube
function createCube(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       // Front face
       -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
       -1.0,  1.0,  1.0,

       // Back face
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

       // Top face
       -1.0,  1.0, -1.0,
       -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

       // Bottom face
       -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,

       // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

       // Left face
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

   

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face
        [0.0, 1.0, 0.0, 1.0], // Back face
        [0.0, 0.0, 1.0, 1.0], // Top face
        [1.0, 1.0, 0.0, 1.0], // Bottom face
        [1.0, 0.0, 1.0, 1.0], // Right face
        [0.0, 1.0, 1.0, 1.0]  // Left face
    ];

    // Each vertex must have the color information, that is why the same color is 
    // concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color =>{
        for (let j=0; j < 4; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);


    let cubeIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

   
    let cube = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 24, nIndices:36,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(cube.modelViewMatrix, cube.modelViewMatrix, translation);

    cube.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return cube;
}

function createPyramid(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       // Front face
        0.0, 1.0,  0.0,
       -1.0, 0.0,  1.0,
        1.0,  0.0,  1.0,

       // Right Face
        0.0, 1.0, 0.0, 
        1.0, 0.0, 1.0,
        0.0, 0.0, -1.0,

       // Left Face
        0.0, 1.0, 0.0, 
        -1.0, 0.0, 1.0,
        0.0, 0.0, -1.0,

       // Bottom face
       0.0, 0.0, -1.0,
       -1.0, 0.0, 1.0,
       1.0, 0.0, 1.0
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

   

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face
        [0.0, 1.0, 0.0, 1.0], // Back face
        [0.0, 0.0, 1.0, 1.0], // Top face
        [1.0, 1.0, 0.0, 1.0], // Bottom face     
    ];

    // Each vertex must have the color information, that is why the same color is 
    // concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color =>{
        for (let j=0; j < 4; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);


    let pyramidIndices = [
        0, 1, 2,        // Front face
        3, 4, 5,        // Right face
        6, 7, 8,        // Left face
        9, 10, 11       // Base

    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);

   
    let pyramid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:12, colorSize:4, nColors: 12, nIndices:12,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);

    pyramid.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return pyramid;
}

function createPyramidPentagon(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       // Base
        0.0, 0.0, 0.0,
        2.0, 0.0, 0.0,
        2.62, 1.9, 0.0,
        1.0, 3.08, 0.0,
        -0.62, 1.9, 0.0,

       // Cara frente
       0.0, 0.0, 0.0,
       2.0, 0.0, 0.0,
       1.0, 1.5, 2.0,

       // Cara frente derecha
       2.0, 0.0, 0.0,
       2.62, 1.9, 0.0,
       1.0, 1.5, 2.0,

       // Cara frente izquierda
       0.0, 0.0, 0.0,
       -0.62, 1.9, 0.0,
       1.0, 1.5, 2.0,

       // Cara atras derecha
       2.62, 1.9, 0.0,
       1.0, 3.08, 0.0,
       1.0, 1.5, 2.0,

       // Cara atras izquierda
       1.0, 3.08, 0.0,
       -0.62, 1.9, 0.0,
       1.0, 1.5, 2.0,

       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

   
    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Base
        [0.0, 1.0, 0.0, 1.0], // Frente 
        [0.0, 0.0, 1.0, 1.0], // Frente derecha
        [1.0, 1.0, 0.0, 1.0], // Frente izquierda
        [0.0, 1.0, 1.0, 1.0], // Atras derecha
        [0.5, 1.0, 0.5, 1.0], // Atras izquierda

        
    ];

    // Each vertex must have the color information, that is why the same color is 
    // concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }

    for (let i=0; i<5; i++){
        vertexColors.push(...faceColors[0]);

    }
    
    faceColors.forEach(color =>{
        for (let j=1; j < 4; j++)
            vertexColors.push(...color);
            
    });    

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);


    let phIndices = [
        0, 4, 3,    0, 1, 3,    1, 2, 3, // Base
        5, 6, 7,                        // Frente 
        8, 9, 10,                       // Frente derecha
        11, 12, 13,                     // Frente izquierda
        14, 15, 16,                     // Atras derecha
        17, 18, 19                      // Atras izquierda
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(phIndices), gl.STATIC_DRAW);

   
    let ph = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:20, colorSize:4, nColors: 20, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    
    mat4.translate(ph.modelViewMatrix, ph.modelViewMatrix, translation);  
        
    
    
    ph.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

        
    };

    return ph;
}

function createOctaedro(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       // Front face up
        0.0, 1.0,  0.0,
       -1.0, 0.0,  1.0,
        1.0,  0.0,  1.0,

       // Right Face up
        0.0, 1.0, 0.0, 
        1.0, 0.0, 1.0,
        1.0, 0.0, -1.0,

       // Left Face up
        0.0, 1.0, 0.0, 
        -1.0, 0.0, 1.0,
        -1.0, 0.0, -1.0,

       // Back face up
        0.0, 1.0, 0.0, 
        -1.0, 0.0, -1.0,
        1.0, 0.0, -1.0,

        // Front face down
        0.0, -1.0,  0.0,
       -1.0, 0.0,  1.0,
        1.0,  0.0,  1.0,

       // Right Face down
        0.0, -1.0, 0.0, 
        1.0, 0.0, 1.0,
        1.0, 0.0, -1.0,

       // Left Face down
        0.0, -1.0, 0.0, 
        -1.0, 0.0, 1.0,
        -1.0, 0.0, -1.0,

       // Back face down
        0.0, -1.0, 0.0, 
        -1.0, 0.0, -1.0,
        1.0, 0.0, -1.0,
       
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);


    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face up
        [0.0, 1.0, 0.0, 1.0], // Back face up
        [0.0, 0.0, 1.0, 1.0], // Top face up
        [1.0, 1.0, 0.0, 1.0], // Down face up

        [0.5, 0.0, 1.0, 1.0], // Front face down 
        [0.0, 0.5, 1.0, 1.0], // Back face down
        [0.0, 1.0, 0.5, 1.0], // Top face down
        [0.5, 1.0, 0.0, 1.0], // Bottom face down
        
    ];

    // Each vertex must have the color information, that is why the same color is 
    // concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color =>{
        for (let j=0; j < 3; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);


    let octIndices = [
        0, 1, 2,        // Front face up
        3, 4, 5,        // Right face up
        6, 7, 8,        // Left face up
        9, 10, 11,      // Back face up

        12, 13, 14,     // Front face down
        15, 16, 17,     // Right face down
        18, 19, 20,     // Left face down
        21, 22, 23       // Back face down
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octIndices), gl.STATIC_DRAW);

   
    let octaedro = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 36, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(octaedro.modelViewMatrix, octaedro.modelViewMatrix, translation);

    let flag = "bottom";

    octaedro.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;

        
        if (translation[1] == 12){
            flag = "top";
        }else if (translation[1] == -12){
            flag = "bottom";
        }

        if (flag == "bottom"){
            translation[1] = translation[1] + 0.5;
            this.modelViewMatrix[13] = this.modelViewMatrix[13] + 0.25;
        }else if (flag == "top"){
            translation[1] = translation[1] - 0.5;
            this.modelViewMatrix[13] = this.modelViewMatrix[13] - 0.25;
        }      

    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return octaedro;
}

function createDodecaedro(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    /**
     * Dodecaedro
     * 
     * A = (0.0, 0.0, 0.0)
     * B = (2.0, 0.0, 0.0)
     * C = (2.62, 1.9, 0.0)
     * D = (1.0, 3.08, 0.0)
     * E = (-0.62, 1.9, 0.0)
     * F = (2.62, -0.85, 1.7)
     * G = (3.62, 2.23, 1.7)
     * H = (1.0, 4.13, 1.7)
     * I = (-1.62, 2.23, 1.7)
     * J = (-0.62, -0.85, 1.7)
     * K = (1.0, -1.38, 2.75)
     * L = (3.62, 0.53, 2.75)
     * M = (2.62, 3.6, 2.75)
     * N = (-0.62, 3.6, 2.75)
     * O = (-1.62, 0.53, 2.75)
     * P = (1.0, -0.32, 4.45)
     * Q = (2.62, 0.85, 4.45)
     * R = (2.0, 2.75, 4.45)
     * S = (0, 2.75, 4.45)
     * T = (-0.62, 0.85, 4.45)
     * 
     * 
     */

    let verts = [
       // Cara abajo
       // ABCDE
        0.0, 0.0, 0.0,
        2.0, 0.0, 0.0,
        2.62, 1.9, 0.0,
        1.0, 3.08, 0.0,
        -0.62, 1.9, 0.0,

       // Cara frente nivel 1
       // ABFKJ
        0.0, 0.0, 0.0,
        2.0, 0.0, 0.0,
        2.62, -0.85, 1.7,
        1.0, -1.38, 2.75,
        -0.62, -0.85, 1.7,

       // Cara frente derecha nivel 1
       // BCGLF
       2.0, 0.0, 0.0,
       2.62, 1.9, 0.0,
       3.62, 2.23, 1.7,
       3.62, 0.53, 2.75,
       2.62, -0.85, 1.7,
       
       // Cara frente izquierda nivel 1
       // EAJOI
       -0.62, 1.9, 0.0,
        0.0, 0.0, 0.0,
        -0.62, -0.85, 1.7, 
        -1.62, 0.53, 2.75,
        -1.62, 2.23, 1.7,

        // Cara atras derecha nivel 1
        // DCGMH
        1.0, 3.08, 0.0,
        2.62, 1.9, 0.0,
        3.62, 2.23, 1.7,
        2.62, 3.6, 2.75,
        1.0, 4.13, 1.7,
        
       // Cara atras izquierda nivel 1
       // EDHNI
       -0.62, 1.9, 0.0,
       1.0, 3.08, 0.0,
       1.0, 4.13, 1.7,
       -0.62, 3.6, 2.75,
       -1.62, 2.23, 1.7,
       
       // Cara frente derecha nivel 2
       // KFLQP
       1.0, -1.38, 2.75,
       2.62, -0.85, 1.7,
       3.62, 0.53, 2.75,
       2.62, 0.85, 4.45,
       1.0, -0.32, 4.45,
       
       // Cara frente izquierda nivel 2
       // OJKPT 
       -1.62, 0.53, 2.75,
       -0.62, -0.85, 1.7,
       1.0, -1.38, 2.75,
       1.0, -0.32, 4.45,
       -0.62, 0.85, 4.45,
       
       // Cara atras derecha nivel 2
       // MGLQR
       2.62, 3.6, 2.75,
       3.62, 2.23, 1.7,
       3.62, 0.53, 2.75,
       2.62, 0.85, 4.45,
       2.0, 2.75, 4.45,

       // Cara atras centro nivel 2
       // NHMRS
       -0.62, 3.6, 2.75,
       1.0, 4.13, 1.7,
       2.62, 3.6, 2.75, 
       2.0, 2.75, 4.45,
       0, 2.75, 4.45,
       
       // Cara atras izquierda nivel 2
       // OINST
       -1.62, 0.53, 2.75,
       -1.62, 2.23, 1.7,
       -0.62, 3.6, 2.75,
       0, 2.75, 4.45,
       -0.62, 0.85, 4.45,
       
        // Tapa arriba
        // TPQRS
        -0.62, 0.85, 4.45,
        1.0, -0.32, 4.45,
        2.62, 0.85, 4.45,
        2.0, 2.75, 4.45,
        0, 2.75, 4.45,
    
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Tapa abajo

        [0.0, 1.0, 0.0, 1.0], // Frente primer nivel 1        
        [0.0, 0.0, 1.0, 1.0], // Frente derecha primer nivel 1
        [1.0, 1.0, 0.0, 1.0], // Frente izquierda primer nivel 1
        [0.5, 0.0, 0.0, 1.0], // Atras derecha primer nivel 1
        [0.0, 0.5, 0.0, 1.0], // Atras izquierda primer nivel 1

        [0.6, 0.2, 0.2, 1.0], // Frente derecha nivel 2       
        [0.0, 0.5, 1.0, 1.0], // Frente izquierda nivel 2
        [0.0, 0.75, 0.5, 1.0], // Atras derecha nivel 2 
        [0.75, 0.5, 0.0, 1.0], // Atras medio nivel 2 
        [0.0, 1.0, 1.0, 1.0], // Atras izquierda nivel 2
    
        [0.0, 1.0, 0.5, 1.0], // Tapa arriba
        
    ];

    // Each vertex must have the color information, that is why the same color is 
    // concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color =>{
        for (let j=0; j < 5; j++)
            vertexColors.push(...color);
    });


    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

    // Corregir cosa para que cada cara de la figura tenga sus propios indices
    let dodeIndices = [
        // Tapa abajo
        // ADE, ABD, BCD
        0, 1, 3,        0, 4, 3,        1, 2, 3,

        // Frente medio nivel 1
        // AJK, ABK, BFK
        5, 6, 8,        5, 8, 9,        6, 7, 8,
        
        // Frente derecha nivel 1
        // BFL, BCL, CGL
        10, 11, 13,     10, 13, 14,    11, 12, 13,

        // Frente izquierda nivel 1
        // EIO, AEO, AJO
        15, 16, 18,     15, 18, 19,     16, 17, 18,

        // Atras derecha nivel 1
        // CGM, CDM, DHM
        20, 21, 23,     20, 24, 23,     21, 22, 23,

        // Atras izquierda nivel 1
        // DHN, DEN, EIN
        25, 26, 28,     26, 27, 28,     25, 28, 29,       
        
        // Frente derecha nivel 2
        // FKP, FPQ, FLQ
        30, 31, 34,     31, 32, 33,     31, 33, 34,     

        // Frente izquierda nivel 2
        // JOY, JPY, JKP
        35, 36, 39,     36, 37, 39,     37, 38, 39,
        
        // Atras derecha nivel 2
        // GLQ, GQR, GMR
        40, 41, 44,     41, 42, 43,     41, 43, 44,     

        // Atras medio nivel 2
        // HMR, HRS, HNS
        45, 46, 49,     46, 47, 48,     46, 49, 48,     
        
        // Atras izquierda nivel 2
        // INS, IST, IOT
        50, 51, 54,     51, 52, 53,     51, 53, 54, 
        
        // Tapa arriba
        // PST, PRS, PQR
        55, 56, 59,     56, 57, 58,     56, 58, 59,     
      
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dodeIndices), gl.STATIC_DRAW);

   
    let dodecaedro = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:60, colorSize:4, nColors: 60, nIndices: 108,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(dodecaedro.modelViewMatrix, dodecaedro.modelViewMatrix, translation);

    dodecaedro.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around

        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis[0]);
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis[1]);
        
    };
    
    return dodecaedro;
}

function createShader(gl, str, type)
{
    let shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    let fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    let vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // ANTES DE DIBUJAR SE TIENE QUE LIMPLIAR EL COLOR Y LA PROFUNDIDAD
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i< objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an 
    // animation and requests that the browser call a specified function to update an animation 
    // before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });

    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
