// Heatmap is used for Temperature by Month x Year

let table;
let heatmapData = [];
let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"];

function preload() {
    table = loadTable('weather.csv', 'csv', 'header');
}

function setup() {
    createCanvas(960, 540).parent('heatmap');
    organizeData();
    noLoop();
}

// Parse temperature data by month and week
function organizeData() {
    let tempsByWeek = {};
    
    for (let i = 0; i < table.getRowCount(); i++) {
        let month = int(table.getString(i, 'Date.Month'));
        let week = int(table.getString(i, 'Date.Week of'));
        let temp = float(table.getString(i, 'Data.Temperature.Avg Temp'));
        
        if (month >= 1 && month <= 12 && week >= 1 && week <= 7 && !isNaN(temp)) {
            let key = month + '-' + week;
            if (!tempsByWeek[key]) {
                tempsByWeek[key] = [];
            }
            tempsByWeek[key].push(temp);
        }
    }
    
    // Organize data by month and week
    for (let m = 1; m <= 12; m++) {
        for (let w = 1; w <= 7; w++) {
            let key = m + '-' + w;
            if (tempsByWeek[key] && tempsByWeek[key].length > 0) {
                let sum = tempsByWeek[key].reduce((a, b) => a + b, 0);
                let avg = sum / tempsByWeek[key].length;
                heatmapData.push({
                    month: monthNames[m - 1],
                    monthNum: m - 1,
                    week: weekLabels[w - 1],
                    weekNum: w - 1,
                    temp: avg
                });
            }
        }
    }
}

function draw() {
    background(255);
    translate(120, 120);
    
    let minTemp = min(heatmapData.map(d => d.temp));
    let maxTemp = max(heatmapData.map(d => d.temp));
    
    drawTitle();
    drawAxes();
    drawCells(minTemp, maxTemp);
    drawLegend(minTemp, maxTemp);
}

function drawTitle() {
    fill(0);
    textAlign(CENTER);
    textSize(16);
    textStyle(BOLD);
    text("Temperature by Month and Week", 350, -80);
    textStyle(NORMAL);
}

// Add axes
function drawAxes() {
    stroke(0);
    line(0, 300, 700, 300);
    line(0, 0, 0, 300);
    
    fill(0);
    noStroke();
    textSize(12);
    
    let cellWidth = 700 / 12;
    for (let i = 0; i < 12; i++) {
        textAlign(CENTER);
        text(monthNames[i], i * cellWidth + cellWidth / 2, 320);
    }
    
    let cellHeight = 300 / 7;
    for (let i = 0; i < 7; i++) {
        textAlign(RIGHT);
        text(weekLabels[i], -10, i * cellHeight + cellHeight / 2 + 5);
    }
    
    // Add labels
    textAlign(CENTER);
    textSize(14);
    text("Month", 350, 360);
    
    push();
    translate(-80, 150);
    rotate(-HALF_PI);
    text("Week of Year", 0, 0);
    pop();
}

// Draw heatmap cells
function drawCells(minTemp, maxTemp) {
    let cellWidth = 700 / 12;
    let cellHeight = 300 / 7;
    
    for (let i = 0; i < heatmapData.length; i++) {
        let d = heatmapData[i];
        let x = d.monthNum * cellWidth;
        let y = d.weekNum * cellHeight;
        
        let t = map(d.temp, minTemp, maxTemp, 0, 1);
        let c = getHeatColor(t);
        
        fill(c);
        stroke(255);
        strokeWeight(2);
        rect(x, y, cellWidth, cellHeight);
        
        let isHovered = mouseX > 120 + x && mouseX < 120 + x + cellWidth &&
                       mouseY > 120 + y && mouseY < 120 + y + cellHeight;
        
        if (isHovered) {
            stroke(0);
            strokeWeight(3);
            noFill();
            rect(x, y, cellWidth, cellHeight);
            
            fill(0);
            noStroke();
            textAlign(CENTER);
            textSize(12);
            text(d.temp.toFixed(1) + "°F", x + cellWidth / 2, y + cellHeight / 2 + 5);
        }
    }
}

// Create scales (color scale for temperature)
function getHeatColor(t) {
    t = 1 - t;
    
    if (t < 0.5) {
        let r = 255;
        let g = map(t, 0, 0.5, 0, 255);
        let b = 0;
        return color(r, g, b);
    } else {
        let r = map(t, 0.5, 1, 255, 0);
        let g = 255;
        let b = map(t, 0.5, 1, 0, 255);
        return color(r, g, b);
    }
}

// Add color legend
function drawLegend(minTemp, maxTemp) {
    let legendWidth = 300;
    let legendHeight = 15;
    let legendX = 350 - legendWidth / 2;
    let legendY = -60;
    
    for (let i = 0; i < legendWidth; i++) {
        let t = i / legendWidth;
        let c = getHeatColor(t);
        stroke(c);
        line(legendX + i, legendY, legendX + i, legendY + legendHeight);
    }
    
    noStroke();
    fill(0);
    textSize(10);
    textAlign(LEFT);
    text(maxTemp.toFixed(0) + "°F", legendX - 30, legendY + legendHeight);
    textAlign(RIGHT);
    text(minTemp.toFixed(0) + "°F", legendX + legendWidth + 30, legendY + legendHeight);
}

function mouseMoved() {
    redraw();
}