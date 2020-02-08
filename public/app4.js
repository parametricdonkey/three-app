var tolerance = 0.001;

var camera;
var scene;
var renderer;
var mesh;

var canvas;
var light;
var material;
var materialPlane;

//adds
var planeMesh;
var objModelMesh;


var controls;
var pointsOfIntersection;
var pointOfIntersection;

var csv;

init();

function init(){
  
    //canvas
    canvas=document.getElementById("WEBGL");
    
    //scene
    scene= new THREE.Scene();
    scene.background = new THREE.Color("grey");
    
    //camera
    camera= new THREE.PerspectiveCamera(50, canvas.clientWidth/canvas.clientHeight,1,1000);
    // camera= new THREE.OrthographicCamera(canvas.clientWidth/-2,canvas.clientWidth/2, canvas.clientHeight/2,canvas.clientHeight/-2,-100,1000);

    //camera.position.set(0,0,50); //FRONT
    //camera.position.set(50,0,0); //RIGHT
    camera.position.set(0,160,0); //TOP

    
    
    //lights
    light = new THREE.DirectionalLight(0xffffff) ;
    light.position.set(0,1,1).normalize();
    scene.add(light);
    
    //materials
    material= new THREE.MeshLambertMaterial({color:0x999ff});
    
    materialPlane= new THREE.MeshBasicMaterial({
        color: "gray",
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });

    //section plane
    var planeGeom= new THREE.PlaneGeometry(300,300);
    planeGeom.rotateX(-Math.PI/2);
    
    planeMesh = new THREE.Mesh(planeGeom, materialPlane);
    planeMesh.position.x=-1000;
    planeMesh.position.y=70;
    planeMesh.position.z=1000;
    scene.add(planeMesh);

    //OBJ geometry
    const modelPath='/assets/r2-d2.obj';
    
    var objLoader = new THREE.OBJLoader();
    objLoader.load(modelPath, function(object) {
    objModelGeometry = new THREE.Geometry().fromBufferGeometry(object.children["0"].geometry);
    objModelMesh=new THREE.Mesh(objModelGeometry,material);
    console.log("OBJ GEOMETRY --->");
    console.log(objModelMesh);
    scene.add(objModelMesh);    
    });

    
    //TEST geometry
    var geometry = new THREE.CubeGeometry( 10, 10, 10);
    mesh = new THREE.Mesh(geometry, material );
    mesh.position.z = -20;
    scene.add( mesh );
    
    //renderer
    renderer = new THREE.WebGLRenderer({antialias: false, canvas: canvas});
    canvas.width=canvas.clientWidth;
    canvas.height=canvas.clientHeight;
    // renderer.setViewport(0,0,canvas.clientWidth,canvas.clientHeight);
    renderer.setViewport(0,0,canvas.width,canvas.height);
    
    var button=document.getElementById("convert");
    button.addEventListener('click',svgSnapshot,false);    

    var button2=document.getElementById("intersect");
    button2.addEventListener('click',function(){
      drawIntersectionPoints(planeMesh,objModelMesh);
    },false);


    controls = new THREE.OrbitControls(camera, renderer.domElement);    
    scene.add(new THREE.AxisHelper(10));  
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.25;
    // controls.enableZoom = true;

    render();
}

//functions

function render() {
   // window.addEventListener('resize',onWindowResize, true);
    requestAnimationFrame(render);
    renderer.render(scene,camera );
}
  
function onWindowResize() {
	/* The resizing code here also comes from rioki */
	var canvas = document.getElementById("webgl");
	canvas.width  = canvas.clientWidth;
  	canvas.height = canvas.clientHeight;
  	renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  	camera.aspect = canvas.clientWidth / canvas.clientHeight;
  	camera.updateProjectionMatrix();
    render();
}

function removeChildrenFromNode(node) {
	var fc = node.firstChild;

	while( fc ) {
		node.removeChild( fc );
		fc = node.firstChild;
	}
}

function svgSnapshot() {
	var svgContainer = document.getElementById("SVG");
	removeChildrenFromNode(svgContainer);
	var width  = svgContainer.getBoundingClientRect().width;
	var height = svgContainer.getBoundingClientRect().height;
  //-----hide geometry-----
  scene.remove(objModelMesh);
	svgRenderer = new THREE.SVGRenderer();
	svgRenderer.setClearColor( 0xffffff );
	svgRenderer.setSize(width,height );
	svgRenderer.setQuality( 'high' );
	svgContainer.appendChild( svgRenderer.domElement );
	svgRenderer.render( scene, camera );
	
	/* The following discussion shows how to scale an SVG to fit its contained
	 *
	 *  http://stackoverflow.com/questions/4737243/fit-svg-to-the-size-of-object-container
	 *
	 * Another useful primer is here
	 *  https://sarasoueidan.com/blog/svg-coordinate-systems/
	 */
	svgRenderer.domElement.removeAttribute("width");
	svgRenderer.domElement.removeAttribute("height");
  document.getElementById("source").value = svgContainer.innerHTML.replace(/<path/g,"\n<path");
}



//---------------other functions ------------------------------------------------------------------ 

function drawIntersectionPoints(plane,objModelMesh) {
  console.log("start");

  pointsOfIntersection = new THREE.Geometry();
  var a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3();
  var planePointA = new THREE.Vector3(),
  planePointB = new THREE.Vector3(),
  planePointC = new THREE.Vector3();
  var lineAB = new THREE.Line3(),
  lineBC = new THREE.Line3(),
  lineCA = new THREE.Line3();

  pointOfIntersection = new THREE.Vector3();
  
  var mathPlane = new THREE.Plane();
  console.log("middle");
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
 //scene.add(points);

  //var pairs = splitPairs(pointsOfIntersection.vertices);

  var contours = getContours(pointsOfIntersection.vertices, [], true);
  console.log("contours", contours);

  console.log("pointsOfIntersection.vertices", pointsOfIntersection.vertices);

  // csv = exportToCsv("file.csv",pointOfIntersection);
  
  contours.forEach(cntr => {
      let cntrGeom = new THREE.Geometry();
      cntrGeom.vertices = cntr;
      let contour = new THREE.Line(cntrGeom, new THREE.LineBasicMaterial({
        color: "red"
      }));
      scene.add(contour);      
    });
    return contours;
}


//-------------------------------------------------------------------------------------------------------------

function exportToCsv(filename, rows) {
  var processRow = function (row) {
      var finalVal = '';
      for (var j = 0; j < row.length; j++) {
          var innerValue = row[j] === null ? '' : row[j].toString();
          if (row[j] instanceof Date) {
              innerValue = row[j].toLocaleString();
          };
          var result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0)
              result = '"' + result + '"';
          if (j > 0)
              finalVal += ',';
          finalVal += result;
      }
      return finalVal + '\n';
  };

  var csvFile = '';
  for (var i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
  } else {
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
  console.log("blob",blob);
  return blob;
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
  //console.log("firstRun:", firstRun);
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
  //console.log("allChecked: ", allChecked == points.length);
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
  var finalContour;
  if (!isClosed) {
    contour.push(p2.clone());    
      //getContour(p2, points, contour); 
  } else {
    contour.push(contour[0].clone());    
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

