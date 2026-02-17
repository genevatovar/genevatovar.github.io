// Dot Plot is used for Monthly Total Precipitation

let table;
let data = [];
let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function preload() {
    table = loadTable('weather.csv', 'csv', 'header');
}

function setup() {
    createCanvas(800, 600).parent('dot-plot');
    calculateMonthlyTotals();
    noLoop();
}

// Parse precipitation data by month
function calculateMonthlyTotals() {
    let monthPrecip = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    for (let i = 0; i < table.getRowCount(); i++) {
        let month = int(table.getString(i, 'Date.Month')) - 1;
        let precip = float(table.getString(i, 'Data.Precipitation'));
        
        if (month >= 0 && month < 12 && !isNaN(precip)) {
            monthPrecip[month] += precip;
        }
    }
    
    // Calculate total precipitation per month
    for (let i = 0; i < 12; i++) {
        data.push({month: monthNames[i], precip: monthPrecip[i]});
    }
}

function draw() {
    background(255);
    
    let maxPrecip = max(data.map(d => d.precip));
    let dotSpacing = 600 / 12;
    
    translate(80, 60);
    
    drawTitle();
    drawAxes(maxPrecip, dotSpacing);
    drawDots(maxPrecip, dotSpacing);
}

function drawTitle() {
    fill(0);
    textAlign(CENTER);
    textSize(16);
    textStyle(BOLD);
    text("Monthly Total Precipitation", 300, -20);
    textStyle(NORMAL);
}

// Add axes
function drawAxes(maxPrecip, dotSpacing) {
    stroke(0);
    line(0, 400, 600, 400);
    line(0, 0, 0, 400);
    
    fill(0);
    noStroke();
    textSize(12);
    
    for (let i = 0; i < data.length; i++) {
        textAlign(CENTER);
        text(data[i].month, i * dotSpacing + dotSpacing / 2, 420);
    }
    
    // Create scales (log scale for y-axis)
    textAlign(RIGHT);
    let logMax = log(maxPrecip) / log(10);
    
    for (let i = 0; i <= 5; i++) {
        let logVal = map(i, 0, 5, -1, logMax);
        let precipVal = pow(10, logVal);
        let y = map(logVal, -1, logMax, 400, 0);
        
        text(precipVal.toFixed(1), -10, y + 5);
        
        stroke(200);
        line(0, y, 600, y);
        noStroke();
    }
    
    // Add labels
    textAlign(CENTER);
    textSize(14);
    text("Month", 300, 460);
    
    push();
    translate(-50, 200);
    rotate(-HALF_PI);
    text("Total Precipitation (inches)", 0, 0);
    pop();
}

// Draw dots
function drawDots(maxPrecip, dotSpacing) {
    let logMax = log(maxPrecip) / log(10);
    
    for (let i = 0; i < data.length; i++) {
        let x = i * dotSpacing + dotSpacing / 2;
        let logVal = log(max(data[i].precip, 0.1)) / log(10);
        let y = map(logVal, -1, logMax, 400, 0);
        
        let distance = dist(mouseX, mouseY, 80 + x, 60 + y);
        
        if (distance < 15) {
            fill(255, 165, 0);
            circle(x, y, 16);
            
            fill(0);
            textAlign(CENTER);
            textSize(14);
            text(data[i].precip.toFixed(2) + " in", x, y - 20);
        } else {
            fill(70, 130, 180);
            circle(x, y, 12);
        }
    }
}

function mouseMoved() {
    redraw();
}