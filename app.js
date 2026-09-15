const consoleElement = document.getElementById('audit-console');
const canvas = document.getElementById('telemetry-chart');
const ctx = canvas.getContext('2d');

const maxPoints = 40;
const runLogs = {
    latency: Array(maxPoints).fill(0),
    memory: Array(maxPoints).fill(0)
};

function writeAuditLog(message) {
    const time = new Date().toISOString().slice(11, 19);
    consoleElement.innerText = `[${time}] ${message}\n` + consoleElement.innerText;
}

function purgeConsoleLogs() {
    consoleElement.innerText = `[${new Date().toISOString().slice(11, 19)}] Audit ledger console purged cleanly.`;
}

function exportAuditLedger() {
    const dataUri = "data:text/plain;charset=utf-8," + encodeURIComponent(consoleElement.innerText);
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataUri);
    anchor.setAttribute("download", `system_audit_ledger_${Date.now()}.txt`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function configureCanvasResolution() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', configureCanvasResolution);
configureCanvasResolution();

function sampleStaticHardwareMetrics() {
    document.getElementById('cpu-cores').innerText = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'Restricted';
    document.getElementById('display-pipeline').innerText = `${window.screen.width}×${window.screen.height} (${window.devicePixelRatio || 1}x)`;
    
    const link = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (link) {
        document.getElementById('net-rtt').innerText = link.rtt ? `${link.rtt} ms RTT` : 'No Ping';
    } else {
        document.getElementById('net-rtt').innerText = 'N/A';
    }

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const tempCtx = new AudioContext();
            document.getElementById('audio-rate').innerText = `${tempCtx.sampleRate} Hz`;
            tempCtx.close();
        }
    } catch(e) { document.getElementById('audio-rate').innerText = 'Blocked'; }

    syncStorageViews();
}

function runRealtimeExecutionMonitor() {
    // 1. Calculate Sandboxed Thread Processing Latency
    const sampleStart = performance.now();
    requestAnimationFrame(() => {
        const frameLatencyDelta = (performance.now() - sampleStart).toFixed(1);
        document.getElementById('thread-latency').innerText = `${frameLatencyDelta} ms`;
        
        runLogs.latency.shift();
        runLogs.latency.push(parseFloat(frameLatencyDelta));
    });

    // 2. Sample Memory Allocations (Supported in Chromium / ChromeOS Engine Layers)
    if (performance && performance.memory) {
        const currentHeap = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const maxHeapLimit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
        
        document.getElementById('heap-used').innerText = `${currentHeap} MB`;
        document.getElementById('heap-limit').innerText = `${maxHeapLimit} MB`;

        runLogs.memory.shift();
        runLogs.memory.push(parseFloat(currentHeap));
    } else {
        document.getElementById('heap-used').innerText = 'Chromium Only';
        document.getElementById('heap-limit').innerText = 'Restricted';
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
        ctx.lineJoin = 'round';

        for (let i = 0; i < dataArray.length; i++) {
            const x = i * segmentWidth;
            const y = canvasHeight - ((dataArray[i] / limitVal) * (canvasHeight - 30)) - 15;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    traceLine(runLogs.latency, topLatency, '#2997ff'); // Latency Plot (Blue Line)
    traceLine(runLogs.memory, topMemory, '#30d158');   // Memory Plot (Green Line)
}

function executeCoreStressBenchmark() {
    writeAuditLog("Initializing numeric processor calculation loop benchmark test...");
    const monitorField = document.getElementById('thread-latency');
    monitorField.innerText = "Stressing...";
    
    setTimeout(() => {
        const start = performance.now();
        let computeTotal = 0;
        for (let i = 0; i < 40000000; i++) {
            computeTotal += Math.sqrt(i) * Math.sin(i);
        }
        const delta = (performance.now() - start).toFixed(1);
        writeAuditLog(`Thread test complete. Duration: ${delta}ms. Checksum: ${Math.round(computeTotal)}`);
    }, 40);
}

function syncStorageViews() {
    try { document.getElementById('local-storage-status').innerText = `${Object.keys(localStorage).length} Keys`; } catch(e) {}
    try { document.getElementById('session-storage-status').innerText = `${Object.keys(sessionStorage).length} Keys`; } catch(e) {}
}

function commitStorageRecord(type) {
    const key = `sandbox_metric_${Math.floor(Math.random() * 1000)}`;
    const value = `stamp_${Date.now()}`;
    try {
        if (type === 'local') localStorage.setItem(key, value);
        else sessionStorage.setItem(key, value);
        writeAuditLog(`Committed key: [${key}] to domain ${type} storage.`);
        syncStorageViews();
    } catch(err) { writeAuditLog(`Storage rejected: ${err.message}`); }
}

function verifyIndexedDBStore() {
    const openRequest = indexedDB.open("SystemTelemetryDB", 1);
    openRequest.onupgradeneeded = (e) => { e.target.result.createObjectStore("records", { autoIncrement: true }); };
    openRequest.onsuccess = () => {
        document.getElementById('idb-status').innerText = "Verified Node";
        writeAuditLog("IndexedDB target store validated successfully.");
    };
    openRequest.onerror = () => { writeAuditLog("IndexedDB execution failure."); };
}

window.addEventListener('deviceorientation', (e) => {
    if (e.beta !== null) {
        document.getElementById('gyro-matrix').innerText = `B: ${Math.round(e.beta)}° / G: ${Math.round(e.gamma)}°`;
    }
});

function requestGeolocationTelemetry() {
    if (!navigator.geolocation) return writeAuditLog("Geolocation API unavailable.");
    writeAuditLog("Triggering high-precision coordinate request modal...");
    navigator.geolocation.getCurrentPosition(
        p => writeAuditLog(`Approved: Coords locked at [${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}]`),
        err => writeAuditLog(`Denied: Request prompt rejected (${err.message})`)
    );
}

async function requestMediaHardwareStream() {
    if (!navigator.mediaDevices?.getUserMedia) return writeAuditLog("Media API unavailable.");
    writeAuditLog("Triggering hardware capture initialization request...");
    try {
        const trackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        writeAuditLog("Approved: Connection to camera/mic matrix active.");
        trackStream.getTracks().forEach(t => t.stop());
    } catch(err) { writeAuditLog(`Denied: Access refused (${err.message})`); }
}

async function requestUSBDeviceAccess() {
    if (!navigator.usb) return writeAuditLog("WebUSB API unsupported.");
    writeAuditLog("Triggering client hardware USB selector overlay...");
    try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        writeAuditLog(`Approved: Device handshake successful: ${device.productName || 'Device'}`);
    } catch(err) { writeAuditLog(`Cancelled: Selector dismissed (${err.message})`); }
}

async function requestHIDDeviceAccess() {
    if (!navigator.hid) return writeAuditLog("WebHID API unsupported.");
    writeAuditLog("Triggering device mapping interface selection view...");
    try {
        const inputs = await navigator.hid.requestDevice({ filters: [] });
        writeAuditLog(inputs.length ? `Approved: Connected input -> ${inputs[0].productName}` : "Dismissed: Interface prompt cleared empty.");
    } catch(err) { writeAuditLog(`Cancelled: Input registration terminated (${err.message})`); }
}

// Start Processing Loops
sampleStaticHardwareMetrics();
setInterval(runRealtimeExecutionMonitor, 1000);
