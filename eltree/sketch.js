let splits = [2, 3, 5, 7];
let totalWires = 210; 
let baseLen = 120; 
let trunkLen = 150;
let wireSpacing = 2.5; 
let bundleTightness = 0.55; 

let allWires = [];

// Hex approximations of the manufacturer's EL wire colors
let elColors = [
  '#DFFF00', // Citron Yellow
  '#39FF14', // Magnetic Green
  '#FF00BF', // Brilliant Pink
  '#0044FF', // Vibrant Blue
  '#6600FF', // Pistol Purple
  '#FF0800', // Fiendish Red
  '#E6E6FA', // Lavender White
  '#00CC44', // Lucky Green
  '#FF5E00', // Charged Orange
  '#00FFFF'  // Aqua
];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  perspective(PI / 3.0, width / height, 0.1, 5000);
  strokeWeight(1.5);
  noFill();
  
  for (let i = 0; i < totalWires; i++) {
    allWires.push({
      path: calculateCoilPath(i),
      color: random(elColors) // Assign a random EL color to this specific wire
    });
  }
}

function draw() {
  background(15);
  orbitControl(); 
  rotateX(PI); 

  for (let i = 0; i < allWires.length; i++) {
    let wire = allWires[i];
    beginShape();
    
    // Convert the hex string to a p5 color object to apply alpha
    let c = color(wire.color);
    c.setAlpha(180); // Gives the dense bundles a luminous, glowing effect
    stroke(c); 
    
    for (let p of wire.path) {
      vertex(p.x, p.y, p.z);
    }
    endShape();
  }
}

function getBundleOffset(wireIndex) {
  let ox = 0;
  let oy = 0;
  let remainder = wireIndex;
  let groupSize = totalWires;
  
  for (let d = 0; d < splits.length; d++) {
    let numSplits = splits[d];
    groupSize = groupSize / numSplits; 
    
    let localBranch = floor(remainder / groupSize);
    remainder = remainder % groupSize;
    
    let isSpine = (d === splits.length - 1 && localBranch === 6);
    
    if (!isSpine) {
      let angle = (TWO_PI * localBranch) / numSplits;
      
      let radius = sqrt(groupSize) * wireSpacing * bundleTightness;
      if (d === splits.length - 1) {
         radius = wireSpacing; 
      }
      
      ox += cos(angle) * radius;
      oy += sin(angle) * radius;
    }
  }
  return createVector(ox, oy, 0);
}

function calculateCoilPath(wireIndex) {
  let points = [];
  let currentPos = createVector(0, 0, 0);
  let currentLen = trunkLen;
  let currentAngle = 0;
  
  let physicalOffset = getBundleOffset(wireIndex);
  
  let remainder = wireIndex;
  let groupSize = totalWires;

  points.push(p5.Vector.add(currentPos, physicalOffset));

  currentPos.z += baseLen;
  points.push(p5.Vector.add(currentPos, physicalOffset));

  for (let d = 0; d < splits.length; d++) {
    let numSplits = splits[d];
    groupSize = groupSize / numSplits; 
    
    let localBranch = floor(remainder / groupSize);
    remainder = remainder % groupSize;
    
    let isFinalLevel = (d === splits.length - 1);
    let isSpine = (isFinalLevel && localBranch === 6);

    if (isSpine) {
      let spinePos = p5.Vector.add(currentPos, createVector(0, 0, currentLen));
      points.push(p5.Vector.add(spinePos, physicalOffset));
      currentPos = spinePos.copy();
    } else {
      let angleOffset = (TWO_PI * localBranch) / numSplits;
      let branchAngle = currentAngle + angleOffset;
      let dirX = cos(branchAngle);
      let dirY = sin(branchAngle);

      let elbowLen = currentLen * 0.3;
      let fingerLen = currentLen * 0.7;

      let elbowPos = p5.Vector.add(currentPos, createVector(dirX * elbowLen, dirY * elbowLen, 0));
      let fingerPos = p5.Vector.add(elbowPos, createVector(0, 0, fingerLen));

      points.push(p5.Vector.add(elbowPos, physicalOffset));
      points.push(p5.Vector.add(fingerPos, physicalOffset));

      currentPos = fingerPos.copy();
      currentAngle = branchAngle; 
    }
    currentLen *= 0.7; 
  }
  return points;
}