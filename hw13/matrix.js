
////////////////// MATRIX LIBRARY


// VECTOR FUNCTIONS

let ik = (a, b, C, D) => {
   let cc = dot(C,C), x = (1 + (a*a - b*b)/cc) / 2, y = dot(C,D)/cc;
   for (let i = 0 ; i < 3 ; i++) D[i] -= y * C[i];
   y = Math.sqrt(Math.max(0,a*a - cc*x*x) / dot(D,D));
   for (let i = 0 ; i < 3 ; i++) D[i] = x * C[i] + y * D[i];
   return D;
}

let dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
let norm = a => Math.sqrt(dot(a,a));
let normalize = a => { let s = norm(a); return [ a[0]/s,a[1]/s,a[2]/s ]; }
let mix = (a, b, t) => [ a[0] + t * (b[0] - a[0]) ,
                         a[1] + t * (b[1] - a[1]) ,
                         a[2] + t * (b[2] - a[2]) ];
let sCurve = t => (3 - 2 * t) * t * t;
let subtract = (a, b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
let cross = (a, b) => [a[1]*b[2] - a[2]*b[1],
                       a[2]*b[0] - a[0]*b[2],
                       a[0]*b[1] - a[1]*b[0]];


// MULTIPLY TWO MATRICES.

let matrixMultiply = (a,b) => {
   let c = [];

   // LOOP THROUGH THE 4x4 ROWS AND COLUMNS.

   for (let col = 0 ; col < 4 ; col++)
      for (let row = 0 ; row < 4 ; row++) {

         // TAKE A DOT PRODUCT.

         let dp = 0;
	 for (let i = 0 ; i < 4 ; i++)
	    dp += a[4*i + row] * b[4*col + i];

	 c[4*col + row] = dp;
      }

   return c;
}

// USE A MATRIX TO TRANSFORM A VECTOR.

let matrixTransform = (M,V) => {
   return [
      M[0] * V[0] + M[4] * V[1] + M[ 8] * V[2] + M[12] * V[3],
      M[1] * V[0] + M[5] * V[1] + M[ 9] * V[2] + M[13] * V[3],
      M[2] * V[0] + M[6] * V[1] + M[10] * V[2] + M[14] * V[3],
      M[3] * V[0] + M[7] * V[1] + M[11] * V[2] + M[15] * V[3]
   ];
}

// INVERT A MATRIX.

let matrixInverse = src => {
  let dst = [], det = 0, cofactor = (c, r) => {
     let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
  for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
  return dst;
}

// MATRIX PRIMITIVES THAT WE WILL USE FOR ANIMATION.

let matrixIdentity = () => [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

let matrixTranslate = (a, x,y,z) => {
   if (Array.isArray(x)) {
      z = x[2];
      y = x[1];
      x = x[0];
   }
   let tm = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1 ];
   return matrixMultiply(a, tm);
}

let matrixAimZ = (a, Z) => {
   Z = normalize(Z);
   let x = Math.abs(Z[0]), y = Math.abs(Z[1]), z = Math.abs(Z[2]);
   let X = x < Math.min(y, z) ? [1,0,0] :
           y < Math.min(x, z) ? [0,1,0] : [0,0,1];
   let Y = normalize(cross(Z, X));
   X = normalize(cross(Y, Z));
   return [X[0],X[1],X[2],0,
           Y[0],Y[1],Y[2],0,
           Z[0],Z[1],Z[2],0,
	   a[12],a[13],a[14],1];

}

let matrixRotateX = (a, theta) => {
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   let rm = [ 1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1 ];
   return matrixMultiply(a, rm);
}

let matrixRotateY = (a, theta) => {
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   let rm = [ c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1 ];
   return matrixMultiply(a, rm);
}

let matrixRotateZ = (a, theta) => {
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   let rm = [ c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1 ];
   return matrixMultiply(a, rm);
}

let matrixScale = (a, x,y,z) => {
   if (Array.isArray(x)) {
      z = x[2];
      y = x[1];
      x = x[0];
   }
   else if (y === undefined)
      y = z = x;
   let sm = [ x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1 ];
   return matrixMultiply(a, sm);
}

let m = [], mTop = 0;
m[0] = matrixIdentity();

mIdentity  = ()      => m[mTop] = matrixIdentity();
mTranslate = (x,y,z) => m[mTop] = matrixTranslate(m[mTop],x,y,z);
mRotateX   = theta   => m[mTop] = matrixRotateX  (m[mTop],theta);
mRotateY   = theta   => m[mTop] = matrixRotateY  (m[mTop],theta);
mRotateZ   = theta   => m[mTop] = matrixRotateZ  (m[mTop],theta);
mScale     = (x,y,z) => m[mTop] = matrixScale    (m[mTop],x,y,z);
mAimZ      = Z       => m[mTop] = matrixAimZ     (m[mTop],Z);

mSave = () => {
   m[mTop+1] = m[mTop].slice();
   mTop++;
}

mRestore = () => mTop--;



