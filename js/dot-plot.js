// Dot Plot is used for Monthly Total Precipitation

// Dimensions
const margin = {top: 40, right: 30, bottom: 80, left: 70};
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#dot-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse precipitation data by month
function loadData(rawData) {
    rawData.forEach(d => {
        d.month = d["Date.Month"];
        d.precip = parseFloat(d["Data.Precipitation"]);
    });
    return rawData.filter(d => d.month && !isNaN(d.precip));
}

// Calculate total precipitation per month
function calculateMonthlyTotal(validData) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyTotal = {};
    for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString();
        const monthData = validData.filter(d => d.month === monthStr);
        if (monthData.length > 0) {
            monthlyTotal[monthNames[i-1]] = d3.sum(monthData, d => d.precip);
        }
    }
    
    return Object.entries(monthlyTotal).map(([month, precip]) => ({
        month: month,
        precip: precip
    }));
}

// Create scales
function createScales(data) {
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLog()
        .domain([0.1, d3.max(data, d => d.precip)])
        .range([height, 0]);
    
    return {x, y};
}

// Add axes
function drawAxes(scales) {
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(scales.x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    svg.append("g")
        .call(d3.axisLeft(scales.y));
}

// Add labels
function addLabels() {
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 65)
        .attr("text-anchor", "middle")
        .text("Month");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Total Precipitation (inches)");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Monthly Total Precipitation");
}

// Draw dots
function drawDots(data, scales) {
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => scales.x(d.month) + scales.x.bandwidth() / 2)
        .attr("cy", d => scales.y(d.precip))
        .attr("r", 6)
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            showTooltip(d, scales);
        })
        .on("mouseout", function() {
            hideTooltip();
        });
}

function showTooltip(d, scales) {
    d3.select(event.currentTarget).attr("fill", "orange").attr("r", 8);
    
    svg.append("text")
        .attr("class", "tooltip")
        .attr("x", scales.x(d.month) + scales.x.bandwidth() / 2)
        .attr("y", scales.y(d.precip) - 15)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .text(d.precip.toFixed(2) + " in");
}

function hideTooltip() {
    d3.select(event.currentTarget).attr("fill", "steelblue").attr("r", 6);
    svg.selectAll(".tooltip").remove();
}

d3.csv("weather.csv").then(rawData => {
    const validData = loadData(rawData);
    const data = calculateMonthlyTotal(validData);
    const scales = createScales(data);
    
    drawAxes(scales);
    addLabels();
    drawDots(data, scales);
});

// SOURCES BELOW:

//D3.js Official Documentation
// https://d3js.org/
// For learning D3 syntax, scales, axes, and data binding


// D3 Graph Gallery
// https://d3-graph-gallery.com/
// Examples of bar charts, scatter plots, and heatmaps


// Observable D3 Tutorials
// https://observablehq.com/@d3/learn-d3
// Interactive D3 learning resources