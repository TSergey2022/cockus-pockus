const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;

function main() {
  // func1();
  // func2();
  func3();
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function repeatArray(arr, n) {
  const newArr = [];
  for (let i = 0; i < n; i++) newArr.push(arr);
  return newArr.flat();
}

function deg2rad(deg) {
  return deg / 180 * Math.PI
}

function makeCube(offset) {
  const vertices = [
    -1,-1,-1,  1,-1,-1,  1, 1,-1, -1, 1,-1, // Back
    -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1, // Front
    -1,-1,-1, -1, 1,-1, -1, 1, 1, -1,-1, 1, // Left
     1,-1,-1,  1, 1,-1,  1, 1, 1,  1,-1, 1, // Right
    -1,-1,-1, -1,-1, 1,  1,-1, 1,  1,-1,-1, // Bottom
    -1, 1,-1, -1, 1, 1,  1, 1, 1,  1, 1,-1, // Top
  ].map((v, i) =>  v + offset[i % 3])
  return vertices;
}

function makeIndicesForCube(startIdx) {
  return [
    0, 1, 2,  0, 2, 3, // Back
    4, 5, 6,  4, 6, 7, // Front
    8, 9,10,  8,10,11, // Left
   12,13,14, 12,14,15, // Right
   16,17,18, 16,18,19, // Bottom
   20,21,22, 20,22,23  // Top
 ].map((v) => startIdx + v);
}

function func1() {
  const vsSource = `
    attribute vec3 aVertexPosition;
    uniform mat4 uFinalMatrix;
    uniform vec4 uColor;
    // varying vec3 vPosition;
    varying vec4 vColor;
    void main(void) {
      gl_Position = uFinalMatrix * vec4(aVertexPosition, 1.0);
      // vPosition = aVertexPosition;
      vColor = uColor;
    }
  `;

  const fsSource = `
    #ifdef GL_ES
    precision highp float;
    #endif
    // varying vec3 vPosition;
    varying vec4 vColor;
    // float getMixValue(vec3 v) {
    //   return mix(mix(v.x, v.y, 0.5), v.z, 0.5);
    // }
    // vec3 saw(vec3 x, float p) {
    //   return 2.0 * abs(x / p - floor(x / p + 0.5));
    // }
    void main(void) {
      // float color = getMixValue(saw(vPosition, 2.0));
      // gl_FragColor = vec4(color, color, color, 1.0); // Костный блок майнкрафт
      gl_FragColor = vColor;
    }
  `;

  const canvas = document.getElementById('glcanvas1');
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });

  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const vertices = [
    makeCube([0, 0, 0])
  ].flat();

  const indices = [
    makeIndicesForCube(0*24)
  ].flat();

  const squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const index_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(vertexPositionAttribute);

  const finalMatrixUniform = gl.getUniformLocation(shaderProgram, "uFinalMatrix");
  const colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

  gl.useProgram(shaderProgram, 0, 4);

  const prMatrix = mat4.create();
  mat4.perspective(prMatrix, deg2rad(110), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100);
  
  let globalRotationY = 0;
  let standRotationY = 0;
  let leftCubeRotationY = 0;
  let centerDoubleCubeRotationY = 0;
  let rightCubeRotationY = 0;
  function keyPressed(event) {
    const dict = {
      "a": () => globalRotationY += 1,
      "d": () => globalRotationY -= 1,
      "q": () => standRotationY += 1,
      "e": () => standRotationY -= 1,
      "1": () => leftCubeRotationY += 1,
      "2": () => leftCubeRotationY -= 1,
      "3": () => centerDoubleCubeRotationY += 1,
      "4": () => centerDoubleCubeRotationY -= 1,
      "5": () => rightCubeRotationY += 1,
      "6": () => rightCubeRotationY -= 1,
      "r": () => {
        globalRotationY = 0;
        standRotationY = 0;
        leftCubeRotationY = 0;
        centerDoubleCubeRotationY = 0;
        rightCubeRotationY = 0;
      },
    }
    const key = event.key;
    for (const propKey in dict) {
      if (key === propKey) {
        dict[propKey].call();
      }
    }
  }
  
  // Add event listener to listen for key press
  document.addEventListener("keypress", keyPressed);

  function getFinalMatrix(initTranslation, selfRotationY) {
    const finalMatrix = mat4.create();
    // Projection
    mat4.mul(finalMatrix, finalMatrix, prMatrix);
    // Global transform
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(globalRotationY));
    mat4.translate(finalMatrix, finalMatrix, [5, -5, -10]);
    // Stand rotation
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(standRotationY));
    // Self rotation
    mat4.translate(finalMatrix, finalMatrix, initTranslation);
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(selfRotationY));
    return finalMatrix;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    
    const finalMatrix1 = getFinalMatrix([-2, 0, 0], leftCubeRotationY);
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrix1);
    gl.uniform4f(colorUniform, ...[1, 0, 0, 1]);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    const finalMatrix2_1 = getFinalMatrix([0, 0, 0], centerDoubleCubeRotationY);
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrix2_1);
    gl.uniform4f(colorUniform, ...[0, 1, 0, 1]);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    const finalMatrix2_2 = getFinalMatrix([0, 2, 0], centerDoubleCubeRotationY);
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrix2_2);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    const finalMatrix3 = getFinalMatrix([2, 0, 0], rightCubeRotationY);
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrix3);
    gl.uniform4f(colorUniform, ...[0, 0, 1, 1]);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(drawScene);
  }

  drawScene();
}

function combineFloat32Arrays(arrays) {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const combinedArray = new Float32Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    combinedArray.set(arr, offset);
    offset += arr.length;
  }
  return combinedArray;
}

function func2() {
  const vsSource = `#version 300 es
    in vec3 aPosition;
    in float aStandIndex;
    uniform mat4[4] uFinalMatrix;
    uniform vec4[4] uColor;
    // varying vec3 vPosition;
    out vec4 vColor;
    void main(void) {
      gl_Position = uFinalMatrix[int(aStandIndex)] * vec4(aPosition, 1.0);
      // vPosition = aPosition;
      vColor = uColor[int(aStandIndex)];
    }
  `;

  const fsSource = `#version 300 es
    precision mediump float;
    in vec4 vColor;
    out vec4 fragColor;
    void main(void) {
      fragColor = vColor;
    }
  `;

  const canvas = document.getElementById('glcanvas1');
  /**
   * @type {WebGLRenderingContext}
   */
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });

  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const positionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
  const standIndexAttribute = gl.getAttribLocation(shaderProgram, "aStandIndex");
  const finalMatrixUniform = gl.getUniformLocation(shaderProgram, "uFinalMatrix");
  const colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

  gl.useProgram(shaderProgram, 0, 4);

  const positionData = [
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
  ].flat();

  const standIndexData = [
    repeatArray([0], 24),
    repeatArray([1], 24),
    repeatArray([2], 24),
    repeatArray([3], 24),
  ].flat();

  const colorData = [
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
  ].flat();

  const indexData = [
    makeIndicesForCube(0*24),
    makeIndicesForCube(1*24),
    makeIndicesForCube(2*24),
    makeIndicesForCube(3*24),
  ].flat();

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(positionAttribute);

  const standIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, standIndexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(standIndexData), gl.STATIC_DRAW);
  gl.vertexAttribPointer(standIndexAttribute, 1, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(standIndexAttribute);

  gl.uniform4fv(colorUniform, new Float32Array(colorData));

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  let globalRotationY = 0;
  let standRotationY = 0;
  let leftCubeRotationY = 0;
  let centerDoubleCubeRotationY = 0;
  let rightCubeRotationY = 0;
  function keyPressed(event) {
    const dict = {
      "a": () => globalRotationY += 1,
      "d": () => globalRotationY -= 1,
      "q": () => standRotationY += 1,
      "e": () => standRotationY -= 1,
      "1": () => leftCubeRotationY += 1,
      "2": () => leftCubeRotationY -= 1,
      "3": () => centerDoubleCubeRotationY += 1,
      "4": () => centerDoubleCubeRotationY -= 1,
      "5": () => rightCubeRotationY += 1,
      "6": () => rightCubeRotationY -= 1,
      "r": () => {
        globalRotationY = 0;
        standRotationY = 0;
        leftCubeRotationY = 0;
        centerDoubleCubeRotationY = 0;
        rightCubeRotationY = 0;
      },
    }
    const key = event.key;
    for (const propKey in dict) {
      if (key === propKey) {
        dict[propKey].call();
      }
    }
  }

  // Add event listener to listen for key press
  document.addEventListener("keypress", keyPressed);

  function makeFinalMatrix(initTranslation, selfRotationY) {
    const prMatrix = mat4.perspective(mat4.create(), deg2rad(110), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100);

    const finalMatrix = mat4.create();

    // Projection
    mat4.mul(finalMatrix, finalMatrix, prMatrix);

    // Global transform
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(globalRotationY));
    mat4.translate(finalMatrix, finalMatrix, [5, -5, -10]);

    // Stand rotation
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(standRotationY));

    // Self rotation
    mat4.translate(finalMatrix, finalMatrix, initTranslation);
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(selfRotationY));
    
    return finalMatrix;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    
    const finalMatrixData = combineFloat32Arrays([
      makeFinalMatrix([-2, 0, 0], leftCubeRotationY),
      makeFinalMatrix([ 0, 0, 0], centerDoubleCubeRotationY),
      makeFinalMatrix([ 0, 2, 0], centerDoubleCubeRotationY),
      makeFinalMatrix([ 2, 0, 0], rightCubeRotationY),
    ]);
    
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrixData);
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(drawScene);
  }

  drawScene();
}

function func3() {
  const vsSource = `
    attribute vec3 aPosition;
    attribute float aStandIndex;
    uniform mat4 uFinalMatrix[4];
    uniform vec4 uColor[4];
    varying vec4 vColor;
    void main(void) {
      int sI = int(aStandIndex);
      gl_Position = uFinalMatrix[sI] * vec4(aPosition, 1.0);
      vColor = uColor[sI];
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  const canvas = document.getElementById('glcanvas1');
  /**
   * @type {WebGLRenderingContext}
   */
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });

  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const positionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
  const standIndexAttribute = gl.getAttribLocation(shaderProgram, "aStandIndex");
  const finalMatrixUniform = gl.getUniformLocation(shaderProgram, "uFinalMatrix");
  const colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

  gl.useProgram(shaderProgram, 0, 4);

  const positionData = [
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
    makeCube([ 0, 0, 0]),
  ].flat();

  const standIndexData = [
    repeatArray([0], 24),
    repeatArray([1], 24),
    repeatArray([2], 24),
    repeatArray([3], 24),
  ].flat();

  const colorData = [
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
  ].flat();

  const indexData = [
    makeIndicesForCube(0*24),
    makeIndicesForCube(1*24),
    makeIndicesForCube(2*24),
    makeIndicesForCube(3*24),
  ].flat();

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(positionAttribute);

  const standIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, standIndexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(standIndexData), gl.STATIC_DRAW);
  gl.vertexAttribPointer(standIndexAttribute, 1, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(standIndexAttribute);

  gl.uniform4fv(colorUniform, new Float32Array(colorData));

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  let globalRotationY = 0;
  let standRotationY = 0;
  let leftCubeRotationY = 0;
  let centerDoubleCubeRotationY = 0;
  let rightCubeRotationY = 0;
  function keyPressed(event) {
    const dict = {
      "a": () => globalRotationY += 1,
      "d": () => globalRotationY -= 1,
      "q": () => standRotationY += 1,
      "e": () => standRotationY -= 1,
      "1": () => leftCubeRotationY += 1,
      "2": () => leftCubeRotationY -= 1,
      "3": () => centerDoubleCubeRotationY += 1,
      "4": () => centerDoubleCubeRotationY -= 1,
      "5": () => rightCubeRotationY += 1,
      "6": () => rightCubeRotationY -= 1,
      "r": () => {
        globalRotationY = 0;
        standRotationY = 0;
        leftCubeRotationY = 0;
        centerDoubleCubeRotationY = 0;
        rightCubeRotationY = 0;
      },
    }
    const key = event.key;
    for (const propKey in dict) {
      if (key === propKey) {
        dict[propKey].call();
      }
    }
  }

  // Add event listener to listen for key press
  document.addEventListener("keypress", keyPressed);

  function makeFinalMatrix(initTranslation, selfRotationY) {
    const prMatrix = mat4.perspective(mat4.create(), deg2rad(110), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100);

    const finalMatrix = mat4.create();

    // Projection
    mat4.mul(finalMatrix, finalMatrix, prMatrix);

    // Global transform
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(globalRotationY));
    mat4.translate(finalMatrix, finalMatrix, [5, -5, -10]);

    // Stand rotation
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(standRotationY));

    // Self rotation
    mat4.translate(finalMatrix, finalMatrix, initTranslation);
    mat4.rotateY(finalMatrix, finalMatrix, deg2rad(selfRotationY));
    
    return finalMatrix;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    
    const finalMatrixData = combineFloat32Arrays([
      makeFinalMatrix([-2, 0, 0], leftCubeRotationY),
      makeFinalMatrix([ 0, 0, 0], centerDoubleCubeRotationY),
      makeFinalMatrix([ 0, 2, 0], centerDoubleCubeRotationY),
      makeFinalMatrix([ 2, 0, 0], rightCubeRotationY),
    ]);
    
    gl.uniformMatrix4fv(finalMatrixUniform, false, finalMatrixData);
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(drawScene);
  }

  drawScene();
}

main();