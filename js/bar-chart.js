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

d3.csv("weather.csv").then(rawData => {
    
    // Parse temperature data by month
    rawData.forEach(d => {
        d.month = d["Date.Month"];
        d.temp = parseFloat(d["Data.Temperature.Avg Temp"]);
    });
    
    const validData = rawData.filter(d => d.month && !isNaN(d.temp));
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Calculate average temperature per month
    const monthlyAvg = {};
    for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString();
        const monthData = validData.filter(d => d.month === monthStr);
        if (monthData.length > 0) {
            monthlyAvg[monthNames[i-1]] = d3.mean(monthData, d => d.temp);
        }
    }
    
    const data = Object.entries(monthlyAvg).map(([month, temp]) => ({
        month: month,
        temp: temp
    }));
    
    // Create scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.temp) * 1.1])
        .range([height, 0]);
    
    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // Add labels
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
    
    // Draw bars
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.temp))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.temp))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange");
            
            svg.append("text")
                .attr("class", "tooltip")
                .attr("x", x(d.month) + x.bandwidth() / 2)
                .attr("y", y(d.temp) - 10)
                .attr("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("font-size", "14px")
                .text(d.temp.toFixed(1) + "°F");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "steelblue");
            svg.selectAll(".tooltip").remove();
        });
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