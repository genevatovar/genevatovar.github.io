// P5.js Histogram - UFO Encounter Duration
// With interactive tooltips
let data = [];
let histogram = [];
let maxFreq = 0;
let numBins = 30;
let mL = 80, mR = 50, mT = 60, mB = 80;
let plotW, plotH;

function preload() {
  // Load the CSV file
  table = loadTable('ufo_sightings_reduced.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600).parent('histogram');
  plotW = width - mL - mR;
  plotH = height - mT - mB;

  // Load and filter duration data from CSV
  data = loadData();

  // Create histogram bins and count values
  histogram = createBins(data);

  // Find max frequency for scaling
  maxFreq = Math.max(...histogram.map(b => b.count));

  noLoop();
}

function draw() {
  background(245);
  drawGrid();
  drawBars();
  drawAxes();
  addLabels();
}

// Parse duration data from CSV and filter top 5% outliers
function loadData() {
  let durations = [];
  for (let i = 0; i < table.getRowCount(); i++) {
    durations.push(table.getNum(i, 'duration'));
  }
  durations.sort((a, b) => a - b);
  return durations.slice(0, Math.floor(durations.length * 0.95));
}

// Divide data into bins and count values in each bin
function createBins(arr) {
  let minVal = arr[0];
  let maxVal = arr[arr.length - 1];
  let binWidth = (maxVal - minVal) / numBins;
  let bins = [];
  for (let i = 0; i < numBins; i++) {
    bins.push({ min: minVal + i * binWidth, max: minVal + (i + 1) * binWidth, count: 0 });
  }
  for (let val of arr) {
    let i = Math.min(Math.floor((val - minVal) / binWidth), numBins - 1);
    bins[i].count++;
  }
  return bins;
}

// Draw faint horizontal and vertical grid lines
function drawGrid() {
  stroke(200);
  for (let i = 0; i <= 10; i++) {
    line(mL, mT + (i / 10) * plotH, mL + plotW, mT + (i / 10) * plotH);
  }
}

// Draw histogram bars and tooltip on hover
function drawBars() {
  let barW = plotW / numBins;
  for (let i = 0; i < histogram.length; i++) {
    let bin = histogram[i];
    let bh = (bin.count / maxFreq) * plotH;
    let x = mL + i * barW;
    let y = mT + plotH - bh;
    let hovered = mouseX > x && mouseX < x + barW && mouseY > y && mouseY < mT + plotH;
    
    fill(70, 130, 180, hovered ? 200 : 150);    
    strokeWeight(1);
    stroke(0);
    rect(x, y, barW, bh);
    if (hovered) showTooltip(bin);
  }
}

// Draw X and Y axes with tick labels
function drawAxes() {
  stroke(0);
  line(mL, mT + plotH, mL + plotW, mT + plotH);
  line(mL, mT, mL, mT + plotH);

  fill(0);
  noStroke();
  textAlign(RIGHT, CENTER);
  textSize(12);
  for (let i = 0; i <= 10; i++) {
    text(Math.round((i / 10) * maxFreq), mL - 10, mT + (1 - i / 10) * plotH);
  }

  textAlign(CENTER, TOP);
  for (let i = 0; i <= 5; i++) {
    text(Math.round((i / 5) * data[data.length - 1]), mL + (i / 5) * plotW, mT + plotH + 10);
  }
}

// Add chart title and axis labels
function addLabels() {
  textSize(14);
  fill(0);
  textAlign(CENTER, TOP);
  text('Encounter Duration (seconds)', width / 2, mT + plotH + 45);

  push();
  translate(20, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text('Frequency', 0, 0);
  pop();

  textSize(16);
  textAlign(CENTER, TOP);
  text('Distribution of UFO Encounter Duration', width / 2, 20);
}

// Show tooltip for a hovered bin
function showTooltip(bin) {
  fill(255, 255, 220);
  stroke(0);
  let tx = mouseX + (mouseX + 190 > width ? -190 : 10);
  let ty = mouseY < 20 ? 10 : mouseY - 20;
  rect(tx, ty, 180, 70, 5); // ✅ add this back
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  text(`Range: ${Math.round(bin.min)}-${Math.round(bin.max)}s`, tx + 10, ty + 10);
  text(`Frequency: ${bin.count}`, tx + 10, ty + 30);
  text(`Percentage: ${((bin.count / data.length) * 100).toFixed(1)}%`, tx + 10, ty + 50);
}

function mouseMoved() {
  redraw();
}