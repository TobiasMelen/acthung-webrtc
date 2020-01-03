import { inlineThrow } from "../utility";

function createProgram(gl: WebGLRenderingContext) {
  var vertCode = `attribute vec3 coordinates;
    void main(void) {
      gl_Position = vec4(coordinates, 1.0);
    }`;
  const vertShader =
    gl.createShader(gl.VERTEX_SHADER) ??
    inlineThrow("Null result creating vert shader");
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  var fragCode = `void main(void) { 
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1); 
    }`;
  var fragShader =
    gl.createShader(gl.FRAGMENT_SHADER) ??
    inlineThrow("Null result creating vert shader");
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  var shaderProgram =
    gl.createProgram() ?? inlineThrow("Null result creating program");
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
  // Use the combined shader program object
  //   gl.useProgram(shaderProgram);
}

onmessage = (canvas: OffscreenCanvas | {}) => {
  if (!(canvas instanceof OffscreenCanvas)) {
    throw new Error(`Sent ${canvas} instead of canvaselement`);
  }
  const context = canvas.getContext("webgl");
};
