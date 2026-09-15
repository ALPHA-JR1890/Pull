// Base global variables accessible across scripts
const consoleElement = document.getElementById('audit-console');
const canvas = document.getElementById('telemetry-chart');
const ctx = canvas.getContext('2d');

const maxPoints = 40;
const runLogs = {
    latency: Array(maxPoints).fill(0),
    memory: Array(maxPoints).fill(0)
};

let accentColor = '#2997ff';
let particleSpeedFactor = 4;
let structuralMatrixTestLoopActive = false;

function writeAuditLog(message) {
    const time = new Date().toISOString().slice(11, 19);
    consoleElement.innerText = `[${time}] ${message}\n` + consoleElement.innerText;
}

function purgeConsoleLogs() {
    consoleElement.innerText = `[${new Date().toISOString().slice(11, 19)}] Audit ledger console purged cleanly.`;
}

function configureCanvasResolution() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', configureCanvasResolution);
configureCanvasResolution();

function sampleStaticHardwareMetrics() {
    document.getElementById('cpu-cores').innerText = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Threads` : 'Restricted';
    const link = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (link) {
        document.getElementById('net-rtt').innerText = link.rtt ? `${link.rtt} ms RTT` : 'No Ping';
    } else {
        document.getElementById('net-rtt').innerText = 'N/A';
    }
    initializeBatteryTelemetry();
}

function initializeBatteryTelemetry() {
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const syncBattery = () => {
                document.getElementById('battery-percent').innerText = `${Math.round(battery.level * 100)}%`;
                document.getElementById('battery-state').innerText = battery.charging ? 'Charging' : 'Discharging';
            };
            syncBattery();
            battery.addEventListener('levelchange', syncBattery);
            battery.addEventListener('chargingchange', syncBattery);
        });
    } else {
        document.getElementById('battery-percent').innerText = 'Unsupported';
        document.getElementById('battery-state').innerText = 'Unsupported';
    }
}

function runRealtimeExecutionMonitor() {
    const now = new Date();
    document.getElementById('local-time').innerText = now.toTimeString().split(' ');

    const sampleStart = performance.now();
    requestAnimationFrame(() => {
        const frameLatencyDelta = (performance.now() - sampleStart).toFixed(1);
        document.getElementById('thread-latency').innerText = `${frameLatencyDelta} ms`;
        runLogs.latency.shift();
        runLogs.latency.push(parseFloat(frameLatencyDelta));
    });

    if (performance && performance.memory) {
        const currentHeap = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        runLogs.memory.shift();
        runLogs.memory.push(parseFloat(currentHeap));
    } else {
        runLogs.memory.shift();
        runLogs.memory.push(0);
    }
    plotDualAxisChart();
}

function plotDualAxisChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const segmentWidth = canvas.width / (maxPoints - 1);
    const canvasHeight = canvas.height;
    const topLatency = Math.max(...runLogs.latency, 25);
    const topMemory = Math.max(...runLogs.memory, 80);

    function traceLine(dataArray, limitVal, colorHex) {
        ctx.beginPath();
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < dataArray.length; i++) {
            const x = i * segmentWidth;
            const y = canvasHeight - ((dataArray[i] / limitVal) * (canvasHeight - 40)) - 20;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    traceLine(runLogs.latency, topLatency, accentColor); 
    if(topMemory > 0) traceLine(runLogs.memory, topMemory, '#30d158');   
}

sampleStaticHardwareMetrics();
setInterval(runRealtimeExecutionMonitor, 1000);
