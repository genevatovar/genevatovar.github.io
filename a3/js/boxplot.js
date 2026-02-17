// P5.js Box Plot - UFO Sighting Years
// With outliers highlighted and interactive tooltips
let data = [];
let stats = {};
let outliers = [];
let mL = 100, mR = 100, mT = 60, mB = 80;
let plotH;

function preload() {
  // Load the CSV file
  table = loadTable('ufo_sightings_reduced.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600).parent('boxplot');
  plotH = height - mT - mB;

  // Load year data from CSV
  data = loadData();

  // Calculate box plot statistics
  stats = calculateStats(data);

  noLoop();
}

function draw() {
  background(245);
  drawGrid();
  drawBoxPlot();
  drawOutliers();
  drawAxes();
  addLabels();
}

// Parse year data from CSV
function loadData() {
  let years = [];
  for (let i = 0; i < table.getRowCount(); i++) {
    years.push(table.getNum(i, 'year'));
  }
  return years.sort((a, b) => a - b);
}

// Calculates min, max, quartiles, IQR, whiskers, and outlier bounds
function calculateStats(arr) {
  let s = {};
  s.min = arr[0];
  s.max = arr[arr.length - 1];
  s.q1 = percentile(arr, 25);
  s.median = percentile(arr, 50);
  s.q3 = percentile(arr, 75);
  s.iqr = s.q3 - s.q1;
  let lower = s.q1 - 1.5 * s.iqr;
  let upper = s.q3 + 1.5 * s.iqr;
  outliers = arr.filter(d => d < lower || d > upper);
  s.lowerWhisker = arr.find(d => d >= lower);
  s.upperWhisker = [...arr].reverse().find(d => d <= upper);
  return s;
}

// Calculates percentile value from sorted array
function percentile(arr, p) {
  let index = (p / 100) * (arr.length - 1);
  let lo = Math.floor(index);
  let hi = Math.ceil(index);
  let weight = index - lo;
  return lo === hi ? arr[lo] : arr[lo] * (1 - weight) + arr[hi] * weight;
}

// Map a year value to a y pixel coordinate 
function mapY(year) {
  let yScale = plotH / (stats.max - stats.min + 5);
  return mT + plotH - (year - stats.min + 2.5) * yScale;
}

// Draw faint horizontal grid line
function drawGrid() {
  stroke(200);
  for (let y = Math.ceil(stats.min / 10) * 10; y <= stats.max; y += 10) {
    line(mL, mapY(y), width - mR, mapY(y));
  }
}

// Draw the box, whiskers, and median line
function drawBoxPlot() {
  let cx = width / 2, bx = cx - 40, bw = 80;

  // Whiskers
  stroke(0);
  line(cx, mapY(stats.lowerWhisker), cx, mapY(stats.q1));
  line(cx - 20, mapY(stats.lowerWhisker), cx + 20, mapY(stats.lowerWhisker));
  line(cx, mapY(stats.q3), cx, mapY(stats.upperWhisker));
  line(cx - 20, mapY(stats.upperWhisker), cx + 20, mapY(stats.upperWhisker));

  // Box (Q1 to Q3)
  fill(240, 128, 128, 180);
  stroke(0);
  rect(bx, mapY(stats.q3), bw, mapY(stats.q1) - mapY(stats.q3));

  // Median line
  stroke(139, 0, 0);
  line(bx, mapY(stats.median), bx + bw, mapY(stats.median));
}

// Draw outlier points and tooltip on hover
function drawOutliers() {
  for (let outlier of outliers) {
    let x = width / 2 + random(-15, 15);
    let y = mapY(outlier);
    let hovered = dist(mouseX, mouseY, x, y) < 8;

    fill(255, 0, 0, hovered ? 255 : 200);
    stroke(139, 0, 0);
    circle(x, y, hovered ? 12 : 8);

    if (hovered) showTooltip(outlier);
  }
}

// Draw Y-axis line and tick labels
function drawAxes() {
  stroke(0);
  line(mL, mT, mL, mT + plotH);

  fill(0);
  noStroke();
  textAlign(RIGHT, CENTER);
  textSize(12);
  for (let y = Math.ceil(stats.min / 10) * 10; y <= stats.max; y += 10) {
    text(y, mL - 10, mapY(y));
  }
}

// Add chart title, axis title, outlier legend, and interactivity note
function addLabels() {
  // Y-axis title
  push();
  translate(20, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  textSize(14);
  textStyle(BOLD);
  fill(0);
  noStroke();
  text('Year', 0, 0);
  pop();

  // Chart title
  textAlign(CENTER, TOP);
  textSize(16);
  fill(0);
  noStroke();
  text('Distribution of UFO Sighting Years (Box Plot)', width / 2, 20);
}

// Show tooltip for a hovered outlier
function showTooltip(outlier) {
  fill(255, 255, 220);
  stroke(0);
  let tx = mouseX + (mouseX + 135 > width ? -135 : 15);
  rect(tx, mouseY - 25, 120, 50, 5);
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  text(`Year: ${Math.round(outlier)}`, tx + 10, mouseY - 15);
  text(`(Outlier)`, tx + 10, mouseY + 5);
}

function mouseMoved() {
  redraw();
}