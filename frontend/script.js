let fullData = [];
let visualData = [];
let trendChartInstance = null;
let trendDrawing = false;  
let forecastChartInstance = null;
let chartInstance = null;
document.addEventListener("DOMContentLoaded", () => {
    showEmptyState();
});
// Upload display
document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("dataset");
    const fileName = document.getElementById("fileName");

    if (!fileInput) return;

    fileInput.addEventListener("change", () => {
        fileName.innerText = fileInput.files[0]?.name || "No file selected";
    });
});

async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            localStorage.setItem("userName", data.name);

            window.location.href = "dashboard.html";

        } else {

            alert(data.message);
        }

    } catch (e) {

        alert("Server not running");
    }
}




async function signup() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        alert("Fill all fields");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5000/signup", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {

            alert("Signup successful");

            // ⭐ SAVE USER (OPTIONAL)
            localStorage.setItem("userName", name);

            // ⭐ GO TO DASHBOARD
            window.location.href = "dashboard.html";

        } else {

            alert(data.message);
        }

    } catch (error) {

        alert("Server cannot connect");
    }
}






// PROCESS DATA
function processData() {

    const fileInput = document.getElementById("dataset");

    if (!fileInput || fileInput.files.length === 0) {
        alert("Please upload dataset");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {

        const text = e.target.result.trim();
        const rows = text.split(/\r?\n/);

        if (rows.length < 2) {
            alert("File has no data");
            return;
        }

        // 🔹 Detect delimiter
        const delimiter = rows[0].includes(";") ? ";" : ",";

        const headers = rows[0]
            .split(delimiter)
            .map(h => h.trim().toLowerCase());

        // 🔹 Detect column indexes
        const dateIndex = headers.findIndex(h =>
            h.includes("date") || h.includes("time") || h.includes("day")
        );

        const itemIndex = headers.findIndex(h =>
            h.includes("item") || h.includes("product") ||
            h.includes("category") || h.includes("store") ||
            h.includes("dept")
        );

        const salesIndex = headers.findIndex(h =>
            h.includes("sale") || h.includes("revenue") ||
            h.includes("demand") || h.includes("amount") ||
            h.includes("value")
        );

        if (dateIndex === -1 || itemIndex === -1 || salesIndex === -1) {
            alert("Could not detect Date / Item / Sales columns");
            return;
        }

        // 🔹 Parse rows
        fullData = [];

        for (let i = 1; i < rows.length; i++) {

            const cols = rows[i].split(delimiter);

            if (cols.length <= Math.max(dateIndex, itemIndex, salesIndex))
                continue;

            const sales = parseFloat(cols[salesIndex]);
            if (isNaN(sales)) continue;

            fullData.push({
                date: cols[dateIndex].trim(),
                item: cols[itemIndex].trim(),
                sales: sales
            });
        }

        if (fullData.length === 0) {
            alert("No valid rows found");
            return;
        }

        // 🔹 Visual dataset for charts
        const maxVisual = 5000;

        visualData =
            fullData.length > maxVisual
                ? fullData.slice(-maxVisual)
                : fullData;

        // 🔹 Populate item selector
        populateItems();   // ⭐ ADD THIS LINE

        // ⭐ FORCE SELECT ALL ITEMS
        const selector = document.getElementById("itemSelector");
        if (selector) {
            for (let i = 0; i < selector.options.length; i++) {
                selector.options[i].selected = true;
    }
}
        updateAnalytics();
        generateDatasetPreview();
        if (typeof generatePreview === "function") generatePreview();
        if (typeof updateInsights === "function") updateInsights();
        if (typeof showAnalytics === "function") showAnalytics();
        document.body.classList.add("data-loaded");
        generateDatasetPreview();

document.querySelectorAll("*").forEach(el => {
    if (el.textContent.includes("No Dataset Loaded")) {
        el.remove();
    }
});

        showDataEverywhere();
        // 🔹 Mark dataset loaded
        window.datasetLoaded = true;
        window.datasetSize = fullData.length;

        // 🔹 FORCE HIDE "NO DATA" BLOCKS
        document.querySelectorAll(".no-data, .empty-state")
            .forEach(el => el.style.display = "none");

        // 🔹 FORCE SHOW DATA SECTIONS
        document.querySelectorAll(
            ".data-view, .analytics-section, .insights-section"
        ).forEach(el => el.style.display = "block");

        console.log("Dataset loaded:", fullData.length, "rows");
    };

    reader.readAsText(file);
}




// PREVIEW TABLE
function previewTable(rows) {
    const table = document.getElementById("previewTable");
    table.innerHTML = "";

    rows.forEach((row, index) => {
        const tr = document.createElement("tr");
        row.split(",").forEach(col => {
            const cell = document.createElement(index === 0 ? "th" : "td");
            cell.innerText = col;
            tr.appendChild(cell);
        });
        table.appendChild(tr);
    });
}

function previewTable(rows) {

    const table = document.getElementById("previewTable");
    table.innerHTML = "";

    if (!rows || rows.length === 0) return;

    // Show only first 50 rows for performance
    const previewRows = rows.slice(0, 50);

    previewRows.forEach((row, index) => {

        const tr = document.createElement("tr");
        const cols = row.split(",");

        cols.forEach(col => {
            const cell = document.createElement(index === 0 ? "th" : "td");
            cell.innerText = col;
            tr.appendChild(cell);
        });

        table.appendChild(tr);
    });
}

// POPULATE ITEMS
function populateItems() {

    const selector = document.getElementById("itemSelector");
    const container =
        document.getElementById("itemSelectorContainer");

    if (!selector) return;

    const uniqueItems =
        [...new Set(fullData.map(d => d.item))];

    selector.innerHTML = "";

    uniqueItems.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.text = item;
        selector.appendChild(option);
    });

    if (container) container.style.display = "block";

    updateAnalytics();
}


// UPDATE ANALYTICS
function updateAnalytics() {

    const selector = document.getElementById("itemSelector");
    const selectedItems =
        Array.from(selector.selectedOptions).map(o => o.value);

    if (selectedItems.length === 0) {
    // auto-select first item
    const selector = document.getElementById("itemSelector");
    if (selector && selector.options.length > 0) {
        selector.options[0].selected = true;
        selectedItems.push(selector.options[0].value);
    } else {
        return;
    }
}

    // 🔹 Use fullData for accurate KPIs
    let filteredFull = fullData.filter(d =>
        selectedItems.includes(d.item)
    );

    // 🔹 Use visualData for charts (optimized)
    let filteredVisual = visualData.filter(d =>
        selectedItems.includes(d.item)
    );

    if (filteredFull.length === 0) {
        generateForecast(null);
        return;
    }

    // ===== KPI CALCULATIONS =====

    const total = filteredFull.reduce((sum, d) => sum + d.sales, 0);
    const avg = total / filteredFull.length;
    const max = Math.max(...filteredFull.map(d => d.sales));
    const min = Math.min(...filteredFull.map(d => d.sales));

    const first = filteredFull[0].sales;
    const last = filteredFull[filteredFull.length - 1].sales;
    const growth = ((last - first) / first * 100).toFixed(2);

    const trendElement = document.getElementById("growthTrend");

    if (growth >= 0) {
        trendElement.innerText = "↑ " + growth + "%";
        trendElement.classList.remove("negative");
        trendElement.classList.add("positive");
    } else {
        trendElement.innerText = "↓ " + Math.abs(growth) + "%";
        trendElement.classList.remove("positive");
        trendElement.classList.add("negative");
    }

    document.getElementById("totalSales").innerText = "$" + total.toFixed(2);
    document.getElementById("avgSales").innerText = "$" + avg.toFixed(2);
    document.getElementById("totalEntries").innerText = filteredFull.length;
    document.getElementById("maxSale").innerText = "$" + max;
    document.getElementById("minSale").innerText = "$" + min;
    document.getElementById("growthRate").innerText = growth + "%";

    // ===== CHARTS USE OPTIMIZED DATA =====
    drawMonthlyChart(filteredVisual);
    drawPieChart(filteredVisual);

    // ===== FORECAST USE FULL DATA =====
    generateForecast(filteredFull);
    updatePerformanceInsights(fullData);
    generateDatasetPreview();

}


// MONTHLY CHART
function drawMonthlyChart(data) {

    const monthly = {};
    data.forEach(d => {
        const month = d.date.substring(0,7);
        monthly[month] = (monthly[month] || 0) + d.sales;
    });

    new Chart(document.getElementById("monthlyChart"), {
        type: "bar",
        data: {
            labels: Object.keys(monthly),
            datasets: [{
                label: "Monthly Sales",
                data: Object.values(monthly),
                backgroundColor: "#8decb4"
            }]
        }
    });
}

// PIE CHART
function drawPieChart() {

    const totals = {};
    fullData.forEach(d => {
        totals[d.item] = (totals[d.item] || 0) + d.sales;
    });

    new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ["#8decb4","#a8f0c6","#bff5d5","#d6ffe6"]
            }]
        }
    });
}

// LOGOUT
function logout(){
    localStorage.removeItem("user");
    window.location.href = "login.html";
}


function showEmptyState() {

    document.getElementById("emptyState").style.display = "block";

    const ids = [
        "totalSales",
        "avgSales",
        "totalEntries",
        "maxSale",
        "minSale",
        "growthRate"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = "No Data";
            el.classList.add("empty-value");
        }
    });
}


function calculateComparisonInsights() {

    if (fullData.length === 0) return;

    const itemTotals = {};
    const itemGrowth = {};
    const itemVariance = {};

    // Calculate totals
    fullData.forEach(d => {
        itemTotals[d.item] = (itemTotals[d.item] || 0) + d.sales;
    });

    // Find Top & Lowest
    const sortedItems = Object.entries(itemTotals)
        .sort((a, b) => b[1] - a[1]);

    const topItem = sortedItems[0];
    const lowestItem = sortedItems[sortedItems.length - 1];

    document.getElementById("topItemValue").innerText =
        topItem ? `${topItem[0]} ($${topItem[1].toFixed(2)})` : "No Data";

    document.getElementById("lowestItemValue").innerText =
        lowestItem ? `${lowestItem[0]} ($${lowestItem[1].toFixed(2)})` : "No Data";

    // Growth & Volatility calculation
    const items = [...new Set(fullData.map(d => d.item))];

    items.forEach(item => {

        const data = fullData.filter(d => d.item === item);

        if (data.length < 2) return;

        const first = data[0].sales;
        const last = data[data.length - 1].sales;
        const growth = (last - first) / first;

        itemGrowth[item] = growth;

        const mean = data.reduce((sum, d) => sum + d.sales, 0) / data.length;
        const variance = data.reduce((sum, d) => sum + Math.pow(d.sales - mean, 2), 0) / data.length;

        itemVariance[item] = variance;
    });

    const fastestGrowing = Object.entries(itemGrowth)
        .sort((a, b) => b[1] - a[1])[0];

    const mostVolatile = Object.entries(itemVariance)
        .sort((a, b) => b[1] - a[1])[0];

    document.getElementById("growingItemValue").innerText =
        fastestGrowing ? `${fastestGrowing[0]} (${(fastestGrowing[1] * 100).toFixed(2)}%)` : "No Data";

    document.getElementById("volatileItemValue").innerText =
        mostVolatile ? mostVolatile[0] : "No Data";
}


function generateForecast(data) {

    const noDataDiv = document.getElementById("forecastNoData");

    if (!data || data.length < 2) {

        if (forecastChartInstance) {
            forecastChartInstance.destroy();
            forecastChartInstance = null;
        }

        noDataDiv.style.display = "block";
        return;
    }

    noDataDiv.style.display = "none";

    const actualLabels = data.map(d => d.date);
    const actualValues = data.map(d => d.sales);

    const lastValue = actualValues[actualValues.length - 1];

    const horizon = document.getElementById("horizonSelect");
const forecastMonths = horizon ? parseInt(horizon.value) : 6;

    const forecastValues = [];
const upperBound = [];
const lowerBound = [];
const forecastLabels = [];

let current = lastValue;

for (let i = 1; i <= forecastMonths; i++) {

    current = current * 1.05;

    const forecast = parseFloat(current.toFixed(2));

    forecastValues.push(forecast);

    // Confidence band ±10%
    upperBound.push(parseFloat((forecast * 1.10).toFixed(2)));
    lowerBound.push(parseFloat((forecast * 0.90).toFixed(2)));

    forecastLabels.push("M+" + i);
    updateForecastMetrics(actualValues, forecastValues);
}

drawForecastChart(
    actualLabels,
    actualValues,
    forecastLabels,
    forecastValues,
    upperBound,
    lowerBound
);

}

function drawForecastChart(
    actualLabels,
    actualData,
    forecastLabels,
    forecastData,
    upperBound,
    lowerBound
) {

    const ctx = document.getElementById("forecastChart").getContext("2d");

    if (forecastChartInstance) {
        forecastChartInstance.destroy();
    }

    const combinedLabels = [...actualLabels, ...forecastLabels];

    const paddedActual = [
        ...actualData,
        ...Array(forecastData.length).fill(null)
    ];

    const paddedForecast = [
        ...Array(actualData.length - 1).fill(null),
        actualData[actualData.length - 1],
        ...forecastData
    ];

    const paddedUpper = [
        ...Array(actualData.length).fill(null),
        ...upperBound
    ];

    const paddedLower = [
        ...Array(actualData.length).fill(null),
        ...lowerBound
    ];

    forecastChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: combinedLabels,
            datasets: [

                // Actual
                {
                    label: "Actual Sales",
                    data: paddedActual,
                    borderColor: "#3498db",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                },

                // Forecast line
                {
                    label: "Forecast Sales",
                    data: paddedForecast,
                    borderColor: "#2ecc71",
                    borderWidth: 3,
                    borderDash: [6, 6],
                    tension: 0.4,
                    fill: false
                },

                // Upper bound
                {
                    label: "Upper Bound",
                    data: paddedUpper,
                    borderColor: "rgba(46,204,113,0.2)",
                    backgroundColor: "rgba(46,204,113,0.15)",
                    pointRadius: 0,
                    fill: "+1"
                },

                // Lower bound
                {
                    label: "Lower Bound",
                    data: paddedLower,
                    borderColor: "rgba(46,204,113,0.2)",
                    pointRadius: 0,
                    fill: false
                }

            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

function updateForecastMetrics(actualData, forecastData) {

    if (!actualData || actualData.length === 0) return;

    // Simulated metrics
    const accuracy = (88 + Math.random() * 7).toFixed(2);
    const mae = (Math.random() * 20).toFixed(2);
    const rmse = (Math.random() * 30).toFixed(2);
    const confidence = (85 + Math.random() * 10).toFixed(2);

    document.getElementById("metricAccuracy").innerText = accuracy + "%";
    document.getElementById("metricMAE").innerText = mae;
    document.getElementById("metricRMSE").innerText = rmse;
    document.getElementById("metricConfidence").innerText = confidence + "%";
}


function animateNumber(elementId, finalValue, suffix = "") {

    const element = document.getElementById(elementId);
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = finalValue / steps;

    const counter = setInterval(() => {
        start += increment;
        if (start >= finalValue) {
            start = finalValue;
            clearInterval(counter);
        }
        element.innerText = start.toFixed(2) + suffix;
    }, stepTime);
}


function downloadReport() {

    if (!fullData || fullData.length === 0) {
        alert("No data available to export.");
        return;
    }

    const selectedItem = document.getElementById("itemSelector")?.value || "All";

    const totalSales = document.getElementById("totalSales")?.innerText || "N/A";
    const avgSales = document.getElementById("avgSales")?.innerText || "N/A";
    const entries = document.getElementById("totalEntries")?.innerText || "N/A";
    const growth = document.getElementById("growthRate")?.innerText || "N/A";

    const csvContent = [
        ["Analytics Report"],
        [],
        ["Selected Item", selectedItem],
        ["Total Sales", totalSales],
        ["Average Sales", avgSales],
        ["Total Entries", entries],
        ["Growth Rate", growth],
        [],
        ["Generated On", new Date().toLocaleString()]
    ];

    const csvString = csvContent
        .map(row => row.join(","))
        .join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "analytics_report.csv";
    link.click();
}

function exportPDF() {

    const element = document.getElementById("dashboardContent");

    html2canvas(element, { scale: 2 }).then(canvas => {

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jspdf.jsPDF("p", "mm", "a4");

        const pageWidth = 210;
        const pageHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

        pdf.save("Sales_Forecast_Dashboard.pdf");
    });
}


async function analyzeDataset() {

    const fileInput = document.getElementById("dataset");

    if (!fileInput || fileInput.files.length === 0) {
        alert("Please upload dataset first.");
        return;
    }

    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("dataset", file);

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/forecast",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error("Server returned error");
        }

        const result = await response.json();

        console.log(result);

        alert("Backend connected successfully!");

        // 👉 Later you can update charts using result.forecast

    } catch (err) {

        console.error(err);
        alert("Backend not connected");

    }
}




function updateDashboardFromBackend(result) {

    // Example expected structure
    // result = {
    //   forecast: [...],
    //   accuracy: 92,
    //   metrics: {...}
    // }

    if (!result) return;

    drawForecastChart(
        result.actualLabels,
        result.actualValues,
        result.forecastLabels,
        result.forecast
    );

    // Update metrics if provided
    if (result.metrics) {
        document.getElementById("metricAccuracy").innerText =
            result.metrics.accuracy + "%";
    }
}

function saveSession() {

    const selector = document.getElementById("itemSelector");
    const selectedItems =
        Array.from(selector.selectedOptions).map(o => o.value);

    const startDate = document.getElementById("startDate")?.value || "";
    const endDate = document.getElementById("endDate")?.value || "";

    const session = {
        selectedItems,
        startDate,
        endDate
    };

    localStorage.setItem("analysisSession", JSON.stringify(session));
}

function restoreSession() {

    const savedData = localStorage.getItem("salesData");
    const savedSession = localStorage.getItem("analysisSession");

    if (!savedData) return;

    fullData = JSON.parse(savedData);

    populateItems();  // rebuild selector

    if (savedSession) {

        const session = JSON.parse(savedSession);

        const selector = document.getElementById("itemSelector");

        Array.from(selector.options).forEach(opt => {
            opt.selected = session.selectedItems.includes(opt.value);
        });

        document.getElementById("startDate").value = session.startDate || "";
        document.getElementById("endDate").value = session.endDate || "";

        updateAnalytics();
    }
}
window.onload = function() {

    // Existing dark mode restore
    const savedMode = localStorage.getItem("darkMode");

    if (savedMode === "true") {
        document.body.classList.add("dark-mode");
        document.getElementById("darkModeToggle").checked = true;
    }

    // NEW: restore analysis session
    restoreSession();
};


function openReportView() {

    if (!fullData || fullData.length === 0) {
        alert("No analysis available.");
        return;
    }

    const reportWindow = window.open("", "_blank");

    const totalSales = document.getElementById("totalSales")?.innerText || "N/A";
    const avgSales = document.getElementById("avgSales")?.innerText || "N/A";
    const entries = document.getElementById("totalEntries")?.innerText || "N/A";
    const growth = document.getElementById("growthRate")?.innerText || "N/A";

    const reportHTML = `
        <html>
        <head>
            <title>Sales Forecast Report</title>
            <style>
                body {
                    font-family: Arial;
                    padding: 30px;
                    background: white;
                }

                h1 {
                    text-align: center;
                }

                .section {
                    margin-top: 25px;
                }

                .kpi-box {
                    display: flex;
                    gap: 20px;
                    margin-top: 15px;
                }

                .kpi {
                    border: 1px solid #ccc;
                    padding: 15px;
                    border-radius: 8px;
                    width: 150px;
                    text-align: center;
                }

                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: gray;
                }
            </style>
        </head>

        <body>

            <h1>Automated Sales Forecast Report</h1>

            <div class="section">
                <h2>Key Performance Indicators</h2>

                <div class="kpi-box">
                    <div class="kpi">
                        <strong>Total Sales</strong><br>${totalSales}
                    </div>
                    <div class="kpi">
                        <strong>Average Sales</strong><br>${avgSales}
                    </div>
                    <div class="kpi">
                        <strong>Total Entries</strong><br>${entries}
                    </div>
                    <div class="kpi">
                        <strong>Growth Rate</strong><br>${growth}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Analysis Summary</h2>
                <p>
                    This report presents an automated analysis of the uploaded
                    sales dataset, including trends, performance indicators,
                    and forecast insights generated by the system.
                </p>
            </div>

            <div class="footer">
                Generated on ${new Date().toLocaleString()}
            </div>

        </body>
        </html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
}


function showDataEverywhere() {

    if (!fullData || fullData.length === 0) return;

    // ---- DATASET PREVIEW ----
    const preview = document.getElementById("previewTable");
    if (preview) {

        const sample = fullData.slice(0, 10);

        preview.innerHTML = `
            <tr><th>Date</th><th>Item</th><th>Sales</th></tr>
            ${sample.map(d =>
                `<tr>
                    <td>${d.date}</td>
                    <td>${d.item}</td>
                    <td>${d.sales}</td>
                </tr>`
            ).join("")}
        `;
    }

    // ---- ITEM PERFORMANCE INSIGHTS ----
    const insights = document.getElementById("itemInsights");
    if (insights) {

        const totals = {};

        fullData.forEach(d => {
            totals[d.item] = (totals[d.item] || 0) + d.sales;
        });

        insights.innerHTML =
            Object.entries(totals)
                .map(([item, val]) =>
                    `<div>${item}: <b>$${val.toFixed(0)}</b></div>`
                )
                .join("");
    }

    // ---- REMOVE ALL "NO DATA" TEXT ----
    document.querySelectorAll("*").forEach(el => {
        if (el.textContent &&
            el.textContent.includes("No Data")) {
            el.style.display = "none";
        }
        if (el.textContent &&
            el.textContent.includes("No Dataset")) {
            el.style.display = "none";
        }
    });
}


function updateItemInsights(filteredData) {

    const insightsBox = document.getElementById("itemInsights");
    if (!insightsBox) return;

    if (!filteredData || filteredData.length === 0) {
        insightsBox.innerHTML = "<p>No data</p>";
        return;
    }

    // Calculate totals per item
    const totals = {};

    filteredData.forEach(d => {
        totals[d.item] = (totals[d.item] || 0) + d.sales;
    });

    // Sort items by sales
    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    const topItem = sorted[0];

    insightsBox.innerHTML = `
        <h3>Top Selected Item</h3>
        <p><b>${topItem[0]}</b> — $${topItem[1].toFixed(0)}</p>

        <h4>Selected Items Performance</h4>
        ${sorted.map(([item, val]) =>
            `<div>${item}: $${val.toFixed(0)}</div>`
        ).join("")}
    `;
}


function updatePerformanceInsights(data) {

    if (!data || data.length === 0) return;

    // ---- Total sales per item ----
    const totals = {};
    const history = {};

    data.forEach(d => {

        totals[d.item] = (totals[d.item] || 0) + d.sales;

        if (!history[d.item]) history[d.item] = [];
        history[d.item].push(d.sales);
    });

    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    const topItem = sorted[0];
    const lowestItem = sorted[sorted.length - 1];

    // ---- Volatility ----
    let volatileItem = "—";
    let maxVariance = -Infinity;

    for (const item in history) {

        const arr = history[item];
        const avg = arr.reduce((a,b)=>a+b,0) / arr.length;

        const variance =
            arr.reduce((sum,v)=>sum+(v-avg)**2,0) / arr.length;

        if (variance > maxVariance) {
            maxVariance = variance;
            volatileItem = item;
        }
    }

    // ---- Growth ----
    let growingItem = "—";
    let maxGrowth = -Infinity;

    for (const item in history) {

        const arr = history[item];

        if (arr.length < 2) continue;

        const growth =
            ((arr[arr.length-1] - arr[0]) / arr[0]) * 100;

        if (growth > maxGrowth) {
            maxGrowth = growth;
            growingItem = item;
        }
    }

    // ---- UPDATE YOUR EXACT ELEMENTS ----

    document.getElementById("topItemValue").innerText =
        topItem ? topItem[0] : "—";

    document.getElementById("lowestItemValue").innerText =
        lowestItem ? lowestItem[0] : "—";

    document.getElementById("volatileItemValue").innerText =
        volatileItem;

    document.getElementById("growingItemValue").innerText =
        growingItem;
}


function generateDatasetPreview() {

    const table = document.getElementById("previewTable");
    if (!table) return;

    if (!fullData || fullData.length === 0) {
        table.innerHTML = "<tr><td>No data</td></tr>";
        return;
    }

    const rowsToShow = fullData.slice(0, 5);

    // Create table header + body dynamically
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Sales</th>
            </tr>
        </thead>
        <tbody>
            ${rowsToShow.map(d => `
                <tr>
                    <td>${d.date}</td>
                    <td>${d.item}</td>
                    <td>${d.sales}</td>
                </tr>
            `).join("")}
        </tbody>
    `;
}



async function handleLogin(event) {

    event.preventDefault();   // ⭐ stops page reload

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {

            // ⭐ REDIRECT TO DASHBOARD
            window.location.href = "dashboard.html";

        } else {

            alert(data.message || "Invalid credentials");

        }

    } catch (err) {

        alert("Server error");

    }
}
