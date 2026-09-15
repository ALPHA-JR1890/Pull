const consoleElement = document.getElementById('console-output');
const canvas = document.getElementById('telemetry-chart');
const ctx = canvas.getContext('2d');

// Data tracking configuration lists
const maxDataPoints = 30;
const historyLog = {
    latency: Array(maxDataPoints).fill(0),
    memory: Array(maxDataPoints).fill(0)
};

function writeLog(message) {
    const stamp = new Date().toISOString().slice(11, 19);
    consoleElement.innerText = `[${stamp}] ${message}\n` + consoleElement.innerText;
}

function clearConsoleLog() {
    consoleElement.innerText = `[${new Date().toISOString().slice(11, 19)}] Log trail emptied manually.`;
}

// Resizes canvas display variables cleanly
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Standard loop checking internal connection attributes
function evaluateStaticMetrics() {
    const link = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (link) {
        document.getElementById('network-val').innerText = `${link.downlink || '0'} Mbps (${link.effectiveType ? link.effectiveType.toUpperCase() : 'N/A'})`;
    } else {
        document.getElementById('network-val').innerText = navigator.onLine ? "Online (Standard Link)" : "Offline";
    }
}

// Calculations metric checking loop
function collectDynamicTelemetry() {
    // 1. Measuring Loop Render Latency Deltas
    const startTime = performance.now();
    requestAnimationFrame(() => {
        const loopDelta = (performance.now() - startTime).toFixed(1);
        document.getElementById('latency-val').innerText = `${loopDelta} ms`;
        
        // Push delta record directly into historical logging arrays
        historyLog.latency.shift();
        historyLog.latency.push(parseFloat(loopDelta));
    });

    // 2. Memory Consumption (Supported natively in Chromium-based engines)
    if (performance && performance.memory) {
        const usedMegaBytes = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const limitMegaBytes = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
        
        document.getElementById('memory-val').innerText = `${usedMegaBytes} MB`;
        document.getElementById('memory-limit-val').innerText = `${limitMegaBytes} MB`;

        historyLog.memory.shift();
        historyLog.memory.push(parseFloat(usedMegaBytes));
    } else {
        document.getElementById('memory-val').innerText = "Unsupported";
        document.getElementById('memory-limit-val').innerText = "Restricted Context";
    }

    renderTelemetryGraph();
}

// Custom graphing engine built natively inside standard HTML5 Canvas layouts
function renderTelemetryGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const widthStep = canvas.width / (maxDataPoints - 1);
    const height = canvas.height;

    // Calculate maximum limits to correctly scale visualization ratios
    const maxLatency = Math.max(...historyLog.latency, 30); 
    const maxMemory = Math.max(...historyLog.memory, 100);

    // Render Data Stream Lines helper
    function drawStream(dataList, maxVal, lineStrokeColor) {
        ctx.beginPath();
        ctx.strokeStyle = lineStrokeColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        for (let i = 0; i < dataList.length; i++) {
            const xCoordinate = i * widthStep;
            // Inverts tracking coordinates safely because canvas zeroes start at top left bounds
            const yCoordinate = height - ((dataList[i] / maxVal) * (height - 20)) - 10;
            
            if (i === 0) {
                ctx.moveTo(xCoordinate, yCoordinate);
            } else {
                ctx.lineTo(xCoordinate, yCoordinate);
            }
        }
        ctx.stroke();
    }

    // Call graphic rendering arrays
    drawStream(historyLog.memory, maxMemory, '#30d158'); // Memory Line Graph (Green)
    drawStream(historyLog.latency, maxLatency, '#2997ff'); // Latency Line Graph (Blue)
}

// Core execution loops setup configuration
evaluateStaticMetrics();
setInterval(collectDynamicTelemetry, 1000);
setInterval(() => {
    if(historyLog.memory[maxDataPoints - 1] > 0) {
        writeLog(`Telemetry cycle active. Heap usage logged at ${historyLog.memory[maxDataPoints - 1]} MB.`);
    }
}, 10000);
