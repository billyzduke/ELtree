let splits = [2, 2, 3, 5, 7];
let totalWires = 420; 
let baseLen = 40; 
let startingVertLen = 30; 
let startingHorizLen = 214; 
let wireSpacing = 2; 
let bundleTightness = 0.2; 
let splayInward = true; 

let allWires = [];
let lengthVariations = []; 

let elColors = [
  '#DFFF00', '#39FF14', '#FF00BF', '#0044FF', '#6600FF', 
  '#FF0800', '#E6E6FA', '#00CC44', '#FF5E00', '#00FFFF'
];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  perspective(PI / 3.0, width / height, 0.1, 5000);
  strokeWeight(1.5);
  noFill();
  
  randomSeed(42); 
  
  for (let i = 0; i < 1000; i++) {
    lengthVariations.push(random(0.5, 1.5)); 
  }
  
  for (let i = 0; i < totalWires; i++) {
    allWires.push({
      path: calculateCoilPath(i),
      color: random(elColors) 
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
    
    let c = color(wire.color);
    c.setAlpha(180); 
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
  let currentAngle = 0;
  
  for (let d = 0; d < splits.length; d++) {
    let numSplits = splits[d];
    let prevGroupSize = groupSize;
    groupSize = groupSize / numSplits; 
    
    let localBranch = floor(remainder / groupSize);
    remainder = remainder % groupSize;
    
    let isSpine = (d === splits.length - 1 && localBranch === 6);
    
    let angleOffset = 0;
    if (numSplits === 7) {
      angleOffset = (TWO_PI * localBranch) / 6;
    } else if (numSplits === 5) {
      let junctionID = floor(wireIndex / prevGroupSize);
      let slot = (localBranch + junctionID) % 6;
      angleOffset = (TWO_PI * slot) / 6;
    } else {
      if (d === 1 && numSplits === 2) {
        if (splayInward) {
          angleOffset = (localBranch === 0) ? (2 * PI / 3) : (-2 * PI / 3);
        } else {
          angleOffset = (localBranch === 0) ? (PI / 3) : (-PI / 3);
        }
      } else {
        angleOffset = (TWO_PI * localBranch) / numSplits;
      }
    }
    
    let branchAngle = currentAngle + angleOffset;
    
    if (!isSpine) {
      let radius = sqrt(groupSize) * wireSpacing * bundleTightness;
      if (d === splits.length - 1) {
         radius = wireSpacing; 
      }
      
      ox += cos(branchAngle) * radius;
      oy += sin(branchAngle) * radius;
    }
    
    currentAngle = branchAngle; 
  }
  return createVector(ox, oy, 0);
}

function calculateCoilPath(wireIndex) {
  let points = [];
  let currentPos = createVector(0, 0, 0);
  let currentHorizLen = startingHorizLen;
  let currentVertLen = startingVertLen;
  let currentAngle = 0;
  
  let physicalOffset = getBundleOffset(wireIndex);
  let remainder = wireIndex;
  let groupSize = totalWires;

  points.push(p5.Vector.add(currentPos, physicalOffset));
  
  let d0_groupSize = totalWires / splits[0];
  let d0_bundleID = floor(wireIndex / d0_groupSize);
  let baseHash = (d0_bundleID * 7) % lengthVariations.length;
  let baseMod = 1.0 + (lengthVariations[baseHash] - 1.0) * 0.8; 
  
  currentPos.z += (baseLen * baseMod);
  points.push(p5.Vector.add(currentPos, physicalOffset));

  for (let d = 0; d < splits.length; d++) {
    let numSplits = splits[d];
    let prevGroupSize = groupSize;
    groupSize = groupSize / numSplits; 
    
    let localBranch = floor(remainder / groupSize);
    let globalBundleID = floor(wireIndex / groupSize); 
    remainder = remainder % groupSize;
    
    let uniqueNodeID = d * 1000 + globalBundleID;
    let lengthMod = lengthVariations[uniqueNodeID % lengthVariations.length];
    let distFromCenter = dist(0, 0, currentPos.x, currentPos.y);
    let roundnessMod = map(distFromCenter, 0, 250, 1.5, 0.4, true);

    let isFinalLevel = (d === splits.length - 1);
    let isSpine = (isFinalLevel && localBranch === 6);
    let finalSquash = isFinalLevel ? 0.5 : 1.0; 

    let angleOffset = 0;
    if (numSplits === 7) {
      angleOffset = (TWO_PI * localBranch) / 6;
    } else if (numSplits === 5) {
      let junctionID = floor(wireIndex / prevGroupSize);
      let slot = (localBranch + junctionID) % 6;
      angleOffset = (TWO_PI * slot) / 6;
    } else {
      if (d === 1 && numSplits === 2) {
        angleOffset = splayInward ? (2 * PI / 3) : (PI / 3);
        if (localBranch !== 0) angleOffset *= -1;
      } else {
        angleOffset = (TWO_PI * localBranch) / numSplits;
      }
    }

    if (isSpine) {
      let spineLen = currentVertLen * lengthMod * roundnessMod * finalSquash; 
      let spinePos = p5.Vector.add(currentPos, createVector(0, 0, spineLen));
      points.push(p5.Vector.add(spinePos, physicalOffset));
      currentPos = spinePos.copy();
    } else {
      let branchAngle = currentAngle + angleOffset;
      let dirX = cos(branchAngle);
      let dirY = sin(branchAngle);

      let peelStagger = 1.0;
      if (!isFinalLevel) {
        let nextNumSplits = splits[d + 1];
        let nextGroupSize = groupSize / nextNumSplits;
        let nextBundleID = floor(wireIndex / nextGroupSize);
        let hash = (nextBundleID * 11 + d * 17) % lengthVariations.length;
        peelStagger = 1.0 + (lengthVariations[hash] - 1.0) * 0.7; 
      }

      let elbowMultiplier = (numSplits === 2) ? 0.385 : 0.3;
      let elbowLen = currentHorizLen * elbowMultiplier; 
      let fingerLen = currentVertLen * lengthMod * peelStagger * roundnessMod * finalSquash;

      let elbowPos = p5.Vector.add(currentPos, createVector(dirX * elbowLen, dirY * elbowLen, 0));
      let fingerPos = p5.Vector.add(elbowPos, createVector(0, 0, fingerLen));

      // Calculate Rotation Matrix for the Horizontal Segment
      let sinA = sin(branchAngle);
      let cosA = cos(branchAngle);
      
      // This creates a circular cross-section perpendicular to the branch direction
      let rotX = physicalOffset.x * (sinA * sinA) - physicalOffset.y * (sinA * cosA);
      let rotY = -physicalOffset.x * (sinA * cosA) + physicalOffset.y * (cosA * cosA);
      let rotZ = -(physicalOffset.x * cosA + physicalOffset.y * sinA);
      let rotatedOffset = createVector(rotX, rotY, rotZ);

      // 1. Point at the vertical-to-horizontal transition (starts rotating)
      points.push(p5.Vector.add(currentPos, rotatedOffset)); 
      // 2. Point at the end of the horizontal run (still rotated)
      points.push(p5.Vector.add(elbowPos, rotatedOffset));
      // 3. Point at the horizontal-to-vertical transition (snaps back to vertical offset)
      points.push(p5.Vector.add(fingerPos, physicalOffset));

      currentPos = fingerPos.copy();
      currentAngle = branchAngle; 
    }
    
    currentHorizLen *= 0.7; 
    currentVertLen *= 1.14;  
  }
  return points;
}