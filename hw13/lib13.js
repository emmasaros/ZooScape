
//////////////////////////////////////////////////////////////////////////////////////////
//
// THIS IS THE SUPPORT LIBRARY.  YOU PROBABLY DON'T WANT TO CHANGE ANYTHING HERE JUST YET.
//
//////////////////////////////////////////////////////////////////////////////////////////

/*
let fragmentShaderHeader = [''                      // WHATEVER CODE WE WANT TO PREDEFINE FOR FRAGMENT SHADERS
,'   precision highp float;'
].join('\n');
*/

let fragmentShaderHeader = [''                      // WHATEVER CODE WE WANT TO PREDEFINE FOR FRAGMENT SHADERS
,'   precision highp float;'
,'precision highp float;'
,'float noise(vec3 v) {'
,'   vec4 r[2];'
,'   const mat4 E = mat4(0.,0.,0.,0., 0.,.5,.5,0., .5,0.,.5,0., .5,.5,0.,0.);'
,'   for (int j = 0 ; j < 2 ; j++)'
,'   for (int i = 0 ; i < 4 ; i++) {'
,'      vec3 p = .60*v + E[i].xyz, C = floor(p), P = p - C-.5, A = abs(P), D;'
,'      C += mod(C.x+C.y+C.z+float(j),2.) * step(max(A.yzx,A.zxy),A)*sign(P);'
,'      D  = 314.1*sin(59.2*float(i+4*j) + 65.3*C + 58.9*C.yzx + 79.3*C.zxy);'
,'      P=p-C-.5;r[j][i] = dot(P,fract(D)-.5)*pow(max(0.,1.-2.*dot(P,P)),4.);'
,'   }'
,'   return 6.50 * (r[0].x+r[0].y+r[0].z+r[0].w+r[1].x+r[1].y+r[1].z+r[1].w);'
,'}'
].join('\n');

let nfsh = fragmentShaderHeader.split('\n').length; // NUMBER OF LINES OF CODE IN fragmentShaderHeader

let isFirefox = navigator.userAgent.indexOf('Firefox') > 0;         // IS THIS THE FIREFOX BROWSER?
let errorMsg = '';


addEventListenersToCanvas = function(canvas) {
   let r = canvas.getBoundingClientRect();
   let toX = x => 2 * (x-18 - r.left) / canvas.width - 1,
       toY = y => (canvas.height - 2 * (y - r.top)) / canvas.width;

   if (! canvas.onDrag      ) canvas.onDrag       = (x, y) => { };
   if (! canvas.onMove      ) canvas.onMove       = (x, y) => { };
   if (! canvas.onPress     ) canvas.onPress      = (x, y) => { };
   if (! canvas.onRelease   ) canvas.onRelease    = (x, y) => { };
   if (! canvas.onKeyPress  ) canvas.onKeyPress   = key => { };
   if (! canvas.onKeyRelease) canvas.onKeyRelease = key => { };

   canvas.addEventListener('mousemove', function(e) {
      this._response = this._isDown ? this.onDrag : this.onMove;
      this._response(toX(e.clientX), toY(e.clientY));
   });

   canvas.addEventListener('mousedown', function(e) {
      this.onPress(toX(e.clientX), toY(e.clientY));
      this._isDown = true ;
   });

   canvas.addEventListener('mouseup'  , function(e) {
      this.onRelease(toX(e.clientX), toY(e.clientY));
      this._isDown = false;
   });

   window.addEventListener('keydown', function(e) {
      canvas.onKeyPress(e.keyCode);
   }, true);

   window.addEventListener('keyup', function(e) {
      canvas.onKeyRelease(e.keyCode);
   }, true);
}


function gl_start(canvas, vertexShader, fragmentShader) {

   addEventListenersToCanvas(canvas);


   setTimeout(function() {
      try { 
         canvas.gl = canvas.getContext('experimental-webgl');              // Make sure WebGl is supported.
      } catch (e) { throw 'Sorry, your browser does not support WebGL.'; }

      canvas.setShaders = function(vertexShader, fragmentShader) {         // Add the vertex and fragment shaders:

         let gl = this.gl, program = gl.createProgram();                        // Create the WebGL program.

         function addshader(type, src) {                                        // Create and attach a WebGL shader.
	    function spacer(color, width, height) {
	       return '<table bgcolor=' + color +
	                    ' width='   + width +
			    ' height='  + height + '><tr><td>&nbsp;</td></tr></table>';
	    }
	    errorMessage.innerHTML = '<br>';
	    errorMarker.innerHTML = spacer('black', 1, 1) + '<font size=5 color=black>\u25B6</font>';
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
               let msg = gl.getShaderInfoLog(shader);
               console.log('Cannot compile shader:\n\n' + msg);

	       let a = msg.substring(6, msg.length);
	       if (a.substring(0, 3) == ' 0:') {
	          a = a.substring(3, a.length);
	          let line = parseInt(a) - nfsh;
		  let nPixels = isFirefox ? 17 * line - 10 : 18 * line - 1;
	          errorMarker.innerHTML = spacer('black', 1, nPixels) + '<font size=5>\u25B6</font>';
               }

	       let j = a.indexOf(':');
	       a = a.substring(j+2, a.length);
	       if ((j = a.indexOf('\n')) > 0)
	          a = a.substring(0, j);
	       errorMessage.innerHTML = a;
            }
            gl.attachShader(program, shader);
         };

         addshader(gl.VERTEX_SHADER  , vertexShader  );                         // Add the vertex and fragment shaders.
         addshader(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentShader);

         gl.linkProgram(program);                                               // Link the program, report any errors.
         if (! gl.getProgramParameter(program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(program);
	 gl.program = program;

         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());                     // Create a square as a triangle strip

	 let bpe = Float32Array.BYTES_PER_ELEMENT;

	 gl.enable(gl.DEPTH_TEST);
	 gl.depthFunc(gl.LEQUAL);
	 gl.clearDepth(-1);

         let aPos = gl.getAttribLocation(program, 'aPos');                      // Set aPos attribute for each vertex.
         gl.enableVertexAttribArray(aPos);
         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, VERTEX_SIZE * bpe, 0 * bpe);

         let aNor = gl.getAttribLocation(program, 'aNor');                      // Set aNor attribute for each vertex.
         gl.enableVertexAttribArray(aNor);
         gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, VERTEX_SIZE * bpe, 3 * bpe);

         let aUV = gl.getAttribLocation(program, 'aUV');                        // Set aUV attribute for each vertex.
         gl.enableVertexAttribArray(aUV);
         gl.vertexAttribPointer(aUV , 2, gl.FLOAT, false, VERTEX_SIZE * bpe, 6 * bpe);
      }

      canvas.setShaders(vertexShader, fragmentShader);                     // Initialize everything,

      setInterval(function() {                                             // Start the animation loop.
         gl = canvas.gl;
         if (gl.startTime === undefined)                                            // First time through,
            gl.startTime = Date.now();                                              //    record the start time.

         drawIndex = 0;
         animate(gl);
	 hitTesting();

	 for (let i = 0 ; i < drawIndex ; i++)
	    drawMeshInArray(i);

      }, 30);

   }, 100); // Wait 100 milliseconds after page has loaded before starting WebGL.
}

// THE animate() CALLBACK FUNCTION CAN BE REDEFINED IN index.html.

function animate() { }
function hitTesting() { }

let setColor = rgb => {

   // USED red,grn,blu SLIDER VALUES TO CONTROL OBJECT COLOR.

   setUniform('Matrix4fv', 'uPhong', false, [
      .1*rgb[0],.1*rgb[1],.1*rgb[2],0,
      .2*rgb[0],.2*rgb[1],.2*rgb[2],0,
      .8*rgb[0],.8*rgb[1],.8*rgb[2],20,  0,0,0,0,
      .1,.05,.025,0,  .2,.1,.05,0,  .8,.4,.2,2,  0,0,0,0,
   ]);
}

let drawIndex = 0, drawArray = [], hitIndex = -1;

let drawMesh = (mesh, rgb, textureSrc) => {
   drawArray[drawIndex++] = {
      mesh:       mesh,
      matrix:     m[mTop],
      rgb:        rgb,
      textureSrc: textureSrc
   };
} 

let textures = {};

let drawMeshInArray = i => {
   let mesh       = drawArray[i].mesh,
       M          = drawArray[i].matrix,
       rgb        = drawArray[i].rgb,
       textureSrc = drawArray[i].textureSrc;

   if (i == hitIndex)
      rgb = [1,0,0];

   if (rgb)
      setColor(rgb);

   // WHAT IS THE INDEX OF THIS TEXTURE AMONG ALL TEXTURES?

   setUniform('1i', 'uSampler', 0);

   // ARE WE RENDERING A TEXTURE FOR THIS OBJECT?

   setUniform('1f', 'uTexture', textureSrc ? 1 : 0);

   // LOAD THE TEXTURE IF IT HAS NOT BEEN LOADED.
   // IF IT HAS BEEN LOADED, TELL THE GPU ABOUT IT.

   if (textureSrc) {

      // NEED TO LOAD THE TEXTURE FROM THE SERVER.

      if (! textures[textureSrc]) {
         let image = new Image();

	 image.onload = function() {
	    textures[this.textureSrc] = gl.createTexture();
	    gl.bindTexture     (gl.TEXTURE_2D, textures[this.textureSrc]);
	    gl.texImage2D      (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
	    gl.texParameteri   (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri   (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	    gl.generateMipmap  (gl.TEXTURE_2D);
	 }
	 image.textureSrc = textureSrc;
	 image.src = textureSrc;
      }

      // TEXTURE HAS LOADED. OK TO RENDER.

      else {
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, textures[textureSrc]);
      }
   }


   setUniform('Matrix4fv', 'uMatrix', false, M);
   setUniform('Matrix4fv', 'uIMatrix', false, matrixInverse(M));
   gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.length / VERTEX_SIZE);
}

let gl;
function setUniform(type, name, a, b, c, d, e, f) {
   let loc = gl.getUniformLocation(gl.program, name);
   (gl['uniform' + type])(loc, a, b, c, d, e, f);
}

