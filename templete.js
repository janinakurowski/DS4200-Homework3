const socialMedia = d3.csv("socialMedia.csv");

socialMedia.then(function (data) {
  data.forEach(function (d) {
    d.Likes = +d.Likes;
  });

  // Boxplot
  d3.csv("socialMedia.csv").then(function (data) {
    data.forEach(d => d.Likes = +d.Likes);

    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 900, height = 420;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#boxplot").append("svg")
      .attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const groups = [...new Set(data.map(d => d.AgeGroup))];

    const x = d3.scaleBand().domain(groups).range([0, innerW]).padding(0.25);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Likes)]).nice()
      .range([innerH, 0]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle")
      .text("Likes distribution by Age Group");
    svg.append("text")
      .attr("x", width / 2).attr("y", height - 12).attr("text-anchor", "middle")
      .text("Age Group");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2).attr("y", 16)
      .attr("text-anchor", "middle").style("font-weight", "600")
      .text("Likes");

    const rollupFn = groupData => {
      const values = groupData.map(d => d.Likes).sort(d3.ascending);
      const minAll = d3.min(values);
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.50);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const min = Math.max(minAll, q1 - 1.5 * iqr);
      const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
      return { min, q1, median, q3, max };
    };

    const stats = d3.rollup(data, rollupFn, d => d.AgeGroup);
    const boxW = x.bandwidth() * 0.6;

    for (const [age, q] of stats) {
      const cx = x(age) + x.bandwidth() / 2;

      g.append("line")
        .attr("x1", cx).attr("x2", cx)
        .attr("y1", y(q.min)).attr("y2", y(q.max))
        .attr("stroke", "currentColor");

      g.append("rect")
        .attr("x", cx - boxW / 2)
        .attr("y", y(q.q3))
        .attr("width", boxW)
        .attr("height", Math.max(1, y(q.q1) - y(q.q3)))
        .attr("fill", "#7aa2ff")
        .attr("opacity", 0.35)
        .attr("stroke", "currentColor");

      g.append("line")
        .attr("x1", cx - boxW / 2).attr("x2", cx + boxW / 2)
        .attr("y1", y(q.median)).attr("y2", y(q.median))
        .attr("stroke", "#7aa2ff").attr("stroke-width", 2);
    }
  });

  // Grouped bar chart
  d3.csv("socialMediaAvg.csv").then(function (data) {
    data.forEach(d => d.AvgLikes = +d.AvgLikes);

    const margin = { top: 40, right: 160, bottom: 60, left: 60 };
    const width = 900, height = 420;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#barplot").append("svg")
      .attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const platforms = [...new Set(data.map(d => d.Platform))];
    const types = [...new Set(data.map(d => d.PostType))];

    const x0 = d3.scaleBand().domain(platforms).range([0, innerW]).paddingInner(0.2);
    const x1 = d3.scaleBand().domain(types).range([0, x0.bandwidth()]).padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)]).nice()
      .range([innerH, 0]);

    const color = d3.scaleOrdinal().domain(types).range(["#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b"]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x0));
    g.append("g").call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2).attr("y", 22).attr("text-anchor", "middle")
      .text("Average likes by platform and post type");
    svg.append("text")
      .attr("x", width / 2).attr("y", height - 12).attr("text-anchor", "middle")
      .text("Platform");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2).attr("y", 16).attr("text-anchor", "middle")
      .style("font-weight", "600").text("Average likes");

    const byPlatform = d3.group(data, d => d.Platform);

    const groups = g.selectAll(".group")
      .data(platforms)
      .join("g")
      .attr("class", "group")
      .attr("transform", d => `translate(${x0(d)},0)`);

    groups.selectAll("rect")
      .data(p => (byPlatform.get(p) || []).map(d => ({ ...d, platform: p })))
      .join("rect")
      .attr("x", d => x1(d.PostType))
      .attr("y", d => y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d => innerH - y(d.AvgLikes))
      .attr("fill", d => color(d.PostType));

    const legend = svg.append("g").attr("transform", `translate(${width - 150}, ${margin.top})`);
    types.forEach((t, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(t));
      row.append("text").attr("x", 18).attr("y", 10).attr("alignment-baseline", "middle").text(t);
    });
  });


  // Line chart
  d3.csv("socialMediaTime.csv").then(function (data) {

    data.forEach(d => d.AvgLikes = +d.AvgLikes);

    const parseMD = d3.timeParse("%m/%d");
    const parseYMD = d3.timeParse("%Y-%m-%d");
    data.forEach(d => {
      let dt = parseMD(d.Date) || parseYMD(d.Date);
      if (!dt && /^\d{1,2}\/\d{1,2}$/.test(d.Date)) {

        const [m, da] = d.Date.split("/");
        dt = new Date(new Date().getFullYear(), +m - 1, +da);
      }
      d._date = dt || d.Date; // fall back to string
    });

    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 900, height = 420;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#lineplot").append("svg")
      .attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const isTime = data.every(d => d._date instanceof Date);
    const x = isTime
      ? d3.scaleTime().domain(d3.extent(data, d => d._date)).range([0, innerW])
      : d3.scalePoint().domain(data.map(d => d.Date)).range([0, innerW]).padding(0.5);

    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.AvgLikes)]).nice().range([innerH, 0]);

    const xAxis = isTime ? d3.axisBottom(x).ticks(data.length) : d3.axisBottom(x);
    g.append("g").attr("transform", `translate(0,${innerH})`).call(xAxis)
      .selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2).attr("y", 22).attr("text-anchor", "middle")
      .text("Average likes over time");
    svg.append("text")
      .attr("x", width / 2).attr("y", height - 12).attr("text-anchor", "middle")
      .text("Date");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2).attr("y", 16).attr("text-anchor", "middle")
      .style("font-weight", "600").text("Average likes");

    const line = d3.line()
      .defined(d => d.AvgLikes != null)
      .x(d => isTime ? x(d._date) : x(d.Date))
      .y(d => y(d.AvgLikes))
      .curve(d3.curveNatural);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#7aa2ff")
      .attr("stroke-width", 2)
      .attr("d", line);
  });
})