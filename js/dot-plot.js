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

d3.csv("weather.csv").then(rawData => {
    
    // Parse precipitation data by month
    rawData.forEach(d => {
        d.month = d["Date.Month"];
        d.precip = parseFloat(d["Data.Precipitation"]);
    });
    
    const validData = rawData.filter(d => d.month && !isNaN(d.precip));
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Calculate total precipitation per month
    const monthlyTotal = {};
    for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString();
        const monthData = validData.filter(d => d.month === monthStr);
        if (monthData.length > 0) {
            monthlyTotal[monthNames[i-1]] = d3.sum(monthData, d => d.precip);
        }
    }
    
    const data = Object.entries(monthlyTotal).map(([month, precip]) => ({
        month: month,
        precip: precip
    }));
    
    // Create scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLog()
        .domain([0.1, d3.max(data, d => d.precip)])
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
        .text("Total Precipitation (inches)");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Monthly Total Precipitation");
    
    // Draw dots
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.month) + x.bandwidth() / 2)
        .attr("cy", d => y(d.precip))
        .attr("r", 6)
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange").attr("r", 8);
            
            svg.append("text")
                .attr("class", "tooltip")
                .attr("x", x(d.month) + x.bandwidth() / 2)
                .attr("y", y(d.precip) - 15)
                .attr("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("font-size", "14px")
                .text(d.precip.toFixed(2) + " in");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "steelblue").attr("r", 6);
            svg.selectAll(".tooltip").remove();
        });
});