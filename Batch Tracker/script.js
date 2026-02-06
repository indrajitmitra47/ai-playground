// --- GLOBALS ---
let targetDate = null;
let lastSpeed = 0;
let chart;

// --- 1. SETUP CHART ---
const ctx = document.getElementById('burnDownChart').getContext('2d');
Chart.defaults.color = '#64748b'; 
Chart.defaults.borderColor = 'rgba(100, 116, 139, 0.2)'; 

chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Start'],
        datasets: [
            {
                label: 'Actual Progress',
                data: [0],
                borderColor: '#3b82f6', 
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            },
            {
                label: 'Projection',
                data: [],
                borderColor: '#94a3b8', 
                borderDash: [6, 6],
                pointRadius: 0,
                borderWidth: 2
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, font: { weight: 'bold' } } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(100, 116, 139, 0.1)' } },
            x: { grid: { display: false } }
        }
    }
});

// --- 2. THE LOGIC ---
function updateData() {
    const startTimeVal = document.getElementById('startTime').value;
    const total = parseInt(document.getElementById('totalBatches').value);
    const processedInput = document.getElementById('currentProcessed');
    const processed = parseInt(processedInput.value);

    if (!startTimeVal || isNaN(processed)) { return; }

    // Time Math
    const now = new Date();
    const [startHour, startMin] = startTimeVal.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(startHour), parseInt(startMin), 0);
    
    // Handle overnight runs (if start time > now, assume start was yesterday)
    if (startDate > now) { startDate.setDate(startDate.getDate() - 1); }
    
    const elapsedMins = (now - startDate) / 1000 / 60;
    if (elapsedMins <= 0) return;

    // Speed & ETA
    const speed = (processed / elapsedMins);
    const remaining = total - processed;
    const minsLeft = remaining / speed;
    targetDate = new Date(now.getTime() + minsLeft * 60000);

    // Update Speed Delta
    const deltaEl = document.getElementById('speedDelta');
    if (lastSpeed > 0) {
        const diff = (speed - lastSpeed).toFixed(2);
        if (diff > 0) deltaEl.innerHTML = `<span class="text-green-600 font-bold">↑ ${diff}</span> faster`;
        else if (diff < 0) deltaEl.innerHTML = `<span class="text-red-500 font-bold">↓ ${Math.abs(diff)}</span> slower`;
        else deltaEl.innerHTML = `<span class="text-slate-400">Stable</span>`;
    }
    lastSpeed = speed;

    // Update Text Stats
    document.getElementById('speedDisp').innerText = speed.toFixed(1);
    document.getElementById('percentDisp').innerText = ((processed/total)*100).toFixed(1) + "%";
    document.getElementById('progressBar').style.width = ((processed/total)*100) + "%";
    document.getElementById('remainingDisp').innerText = remaining.toLocaleString();
    document.getElementById('etaText').innerText = targetDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Update Chart
    const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(processed);

    // Projection Logic
    const currentIdx = chart.data.labels.length - 1;
    const targetTimeLabel = targetDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let projectionData = new Array(currentIdx).fill(null);
    projectionData[currentIdx] = processed;
    projectionData[currentIdx + 1] = total;
    
    // Ensure projection label exists
    if (chart.data.labels[currentIdx + 1] !== targetTimeLabel) {
            if(chart.data.labels.length > chart.data.datasets[0].data.length) {
            chart.data.labels.pop();
            }
            chart.data.labels.push(targetTimeLabel);
    } else {
        chart.data.labels[currentIdx + 1] = targetTimeLabel;
    }

    chart.data.datasets[1].data = projectionData;
    chart.update();
    
    // Clear input
    processedInput.value = processed; 
}

// --- 3. TIMERS ---
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

setInterval(() => {
    if (!targetDate) return;
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) {
        document.getElementById('countdown').innerText = "COMPLETE";
        return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const display = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    document.getElementById('countdown').innerText = display;
}, 1000);