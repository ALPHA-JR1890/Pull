const logOutput = document.getElementById('log-output');

// Utility to append timestamps onto runtime events log area
function appendLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logOutput.innerText = `[${timestamp}] ${message}\n` + logOutput.innerText;
}

// Gathers passive, non-sensitive hardware signatures
function evaluateEnvironment() {
    // Processors Core Check
    document.getElementById('cpu-val').innerText = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Threads` : 'Restricted';
    
    // RAM Bounds Estimation
    document.getElementById('ram-val').innerText = navigator.deviceMemory ? `≥ ${navigator.deviceMemory} GB` : 'Restricted';
    
    // Screen Resolution Pipeline
    document.getElementById('res-val').innerText = `${window.screen.width} × ${window.screen.height} (${window.devicePixelRatio || 1}x)`;
    
    // Core Link/Network Evaluation
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let netText = navigator.onLine ? 'Online' : 'Offline';
    if (connection && connection.effectiveType) {
        netText += ` (${connection.effectiveType.toUpperCase()})`;
    }
    document.getElementById('net-val').innerText = netText;

    // WebGL Engine (GPU) Render Fingerprint
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                document.getElementById('gpu-val').innerText = renderer || "Generic WebGL Canvas";
            } else {
                document.getElementById('gpu-val').innerText = "Context Unmasked Context Empty";
            }
        } else {
            document.getElementById('gpu-val').innerText = "Unsupported Engine Context";
        }
    } catch (e) {
        document.getElementById('gpu-val').innerText = "Blocked Context Access";
    }

    // Battery Monitor Engine Call
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            function updateBatteryDisplay() {
                const percentage = Math.round(battery.level * 100);
                const chargingState = battery.charging ? "Charging" : "Discharging";
                document.getElementById('battery-val').innerText = `${percentage}% (${chargingState})`;
            }
            updateBatteryDisplay();
            battery.addEventListener('levelchange', updateBatteryDisplay);
            battery.addEventListener('chargingchange', updateBatteryDisplay);
        }).catch(() => {
            document.getElementById('battery-val').innerText = "Permission Blocked";
        });
    } else {
        document.getElementById('battery-val').innerText = "API Unsupported";
    }
}

// Active explicit prompt handling triggers
function requestLocation() {
    if (!navigator.geolocation) {
        appendLog('Error: Geolocation API unsupported on this browser engine instance.');
        return;
    }
    appendLog('Triggered system request: Geolocation telemetry permissions...');
    navigator.geolocation.getCurrentPosition(
        pos => appendLog(`Success: Coords established at [${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}]`),
        err => appendLog(`Rejected: Geolocation access was denied (${err.message})`)
    );
}

async function requestMedia() {
    if (!navigator.mediaDevices?.getUserMedia) {
        appendLog('Error: MediaDevices capture mechanism unsupported.');
        return;
    }
    appendLog('Triggered system request: Media device hardware capture permissions...');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        appendLog('Success: Media capture validation successful.');
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        appendLog(`Rejected: Hardware capture context denied (${err.message})`);
    }
}

async function requestUSB() {
    if (!navigator.usb) {
        appendLog('Error: WebUSB interface unsupported.');
        return;
    }
    appendLog('Triggered system interface lookup: Initializing target USB device scan...');
    try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        appendLog(`Success: USB aligned -> ${device.productName || 'Unnamed Device'} (Vendor: ${device.vendorId})`);
    } catch (err) {
        appendLog(`Rejected: Interface alignment cancelled (${err.message})`);
    }
}

async function requestHID() {
    if (!navigator.hid) {
        appendLog('Error: WebHID layout interface unsupported.');
        return;
    }
    appendLog('Triggered system interface lookup: Initializing peripheral HID layout prompt...');
    try {
        const devices = await navigator.hid.requestDevice({ filters: [] });
        if (devices.length > 0) {
            appendLog(`Success: Peripheral HID established -> ${devices[0].productName}`);
        } else {
            appendLog('Status: Prompt dismissed without selecting an item.');
        }
    } catch (err) {
        appendLog(`Rejected: Peripheral alignment cancelled (${err.message})`);
    }
}

// Run initial calculations on load
evaluateEnvironment();

