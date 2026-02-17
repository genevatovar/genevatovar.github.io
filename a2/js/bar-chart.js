// Bar Chart is used for Average Monthly Temperature

// Dimensions
const margin = {top: 40, right: 30, bottom: 80, left: 70};
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse temperature data by month
function loadData(rawData) {
    rawData.forEach(d => {
        d.month = d["Date.Month"];
        d.temp = parseFloat(d["Data.Temperature.Avg Temp"]);
    });
    return rawData.filter(d => d.month && !isNaN(d.temp));
}

// Calculate average temperature per month
function calculateMonthlyAverage(validData) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyAvg = {};
    for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString();
        const monthData = validData.filter(d => d.month === monthStr);
        if (monthData.length > 0) {
            monthlyAvg[monthNames[i-1]] = d3.mean(monthData, d => d.temp);
        }
    }
    
    return Object.entries(monthlyAvg).map(([month, temp]) => ({
        month: month,
        temp: temp
    }));
}

// Create scales
function createScales(data) {
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.temp) * 1.1])
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
        .text("Avg Temperature (°F)");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average Monthly Temperature");
}

// Draw bars
function drawBars(data, scales) {
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => scales.x(d.month))
        .attr("y", d => scales.y(d.temp))
        .attr("width", scales.x.bandwidth())
        .attr("height", d => height - scales.y(d.temp))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            showTooltip(d, scales);
        })
        .on("mouseout", function() {
            hideTooltip();
        });
}

function showTooltip(d, scales) {
    d3.select(event.currentTarget).attr("fill", "orange");
    
    svg.append("text")
        .attr("class", "tooltip")
        .attr("x", scales.x(d.month) + scales.x.bandwidth() / 2)
        .attr("y", scales.y(d.temp) - 10)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .text(d.temp.toFixed(1) + "°F");
}

function hideTooltip() {
    d3.select(event.currentTarget).attr("fill", "steelblue");
    svg.selectAll(".tooltip").remove();
}

d3.csv("weather.csv").then(rawData => {
    const validData = loadData(rawData);
    const data = calculateMonthlyAverage(validData);
    const scales = createScales(data);
    
    drawAxes(scales);
    addLabels();
    drawBars(data, scales);
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