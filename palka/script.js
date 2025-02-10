// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Konfigurasi Firebase
const firebaseConfig = {
    databaseURL: "https://banjartechno-4b0d8-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Konfigurasi Supabase
const SUPABASE_URL = "https://putvfjseacfzoaimknyb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHZmanNlYWNmem9haW1rbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxMTc5NjAsImV4cCI6MjA1MTY5Mzk2MH0.LS-nmLkjZFrJgjmPWHZ6fHxU7m5WJai7ePwD-PerXNo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Referensi data di Firebase
const dataRef = ref(database, "/Example/myFloat");
// Ambil data secara realtime
onValue(dataRef, async (snapshot) => {
    let data = snapshot.val();
    let sensor = "MAX31865"; // Gunakan let agar bisa diubah

    updateTemperatureUI(data);

    if (data === 999.999) {
        console.error("E32TTL not available");
        sensor = "E32TTL not available";
    } else if (data === 888.888) {
        console.warn("No data available");
        sensor = "No data available";
    }

    // Insert ke Supabase
    const { error } = await supabase
        .from("data")
        .insert([{ sensor: sensor, value: data }]);

    if (error) {
        console.error("Error inserting into Supabase:", error);
    } else {
        console.log("Data successfully inserted into Supabase");
    }

    // Muat ulang tabel setelah insert
    fetchData();
});


let currentPage = 1;
const pageSize = 20;

async function fetchData() {
    const { data, error } = await supabase
        .from("data")
        .select("sensor, value, created_at")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    // Extract data for chart
    const labels = data.map(row => new Date(row.created_at).toLocaleString());
    const values = data.map(row => row.value);

    // Get canvas context
    const ctx = document.getElementById("sensorChart").getContext("2d");

    // Populate table
    const tableBody = document.getElementById("dataTableBody");
    tableBody.innerHTML = "";
    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td class="border px-4 py-2">${row.sensor}</td>
                    <td class="border px-4 py-2">${row.value}</td>
                    <td class="border px-4 py-2">${new Date(row.created_at).toLocaleString()}</td>
                `;
        tableBody.appendChild(tr);
    });


    // Create new chart
    window.myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Sensor Value Over Time",
                data: values,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",
                fill: true,
                tension: 0.2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Sensor Value"
                    }
                }
            }
        }
    });

}

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchData();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    currentPage++;
    fetchData();
});

fetchData();

function updateTemperatureUI(temperature) {
    // temperature = -2
    document.getElementById("firebaseData").innerText = `${temperature} °C`;
    let statusElement = document.getElementById("status");
    let statusCard = document.getElementById("statusCard");

    let status = "";
    let colorClass = "bg-gray-200";

    if (temperature >= 15) {
        status = "Suhu Ekstrem Panas";
        colorClass = "bg-red-500 text-white";
    } else if (temperature >= 10) {
        status = "Suhu Sangat Panas";
        colorClass = "bg-red-400 text-white";
    } else if (temperature >= 5) {
        status = "Suhu Panas";
        colorClass = "bg-orange-400 text-white";
    } else if (temperature >= 0) {
        status = "Suhu Normal";
        colorClass = "bg-green-400 text-white";
    } else if (temperature >= -2) {
        status = "Suhu Dingin";
        colorClass = "bg-blue-300 text-white";
    } else if (temperature >= -5) {
        status = "Suhu Sangat Dingin";
        colorClass = "bg-blue-500 text-white";
    } else if (temperature >= -10) {
        status = "Suhu Beku Ringan";
        colorClass = "bg-blue-600 text-white";
    } else if (temperature >= -18) {
        status = "Suhu Beku";
        colorClass = "bg-blue-700 text-white";
    } else if (temperature >= -25) {
        status = "Suhu Beku Dalam";
        colorClass = "bg-blue-800 text-white";
    } else {
        status = "Suhu Ekstrem Dingin";
        colorClass = "bg-blue-900 text-white";
    }

    statusElement.innerText = status;
    statusCard.className = `p-4 rounded-lg shadow ${colorClass}`;
}

document.getElementById("downloadCsv").addEventListener("click", function () {
    let table = document.getElementById("dataTableBody");
    let rows = table.getElementsByTagName("tr");

    if (rows.length === 0) {
        alert("No data available to download.");
        return;
    }

    let csvContent = "Sensor,Value,Timestamp\n";

    for (let row of rows) {
        let columns = row.getElementsByTagName("td");
        let rowData = [];
        for (let col of columns) {
            rowData.push(col.innerText);
        }
        csvContent += rowData.join(",") + "\n";
    }

    let blob = new Blob([csvContent], { type: "text/csv" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "temperature_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

let impactChart;

function updateChart(labels, values) {
    const ctx = document.getElementById('impactChart').getContext('2d');
    if (impactChart) {
        impactChart.destroy();
    }
    impactChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sensor Value Over Time',
                data: values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// document.addEventListener("DOMContentLoaded", function () {
//     fetchData();
// });
