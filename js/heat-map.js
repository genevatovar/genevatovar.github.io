// Heatmap is used for Temperature by Month x Year

//Dimensions
const margin = {top: 100, right: 30, bottom: 60, left: 100};
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("weather.csv").then(rawData => {
    
    // Parse temperature data by month and week
    rawData.forEach(d => {
        d.month = d["Date.Month"];
        d.week = d["Date.Week of"];
        d.temp = parseFloat(d["Data.Temperature.Avg Temp"]);
    });
    
    const validData = rawData.filter(d => d.month && d.week && !isNaN(d.temp));
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const weeks = [...new Set(validData.map(d => d.week))].sort((a, b) => parseInt(a) - parseInt(b));
    const weekLabels = weeks.slice(0, 7).map(w => `Week ${w}`);
    
    // Organize data by month and week
    const heatmapData = [];
    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString();
        weekLabels.forEach((weekLabel, idx) => {
            const weekStr = weeks[idx];
            const cellData = validData.filter(d => 
                d.month === monthStr && d.week === weekStr
            );
            
            if (cellData.length > 0) {
                heatmapData.push({
                    month: monthNames[m-1],
                    week: weekLabel,
                    temp: d3.mean(cellData, d => d.temp)
                });
            }
        });
    }
    
    // Create scales
    const x = d3.scaleBand()
        .domain(monthNames)
        .range([0, width])
        .padding(0.05);
    
    const y = d3.scaleBand()
        .domain(weekLabels)
        .range([0, height])
        .padding(0.05);
    
    const color = d3.scaleSequential()
        .interpolator(d3.interpolateRdYlBu)
        .domain([d3.max(heatmapData, d => d.temp), d3.min(heatmapData, d => d.temp)]);
    
    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // Add labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Month");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -70)
        .attr("text-anchor", "middle")
        .text("Week of Year");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -70)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Temperature by Month and Week");
    
    // Draw heatmap cells
    svg.selectAll("rect")
        .data(heatmapData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.week))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.temp))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 3);
            
            svg.append("text")
                .attr("class", "tooltip")
                .attr("x", x(d.month) + x.bandwidth() / 2)
                .attr("y", y(d.week) + y.bandwidth() / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-weight", "bold")
                .style("font-size", "12px")
                .style("fill", "black")
                .style("pointer-events", "none")
                .text(d.temp.toFixed(1) + "°F");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
            svg.selectAll(".tooltip").remove();
        });
    
    // Add color legend
    const legendWidth = 300;
    const legendHeight = 15;
    
    const legendScale = d3.scaleLinear()
        .domain(color.domain())
        .range([0, legendWidth]);
    
    const legend = svg.append("g")
        .attr("transform", `translate(${width/2 - legendWidth/2}, ${-50})`);
    
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");
    
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
        const offset = i / numStops;
        gradient.append("stop")
            .attr("offset", `${offset * 100}%`)
            .attr("stop-color", color(legendScale.invert(offset * legendWidth)));
    }
    
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
    
    legend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d => d.toFixed(0) + "°F"));
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