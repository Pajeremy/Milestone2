// Load Data
d3.csv("Combined_Income_Housing_CPI.csv").then(data => {
  data.forEach(d => {
    d.observation_date = new Date(d.observation_date);
    for (let key in d) {
      if (key !== "observation_date") {
        d[key] = +d[key];
      }
    }
  });

  // constants
  const regions = ["US", "Midwest", "Northeast", "South", "West"];
  const colors = {
    US: "#1f77b4", Midwest: "#ff7f0e", Northeast: "#2ca02c", South: "#d62728", West: "#9467bd"
  };
  const metrics = ["Personal Income", "Family Income", "House Price"];

  // Add recession dates
  const recessions = [
    { start: new Date("1973-11-01"), end: new Date("1975-03-01"), name: "1973-1975 Recession" },
    { start: new Date("1980-01-01"), end: new Date("1980-07-01"), name: "1980 Recession" },
    { start: new Date("1981-07-01"), end: new Date("1982-11-01"), name: "1981-1982 Recession" },
    { start: new Date("1990-07-01"), end: new Date("1991-03-01"), name: "1990-1991 Recession" },
    { start: new Date("2001-03-01"), end: new Date("2001-11-01"), name: "Dot-com Recession" },
    { start: new Date("2007-12-01"), end: new Date("2009-06-01"), name: "Great Recession" },
    { start: new Date("2020-02-01"), end: new Date("2020-04-01"), name: "COVID-19 Recession" }
  ];

  const baseCPI = 300.46; // Latest CPI All Urban Consumers value
  const adjustCheckbox = document.getElementById("adjustInflation");

  // Create region filters for each chart
  function createRegionFilters(chartId, title, isMainChart = false) {
    const container = document.createElement("div");
    container.className = "chart-container";
    
    const header = document.createElement("div");
    header.className = "chart-header";
    
    const titleElem = document.createElement("h3");
    titleElem.textContent = title;
    header.appendChild(titleElem);
    
    // Only add region filters for individual charts
    if (!isMainChart) {
      const filterContainer = document.createElement("div");
      filterContainer.className = "region-filters";
      
      regions.forEach(region => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = region;
        checkbox.checked = true;
        checkbox.className = `region-check-${chartId.replace("#", "")}`;
        label.appendChild(checkbox);
        const text = document.createElement("span");
        text.style.color = colors[region];
        text.textContent = ` ${region}`;
        label.appendChild(text);
        filterContainer.appendChild(label);
      });
      
      header.appendChild(filterContainer);
    }

    // Add metric checkboxes only to the main chart
    if (isMainChart) {
      const metricContainer = document.createElement("div");
      metricContainer.className = "metric-checkboxes";
      metrics.forEach(metric => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = metric;
        checkbox.checked = true;
        checkbox.className = "metric-check";
        label.appendChild(checkbox);
        const text = document.createElement("span");
        text.style.color = metric === "House Price" ? "#000" : 
                          metric === "Family Income" ? "#666" : "#333";
        text.textContent = ` ${metric}`;
        label.appendChild(text);
        metricContainer.appendChild(label);
      });
      header.appendChild(metricContainer);
    }
    
    container.appendChild(header);
    
    const chartDiv = document.createElement("div");
    chartDiv.id = chartId.replace("#", "");
    chartDiv.className = "chart";
    container.appendChild(chartDiv);
    
    return container;
  }

  // Setup chart containers with individual filters
  const chartGrid = document.createElement("div");
  chartGrid.className = "chart-grid";
  
  const dashboardContainer = document.createElement("div");
  dashboardContainer.className = "dashboard-container";

  // Create stats container
  const statsContainer = document.createElement("div");
  statsContainer.className = "stats-container";

  // Add both containers to the dashboard
  dashboardContainer.appendChild(chartGrid);
  dashboardContainer.appendChild(statsContainer);

  const charts = [
    { id: "#incomeHousingChart", title: "Economic Trends by Region & Metric", isMain: true },
    { id: "#personalIncomeChart", title: "Personal Income Trends" },
    { id: "#familyIncomeChart", title: "Family Income Trends" },
    { id: "#housingChart", title: "House Price Trends" }
  ];
  
  charts.forEach(chart => {
    chartGrid.appendChild(createRegionFilters(chart.id, chart.title, chart.isMain));
  });

  const existingGrid = document.querySelector(".chart-grid");
  if (existingGrid) {
    existingGrid.replaceWith(dashboardContainer);
  } else {
    document.body.appendChild(dashboardContainer);
  }

  // Data Access 
  function getSelectedRegions(chartId) {
    return Array.from(document.querySelectorAll(`.region-check-${chartId}`))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }

  function getSelectedMetrics() {
    return Array.from(document.querySelectorAll(".metric-check:checked")).map(cb => cb.value);
  }

  function getAdjustedValue(value, cpi, adjust) {
    return adjust && cpi > 0 ? value * (cpi / baseCPI) : value;
  }

  function getMetricValue(d, region, type) {
    if (type === "Personal Income") return d[`Mean Personal Income ${region}`];
    if (type === "Family Income") return d[`Mean Family Income ${region}`];
    if (type === "House Price") return d[`Average Sale Price ${region}`];
    return 0;
  }

  function getCPI(d) {
    return d["Consumer Price Index All Urban Consumers"] || 1;
  }

  // Preset Time Entries
  function applyPresetRange(value) {
    const startInput = document.getElementById("startDate");
    const endInput = document.getElementById("endDate");

    let startDate, endDate;

    switch(value) {
      // All Time
      case "all-time":
        startDate = "1975-01-01";
        endDate = "2023-01-01";
        break;
      // Recessions
      case "1973-1975":
        startDate = "1965-01-01";
        endDate = "1985-12-31";
        break;
      case "1980":
        startDate = "1970-01-01";
        endDate = "1990-12-31";
        break;
      case "1981-1982":
        startDate = "1971-01-01";
        endDate = "1992-12-31";
        break;
      case "1990-1991":
        startDate = "1980-01-01";
        endDate = "2000-12-31";
        break;
      case "2001":
        startDate = "1991-01-01";
        endDate = "2011-12-31";
        break;
      case "2008":
        startDate = "1998-01-01";
        endDate = "2018-12-31";
        break;
      case "2020":
        startDate = "2010-01-01";
        endDate = "2023-12-31";
        break;
      case "1970s":
        startDate = "1970-01-01";
        endDate = "1980-12-31";
        break;
      case "1980s":
        startDate = "1980-01-01";
        endDate = "1990-12-31";
        break;
      case "1990s":
        startDate = "1990-01-01";
        endDate = "2000-12-31";
        break;
      case "2000s":
        startDate = "2000-01-01";
        endDate = "2010-12-31";
        break;
      case "2010s":
        startDate = "2010-01-01";
        endDate = "2020-12-31";
        break;
      default:
        return;
    }

    startInput.value = startDate;
    endInput.value = endDate;
    filterData();
  }

  //Calculate funtion to show change
  function calculatePercentageChange(data, metric, region,adjust) {
    if (data.length < 2) return 0;
    
    const startValue = getAdjustedValue(
      getMetricValue(data[0], region, metric),
      getCPI(data[0], ),
      adjust
    );
    
    const endValue = getAdjustedValue(
      getMetricValue(data[data.length - 1], region, metric),
      getCPI(data[data.length - 1], ),
      adjust
    );
    
    return ((endValue - startValue) / startValue) * 100;
  }

  //dynamically adjust graphs
  function updateStatsDisplay(data, selectedMetrics,adjust) {
    const metrics = ["Personal Income", "Family Income", "House Price"];
    const statsContainer = document.querySelector('.stats-container');
    
    // Clear existing stats
    statsContainer.innerHTML = '';
    
    metrics.forEach(metric => {
      // Only create box if metric is selected
      if (!selectedMetrics.includes(metric)) return;

      const statBox = document.createElement('div');
      statBox.className = 'stat-box';
      
      const title = document.createElement('h3');
      title.textContent = `${metric} Change`;
      statBox.appendChild(title);
      
      // Get regions selected for this specific metric
      const selectedRegions = getSelectedRegionsForMetric(metric);
      
      if (selectedRegions.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'stat-value';
        noDataDiv.textContent = 'No regions selected';
        noDataDiv.style.color = '#666';
        statBox.appendChild(noDataDiv);
      } else {
        selectedRegions.forEach(region => {
          const change = calculatePercentageChange(data, metric, region, adjust);
          const valueDiv = document.createElement('div');
          valueDiv.className = 'stat-value';
          valueDiv.classList.add(change >= 0 ? 'positive-change' : 'negative-change');
          
          const formattedChange = change.toFixed(1);
          valueDiv.innerHTML = `${region}: ${formattedChange}%`;
          valueDiv.style.color = colors[region];
          statBox.appendChild(valueDiv);
        });
      }
      
      statsContainer.appendChild(statBox);
    });
  }

  function getSelectedRegionsForMetric(metric) {
    let chartId;
    switch(metric) {
      case "Personal Income":
        chartId = "personalIncomeChart";
        break;
      case "Family Income":
        chartId = "familyIncomeChart";
        break;
      case "House Price":
        chartId = "housingChart";
        break;
      default:
        return [];
    }
    // Only return regions if the metric is selected
    const selectedMetrics = getSelectedMetrics();
    if (!selectedMetrics.includes(metric)) {
      return [];
    }
    return getSelectedRegions(chartId);
  }

  function filterData() {
    const selectedMetrics = getSelectedMetrics();
    const adjust = adjustCheckbox.checked;
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);

    const filtered = data.filter(d => d.observation_date >= startDate && d.observation_date <= endDate);

    // Get combined selected regions from individual charts
    const combinedRegions = new Set();
    selectedMetrics.forEach(metric => {
      getSelectedRegionsForMetric(metric).forEach(region => combinedRegions.add(region));
    });

    // Draw main chart with combined selections
    drawLineChart(filtered, Array.from(combinedRegions), selectedMetrics,adjust);

    // Draw individual charts
    if (selectedMetrics.includes("Personal Income")) {
      drawCategoryChart(filtered, getSelectedRegions("personalIncomeChart"), adjust, "Personal Income", "personalIncomeChart");
    }
    if (selectedMetrics.includes("Family Income")) {
      drawCategoryChart(filtered, getSelectedRegions("familyIncomeChart"), adjust, "Family Income", "familyIncomeChart");
    }
    if (selectedMetrics.includes("House Price")) {
      drawCategoryChart(filtered, getSelectedRegions("housingChart"), adjust, "House Price", "housingChart");
    }

    // Update percentage change stats with selected metrics
    updateStatsDisplay(filtered, selectedMetrics, adjust);
  }

  function createTooltip(chartId) {
    const container = d3.select(chartId);
    container.selectAll(".tooltip").remove(); // Remove any existing tooltip
    const tooltip = container.append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none");
    return tooltip;
  }

  function formatValue(value) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function updateTooltipPosition(tooltip, xPos, container, margin) {
    const containerBounds = container.node().getBoundingClientRect();
    const tooltipBounds = tooltip.node().getBoundingClientRect();
    
    // Calculate the center position of the tooltip
    let left = xPos + margin.left;
    let top = margin.top;
    
    // Adjust horizontal position to keep tooltip within container
    if (left + tooltipBounds.width > containerBounds.width) {
      // If tooltip would overflow right, position it to the left of the cursor
      left = xPos + margin.left - tooltipBounds.width;
    }
    if (left < margin.left) {
      // If tooltip would overflow left, position it at the left margin
      left = margin.left;
    }
    
    // Adjust vertical position to keep tooltip above the chart
    if (top - tooltipBounds.height < 0) {
      // If tooltip would overflow top, position it below the chart
      top = margin.top + containerBounds.height;
    }
    
    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  // Function to add recession backgrounds to a chart
  function addRecessionBackgrounds(svg, x, width, height) {
    const showRecessions = document.getElementById("showRecessions").checked;
    
    // Remove any existing recession backgrounds
    svg.selectAll(".recession-background").remove();
    
    if (!showRecessions) return;

    // Get the visible time range
    const timeRange = x.domain();
    const startDate = timeRange[0];
    const endDate = timeRange[1];

    // Filter recessions to only those that overlap with the visible range
    const visibleRecessions = recessions.filter(recession => {
      return !(recession.end < startDate || recession.start > endDate);
    });

    // Add recession backgrounds
    const recessionGroups = svg.selectAll(".recession-background")
      .data(visibleRecessions)
      .enter()
      .append("g")
      .attr("class", "recession-background");

    // Add the gray background rectangles
    recessionGroups.append("rect")
      .attr("x", d => Math.max(x(d.start), x(startDate))) // Don't extend beyond chart bounds
      .attr("width", d => {
        const rectStart = Math.max(x(d.start), x(startDate));
        const rectEnd = Math.min(x(d.end), x(endDate));
        return rectEnd - rectStart;
      })
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "#f0f0f0")
      .attr("opacity", 0.5);

    // Add recession labels at the top
    recessionGroups.append("text")
      .attr("x", d => {
        const rectStart = Math.max(x(d.start), x(startDate));
        const rectEnd = Math.min(x(d.end), x(endDate));
        return rectStart + (rectEnd - rectStart) / 2;
      })
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text(d => d.name);
  }

  function drawCategoryChart(data, selectedRegions, adjust, metricType, elementId) {
    // Remove the '#' from elementId if it exists
    const chartId = elementId.startsWith('#') ? elementId : '#' + elementId;
    const container = d3.select(chartId);
    container.html("");

    const margin = { top: 20, right: 40, bottom: 30, left: 60 };
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.observation_date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(...selectedRegions.map(r =>
        getAdjustedValue(getMetricValue(d, r, metricType), getCPI(d, ), adjust)
      )))])
      .nice()
      .range([height, 0]);

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    const tooltip = createTooltip(chartId);
    
    const bisect = d3.bisector(d => d.observation_date).left;
    
    const tooltipLine = svg.append("line")
      .attr("class", "tooltip-line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0);

    // Create a group for the dots
    const tooltipDots = svg.append("g")
      .attr("class", "tooltip-dots")
      .style("opacity", 0);

    // Add recession backgrounds before drawing the lines
    addRecessionBackgrounds(svg, x, width, height);

    selectedRegions.forEach(region => {
      const line = d3.line()
        .x(d => x(d.observation_date))
        .y(d => y(getAdjustedValue(getMetricValue(d, region, metricType), getCPI(d, ), adjust)));

      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors[region])
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    function showTooltip(event, d) {
      tooltip.style("opacity", 1);
      tooltipLine.style("opacity", 1);
      tooltipDots.style("opacity", 1);
    }

    function hideTooltip() {
      tooltip.style("opacity", 0);
      tooltipLine.style("opacity", 0);
      tooltipDots.style("opacity", 0);
    }

    function moveTooltip(event) {
      const [mouseX] = d3.pointer(event);
      const x0 = x.invert(mouseX);
      const i = bisect(data, x0, 1);
      if (i >= data.length) return; // Guard against array bounds
      const d0 = data[i - 1];
      const d1 = data[i];
      if (!d0 || !d1) return; // Guard against undefined data
      const d = x0 - d0.observation_date > d1.observation_date - x0 ? d1 : d0;
      
      const xPos = x(d.observation_date);
      tooltipLine.attr("x1", xPos)
        .attr("x2", xPos);

      // Update dots
      tooltipDots.selectAll(".tooltip-dot").remove();
      selectedRegions.forEach(region => {
        const value = getAdjustedValue(getMetricValue(d, region, metricType), getCPI(d, ), adjust);
        const yPos = y(value);
        
        tooltipDots.append("circle")
          .attr("class", "tooltip-dot")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("stroke", colors[region]);
      });
      
      let tooltipContent = `<strong>${d.observation_date.toLocaleDateString()}</strong><br/>`;
      selectedRegions.forEach(region => {
        const value = getAdjustedValue(getMetricValue(d, region, metricType), getCPI(d, ), adjust);
        tooltipContent += `<span style="color:${colors[region]}">${region}: ${formatValue(value)}</span><br/>`;
      });
      
      tooltip.html(tooltipContent);
      updateTooltipPosition(tooltip, xPos, container, margin);
    }

    const overlay = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .on("mousemove", moveTooltip);
  }

  function drawLineChart(data, selectedRegions, selectedMetrics, adjust) {
    const container = d3.select("#incomeHousingChart");
    container.html("");
  
    const margin = { top: 20, right: 40, bottom: 30, left: 60 };
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
  
    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.observation_date))
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(...selectedRegions.flatMap(r =>
        selectedMetrics.map(m => getAdjustedValue(getMetricValue(d, r, m), getCPI(d), adjust))
      )))])
      .nice()
      .range([height, 0]);
  
    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  
    const tooltip = createTooltip("#incomeHousingChart");
    const bisect = d3.bisector(d => d.observation_date).left;
    
    const tooltipLine = svg.append("line")
      .attr("class", "tooltip-line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0);

    const tooltipDots = svg.append("g")
      .attr("class", "tooltip-dots")
      .style("opacity", 0);

    // Add recession backgrounds before drawing the lines
    addRecessionBackgrounds(svg, x, width, height);

    // Draw lines for each selected metric and its corresponding selected regions
    selectedMetrics.forEach(metric => {
      const regionsForMetric = getSelectedRegionsForMetric(metric);
      regionsForMetric.forEach(region => {
        const line = d3.line()
          .x(d => x(d.observation_date))
          .y(d => y(getAdjustedValue(getMetricValue(d, region, metric), getCPI(d), adjust)));
  
        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colors[region])
          .attr("stroke-width", metric === "House Price" ? 2 : 1.5)
          .attr("stroke-dasharray", metric === "Family Income" ? "4 2" : (metric === "House Price" ? "none" : "2 2"))
          .attr("d", line)
          .attr("class", `line-${metric.replace(/\s+/g, '-')}-${region}`);
      });
    });

    function showTooltip(event, d) {
      tooltip.style("opacity", 1);
      tooltipLine.style("opacity", 1);
      tooltipDots.style("opacity", 1);
    }

    function hideTooltip() {
      tooltip.style("opacity", 0);
      tooltipLine.style("opacity", 0);
      tooltipDots.style("opacity", 0);
    }

    function moveTooltip(event) {
      const [mouseX] = d3.pointer(event);
      const x0 = x.invert(mouseX);
      const i = bisect(data, x0, 1);
      if (i >= data.length) return;
      const d0 = data[i - 1];
      const d1 = data[i];
      if (!d0 || !d1) return;
      const d = x0 - d0.observation_date > d1.observation_date - x0 ? d1 : d0;
      
      const xPos = x(d.observation_date);
      tooltipLine.attr("x1", xPos)
        .attr("x2", xPos);

      // Update dots
      tooltipDots.selectAll(".tooltip-dot").remove();
      selectedMetrics.forEach(metric => {
        const regionsForMetric = getSelectedRegionsForMetric(metric);
        regionsForMetric.forEach(region => {
          const value = getAdjustedValue(getMetricValue(d, region, metric), getCPI(d), adjust);
          const yPos = y(value);
          
          tooltipDots.append("circle")
            .attr("class", "tooltip-dot")
            .attr("cx", xPos)
            .attr("cy", yPos)
            .attr("stroke", colors[region]);
        });
      });
      
      let tooltipContent = `<strong>${d.observation_date.toLocaleDateString()}</strong><br/>`;
      selectedMetrics.forEach(metric => {
        const regionsForMetric = getSelectedRegionsForMetric(metric);
        regionsForMetric.forEach(region => {
          const value = getAdjustedValue(getMetricValue(d, region, metric), getCPI(d), adjust);
          tooltipContent += `<span style="color:${colors[region]}">${region} - ${metric}: ${formatValue(value)}</span><br/>`;
        });
      });
      
      tooltip.html(tooltipContent);
      updateTooltipPosition(tooltip, xPos, container, margin);
    }

    const overlay = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .on("mousemove", moveTooltip);
  }

  // Update event listeners
  document.getElementById("startDate").addEventListener("change", filterData);
  document.getElementById("endDate").addEventListener("change", filterData);
  document.getElementById("presetRange").addEventListener("change", e => applyPresetRange(e.target.value));
  adjustCheckbox.addEventListener("change", filterData);
  document.getElementById("showRecessions").addEventListener("change", filterData);
  document.addEventListener("change", e => {
    if (e.target.className.startsWith("region-check-") || e.target.classList.contains("metric-check")) {
      filterData();
    }
  });

  // Add window resize handler
  window.addEventListener('resize', debounce(filterData, 250));

  // Debounce function to prevent too many resize events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initial render
  filterData();
});
