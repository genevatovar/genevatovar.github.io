// P5.js Strip Chart - UFO Sighting Hours
// With jittering and interactive tooltips

let hourCounts = new Array(24).fill(0);
let points = [];
let mL = 100, mR = 100, mT = 60, mB = 80;
let plotW, plotH;

function preload() {
  // Load the CSV file
  table = loadTable('ufo_sightings_reduced.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600).parent('stripchart');
  plotW = width - mL - mR;
  plotH = height - mT - mB;

  // Load hour data and create jittered points from CSV
  loadData();

  noLoop();
}

function draw() {
  background(245);
  drawGrid();
  drawPoints();
  drawAxes();
  addLabels();
}

// Parse hour data from CSV, count per hour, and build jittered point list
function loadData() {
  for (let i = 0; i < table.getRowCount(); i++) {
    let hour = table.getNum(i, 'hour');
    hourCounts[hour]++;
    points.push({ hour, x: random(-0.3, 0.3) });
  }
}

// Map functions for screen coordinates
function mapX(x) { return width / 2 + x * (plotW / 2); }
function mapY(h) { return mT + (h / 24) * plotH; }

// Draw faint horizontal grid lines
function drawGrid() {
  stroke(200);
  for (let h = 0; h <= 24; h += 2) {
    line(mL, mapY(h), mL + plotW, mapY(h));
  }
}

// Draw all jittered poits and tooltip for the nearest hovered point
function drawPoints() {
  let hoveredPoint = null;
  let minDist = 10;
  for (let point of points) {
    let d = dist(mouseX, mouseY, mapX(point.x), mapY(point.hour));
    if (d < minDist) { minDist = d; hoveredPoint = point; }
  }

  for (let point of points) {
    fill(0, 128, 0, 100);
    stroke(0, 100, 0);
    circle(mapX(point.x), mapY(point.hour), 4);
  }

  if (hoveredPoint) showTooltip(hoveredPoint);
}

// Draw Y-axis line and hour number labels
function drawAxes() {
  stroke(0);
  line(mL, mT, mL, mT + plotH);

  fill(0);
  noStroke();
  textAlign(RIGHT, CENTER);
  textSize(12);
  for (let h = 0; h <= 24; h += 2) {
    text(h, mL - 10, mapY(h));
  }
}

// Add chart title and Y-axis titl
function addLabels() {
  push();
  translate(20, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  textSize(14);
  fill(0);
  noStroke();
  text('Hour of Day (0-23)', 0, 0);
  pop();

  textSize(16);
  textAlign(CENTER, TOP);
  fill(0);
  text('Distribution of UFO Sighting Hours (Strip Chart)', width / 2, 20);
}

// Show tooltip for  hovered point
function showTooltip(point) {
  let hour = Math.round(point.hour);
  let timeStr = hour === 0 ? '12:00 AM' :
                hour < 12 ? `${hour}:00 AM` :
                hour === 12 ? '12:00 PM' :
                `${hour - 12}:00 PM`;
  let tx = mouseX + (mouseX + 175 > width ? -175 : 15);
  let ty = mouseY < 35 ? 10 : mouseY - 35;
  fill(255, 255, 220);
  stroke(0);
  rect(tx, ty, 160, 70);
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  text(`Hour: ${hour}`, tx + 10, ty + 10);
  text(`Time: ${timeStr}`, tx + 10, ty + 30);
  text(`Count: ${hourCounts[hour]} sightings`, tx + 10, ty + 50);
}

function mouseMoved() {
  redraw();
}