// Bar Chart: Average Song Hotttnesss by Year
  // Sequential color scale: color encodes the Y value (avg hotttnesss)
  // Using ColorBrewer YlOrRd sequential palette via d3-scale-chromatic

  function drawGraph(data) {
    const width = 900, height = 500;
    const margin = { top: 60, right: 200, bottom: 80, left: 80 };
    const plot_width  = width  - margin.left - margin.right;
    const plot_height = height - margin.top  - margin.bottom;

    const canvas = d3.select("#a6-barchart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const plot = canvas.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Average hotttnesss per year
    const byYear = d3.rollup(
      data,
      v => d3.mean(v, d => d.hotttnesss),
      d => d.year
    );
    const barData = Array.from(byYear, ([year, avg]) => ({ year, avg }))
      .sort((a, b) => a.year - b.year);

    // SCALES
    const xScale = d3.scaleBand()
      .domain(barData.map(d => d.year))
      .range([0, plot_width])
      .padding(0.2);

    const yMax = d3.max(barData, d => d.avg);
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([plot_height, 0]);

    // SEQUENTIAL color scale (ColorBrewer YlOrRd)
    const colorScale = d3.scaleSequential()
      .domain([0, yMax])
      .interpolator(d3.interpolateYlOrRd);

    // GRIDLINES
    plot.append("g")
      .selectAll("line")
      .data(yScale.ticks())
      .join("line")
      .attr("x1", 0).attr("x2", plot_width)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .style("stroke", "#ccc").style("stroke-width", 0.5)
      .style("stroke-dasharray", "3,3");

    // BARS
    const bars = plot.selectAll(".bar")
      .data(barData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.avg))
      .attr("width", xScale.bandwidth())
      .attr("height", d => plot_height - yScale(d.avg))
      .style("fill", d => colorScale(d.avg));

    // AXES
    const xTick = barData.length > 30
      ? barData.filter((_, i) => i % 5 === 0).map(d => d.year)
      : barData.map(d => d.year);

    plot.append("g")
      .attr("transform", `translate(0,${plot_height})`)
      .call(d3.axisBottom(xScale)
        .tickValues(xTick)
        .tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    plot.append("g").call(d3.axisLeft(yScale));

    // AXIS LABELS
    plot.append("text").attr("class","axisLabel")
      .attr("x", plot_width / 2).attr("y", plot_height + 65)
      .attr("text-anchor","middle").text("Year");

    plot.append("text").attr("class","axisLabel")
      .attr("transform","rotate(-90)")
      .attr("x", -plot_height / 2).attr("y", -55)
      .attr("text-anchor","middle").text("Avg Song Hotttnesss");

    // TITLE
    plot.append("text")
      .attr("x", plot_width / 2).attr("y", -25)
      .attr("text-anchor","middle")
      .style("font-size","16px").style("font-weight","bold")
      .text("Average Song Hotttnesss by Year");

    // D3-LEGEND (Susie Lu) — continuous sequential legend
    const legendScale = d3.scaleSequential()
      .domain([0, yMax])
      .interpolator(d3.interpolateYlOrRd);

    const legendG = canvas.append("g")
      .attr("transform", `translate(${margin.left + plot_width + 20}, ${margin.top + 20})`);

    legendG.append("text")
      .attr("x", 0).attr("y", -8)
      .style("font-size","12px").style("font-weight","bold")
      .text("Avg Hotttnesss");

    const legend = d3.legendColor()
      .shapeWidth(20)
      .cells(6)
      .orient("vertical")
      .scale(legendScale)
      .labelFormat(d3.format(".2f"))
      .title("Avg Hotttnesss");

    legendG.call(legend);

    // TOOLTIP
    const tooltip = d3.select("body").append("div").attr("class","tooltip");

    bars
      .on("mouseover", (e, d) => {
        d3.select(e.currentTarget).style("opacity", 0.8);
        tooltip.style("opacity", 0.95)
          .html(`<strong>${d.year}</strong><br/>Avg Hotttnesss: ${d.avg.toFixed(3)}`)
          .style("left", e.pageX + 12 + "px").style("top", e.pageY - 28 + "px");
      })
      .on("mouseout", (e) => {
        d3.select(e.currentTarget).style("opacity", 1);
        tooltip.style("opacity", 0);
      });
  }

  function draw() {
    d3.csv("music_small.csv").then(data => {
      data.forEach(d => {
        d.year       = +d["song.year"];
        d.hotttnesss = +d["song.hotttnesss"];
      });
      const valid = data.filter(d => d.year > 0 && !isNaN(d.hotttnesss) && d.hotttnesss > 0);
      drawGraph(valid);
    }).catch(err => console.error(err));
  }
  draw();