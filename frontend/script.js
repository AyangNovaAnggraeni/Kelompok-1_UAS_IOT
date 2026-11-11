const socket = new WebSocket("ws://localhost:1880/ws/sensors");

const statusIndicator = document.getElementById("status-indicator");

const connectionStatus = document.getElementById("connection-status");

// Menyimpan data grafik
const labels = [];

const temperatureA = [];
const temperatureB = [];

const humidityA = [];
const humidityB = [];

// Grafik suhu
const temperatureChart = new Chart(
  document.getElementById("temperatureChart"),
  {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Sensor A",
          data: temperatureA,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Sensor B",
          data: temperatureB,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  },
);

// Grafik kelembapan
const humidityChart = new Chart(document.getElementById("humidityChart"), {
  type: "line",

  data: {
    labels: labels,

    datasets: [
      {
        label: "Sensor A",
        data: humidityA,
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: "Sensor B",
        data: humidityB,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});

// Status WebSocket
socket.onopen = () => {
  connectionStatus.textContent = "Connected";
  statusIndicator.style.background = "#22c55e";
};

socket.onclose = () => {
  connectionStatus.textContent = "Disconnected";
  statusIndicator.style.background = "#ef4444";
};

socket.onerror = () => {
  connectionStatus.textContent = "Connection Error";
  statusIndicator.style.background = "#ef4444";
};

// Menerima data dari Node-RED
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  const value = data.value;
  const topic = data.topic;

  // Update nilai sensor
  switch (topic) {
    case "sensor/dhtA/suhu":
      document.getElementById("tempA").textContent = value.toFixed(1);
      break;

    case "sensor/dhtA/kelembaban":
      document.getElementById("humA").textContent = value.toFixed(1);
      break;

    case "sensor/dhtB/suhu":
      document.getElementById("tempB").textContent = value.toFixed(1);
      break;

    case "sensor/dhtB/kelembaban":
      document.getElementById("humB").textContent = value.toFixed(1);
      break;
  }

  // Update grafik setiap menerima data suhu
  if (topic === "sensor/dhtA/suhu" || topic === "sensor/dhtB/suhu") {
    const now = new Date().toLocaleTimeString();

    if (labels.length === 0 || labels[labels.length - 1] !== now) {
      labels.push(now);
    }

    if (topic === "sensor/dhtA/suhu") {
      temperatureA.push(value);
    }

    if (topic === "sensor/dhtB/suhu") {
      temperatureB.push(value);
    }

    temperatureChart.update();
  }

  // Update grafik kelembapan
  if (
    topic === "sensor/dhtA/kelembaban" ||
    topic === "sensor/dhtB/kelembaban"
  ) {
    const now = new Date().toLocaleTimeString();

    if (
      humidityChart.data.labels.length === 0 ||
      humidityChart.data.labels[humidityChart.data.labels.length - 1] !== now
    ) {
      humidityChart.data.labels.push(now);
    }

    if (topic === "sensor/dhtA/kelembaban") {
      humidityA.push(value);
    }

    if (topic === "sensor/dhtB/kelembaban") {
      humidityB.push(value);
    }

    humidityChart.update();
  }

  // Timestamp
  document.getElementById("last-update").textContent = new Date(
    data.timestamp,
  ).toLocaleString("id-ID");
};

// Export data SQLite ke CSV
document.getElementById("export-csv-btn").addEventListener("click", () => {
  window.location.href = "http://localhost:1880/api/sensors/csv";
});
