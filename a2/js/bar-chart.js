// Bar Chart is used for Average Monthly Temperature

let table;
let data = [];
let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function preload() {
    table = loadTable('weather.csv', 'csv', 'header');
}

function setup() {
    createCanvas(800, 600).parent('bar-chart');
    calculateMonthlyAverages();
    noLoop();
}

// Parse temperature data by month
function calculateMonthlyAverages() {
    let monthTemps = [[], [], [], [], [], [], [], [], [], [], [], []];
    
    for (let i = 0; i < table.getRowCount(); i++) {
        let month = int(table.getString(i, 'Date.Month')) - 1;
        let temp = float(table.getString(i, 'Data.Temperature.Avg Temp'));
        
        if (month >= 0 && month < 12 && !isNaN(temp)) {
            monthTemps[month].push(temp);
        }
    }
    
    // Calculate average temperature per month
    for (let i = 0; i < 12; i++) {
        if (monthTemps[i].length > 0) {
            let sum = monthTemps[i].reduce((a, b) => a + b, 0);
            let avg = sum / monthTemps[i].length;
            data.push({month: monthNames[i], temp: avg});
        }
    }
}

function draw() {
    background(255);
    
    let maxTemp = max(data.map(d => d.temp));
    let barWidth = 600 / 12;
    
    translate(80, 60);
    
    drawTitle();
    drawAxes(maxTemp, barWidth);
    drawBars(maxTemp, barWidth);
}

function drawTitle() {
    fill(0);
    textAlign(CENTER);
    textSize(16);
    textStyle(BOLD);
    text("Average Monthly Temperature", 300, -20);
    textStyle(NORMAL);
}

// Add axes
function drawAxes(maxTemp, barWidth) {
    stroke(0);
    line(0, 400, 600, 400);
    line(0, 0, 0, 400);
    
    fill(0);
    noStroke();
    textSize(12);
    
    for (let i = 0; i < data.length; i++) {
        textAlign(CENTER);
        text(data[i].month, i * barWidth + barWidth / 2, 420);
    }
    
    textAlign(RIGHT);
    for (let i = 0; i <= 5; i++) {
        let y = map(i, 0, 5, 400, 0);
        let temp = map(i, 0, 5, 0, maxTemp);
        text(int(temp), -10, y + 5);
    }
    
    // Add labels
    textAlign(CENTER);
    textSize(14);
    text("Month", 300, 460);
    
    push();
    translate(-50, 200);
    rotate(-HALF_PI);
    text("Avg Temperature (°F)", 0, 0);
    pop();
}

// Draw bars
function drawBars(maxTemp, barWidth) {
    for (let i = 0; i < data.length; i++) {
        let x = i * barWidth;
        let h = map(data[i].temp, 0, maxTemp, 0, 400);
        let y = 400 - h;
        
        let isHovered = mouseX > 80 + x && mouseX < 80 + x + barWidth * 0.8 &&
                       mouseY > 60 + y && mouseY < 460;
        
        if (isHovered) {
            fill(255, 165, 0);
            rect(x, y, barWidth * 0.8, h);
            
            fill(0);
            textAlign(CENTER);
            textSize(14);
            text(data[i].temp.toFixed(1) + "°F", x + barWidth * 0.4, y - 10);
        } else {
            fill(70, 130, 180);
            rect(x, y, barWidth * 0.8, h);
        }
    }
}

function mouseMoved() {
    redraw();
}