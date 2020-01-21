//------------ CONFIG ---------------------------------
var tolerance = 0.001;

//------------ SCENE ---------------------------------
var scene = new THREE.Scene();
scene.background = new THREE.Color( 'grey' );

//------------ CAMERA ---------------------------------
var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, -300, 50);


//------------ LIGHTS ---------------------------------
light1 = new THREE.PointLight( 0xff0040, 2, 50 );
scene.add(light1);

//------------ RENDERER ---------------------------------
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


//------------ CONTROLS ---------------------------------
var controls = new THREE.OrbitControls(camera, renderer.domElement);  
scene.add(new THREE.AxisHelper(2));


//------------ MATERIALS ---------------------------------
const materialPath='/assets/r2-d2.mtl';

var mtlLoader = new THREE.MTLLoader();
mtlLoader.load(materialPath, function (materials) {
    mtlLoader.setTexturePath('/assets/');
    materials.preload();
}   );

var material = new THREE.MeshBasicMaterial({
  color: "blue",
  wireframe: true
});

var materialPlane = new THREE.MeshBasicMaterial({
  color: "lightgray",
  transparent: true,
  opacity: 0.125,
  side: THREE.DoubleSide
});

//------------ GEOMETRY \\ MODELS ---------------------------------
const modelPath='/assets/r2-d2.obj';
//const modelPath='/assets/A.obj';
//const modelPath='/assets/teddy.obj';

var planeGeom = new THREE.PlaneGeometry(3000, 3000);
var plane = new THREE.Mesh(planeGeom, materialPlane);
plane.position.y = -300;  
scene.add(plane);

//var objGeom = new THREE.TorusKnotGeometry(10, 3);
//var objGeom = new THREE.DodecahedronGeometry(10, 0);
//var objGeom = new THREE.TetrahedronGeometry(10, 0);
//var objGeom = new THREE.BoxGeometry(20, 20, 20);
//var objGeom = new THREE.SphereGeometry(10, 5, 2);
// var stdModel = new THREE.Mesh(objGeom,material);
// scene.add(obj);


var objLoader = new THREE.OBJLoader();
objLoader.load(modelPath, function(object) {
  objModelGeometry = new THREE.Geometry().fromBufferGeometry(object.children["0"].geometry);
  objModelMesh=new THREE.Mesh(objModelGeometry,material);
  scene.add(objModelMesh);    
});




//---------------other functions ------------------------------------------------------------------ 
var pressMe=addEventListener("click", drawIntersectionPoints, false);
var pointsOfIntersection = new THREE.Geometry();
var a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3();
var planePointA = new THREE.Vector3(),
  planePointB = new THREE.Vector3(),
  planePointC = new THREE.Vector3();
var lineAB = new THREE.Line3(),
  lineBC = new THREE.Line3(),
  lineCA = new THREE.Line3();

var pointOfIntersection = new THREE.Vector3();

//drawIntersectionPoints();

function drawIntersectionPoints() {
  var mathPlane = new THREE.Plane();
  plane.localToWorld(planePointA.copy(plane.geometry.vertices[plane.geometry.faces[0].a]));
  plane.localToWorld(planePointB.copy(plane.geometry.vertices[plane.geometry.faces[0].b]));
  plane.localToWorld(planePointC.copy(plane.geometry.vertices[plane.geometry.faces[0].c]));
  mathPlane.setFromCoplanarPoints(planePointA, planePointB, planePointC);

  objModelMesh.geometry.faces.forEach(function(face, idx) {
    objModelMesh.localToWorld(a.copy(objModelMesh.geometry.vertices[face.a]));
    objModelMesh.localToWorld(b.copy(objModelMesh.geometry.vertices[face.b]));
    objModelMesh.localToWorld(c.copy(objModelMesh.geometry.vertices[face.c]));
    lineAB = new THREE.Line3(a, b);
    lineBC = new THREE.Line3(b, c);
    lineCA = new THREE.Line3(c, a);
    setPointOfIntersection(lineAB, mathPlane, idx);
    setPointOfIntersection(lineBC, mathPlane, idx);
    setPointOfIntersection(lineCA, mathPlane, idx);
  });

  var pointsMaterial = new THREE.PointsMaterial({
    size: .5,
    color: 0x00ff00
  });
  var points = new THREE.Points(pointsOfIntersection, pointsMaterial);
 scene.add(points);

  //var pairs = splitPairs(pointsOfIntersection.vertices);

  var contours = getContours(pointsOfIntersection.vertices, [], true);
  console.log("contours", contours);
  
  contours.forEach(cntr => {
      let cntrGeom = new THREE.Geometry();
      cntrGeom.vertices = cntr;
      let contour = new THREE.Line(cntrGeom, new THREE.LineBasicMaterial({
        color: Math.random() * 0xffffff //0x777777 + 0x777777
      }));
      scene.add(contour);
    });
}

function setPointOfIntersection(line, plane, faceIdx) {
  pointOfIntersection = plane.intersectLine(line);
  if (pointOfIntersection) {
    let p = pointOfIntersection.clone();
    p.faceIndex = faceIdx;
    p.checked = false;
    pointsOfIntersection.vertices.push(p);
  };
}


function getContours(points, contours, firstRun) {
  console.log("firstRun:", firstRun);

  let contour = [];

  // find first line for the contour
  let firstPointIndex = 0;
  let secondPointIndex = 0;
  let firsPoint, secondPoint;
  for (let i = 0; i < points.length; i++) {
    if (points[i].checked == true) continue;
    firstPointIndex = i;
    firstPoint = points[firstPointIndex];
    firstPoint.checked = true;
    secondPointIndex = getPairIndex(firstPoint, firstPointIndex, points);
    secondPoint = points[secondPointIndex];
    secondPoint.checked = true;
    contour.push(firstPoint.clone());
    contour.push(secondPoint.clone());
    break;
  }

  contour = getContour(secondPoint, points, contour);
  contours.push(contour);
  let allChecked = 0;
  points.forEach(p => { allChecked += p.checked == true ? 1 : 0; });
  console.log("allChecked: ", allChecked == points.length);
  if (allChecked != points.length) { return getContours(points, contours, false); }
  return contours;
}

function getContour(currentPoint, points, contour){
  let p1Index = getNearestPointIndex(currentPoint, points);
  let p1 = points[p1Index];
  p1.checked = true;
  let p2Index = getPairIndex(p1, p1Index, points);
  let p2 = points[p2Index];	
  p2.checked = true;
  let isClosed = p2.equals(contour[0], tolerance);
  if (!isClosed) {
    contour.push(p2.clone());
    //return getContour(p2, points, contour);
  } else {
    contour.push(contour[0].clone());
    //return contour;
  }
  return contour;
}

function getNearestPointIndex(point, points){
  let index = 0;
  for (let i = 0; i < points.length; i++){
    let p = points[i];
    if (p.checked == false && p.equals(point, tolerance)){ 
      index = i;
      break;
    }
  }
  return index;
}

function getPairIndex(point, pointIndex, points) {
  let index = 0;
  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    if (i != pointIndex && p.checked == false && p.faceIndex == point.faceIndex) {
      index = i;
      break;
    }
  }
  return index;
}






//--------------- RENDER ------------------------------------------------------------------ 
render();

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

