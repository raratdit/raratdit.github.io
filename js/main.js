// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.JS Scene
const scene = new THREE.Scene();
// Create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(100, 1, 0.01, 2000);

// Keep the 3D object on a global variable so we can access it later
let object;

// OrbitControls allow the camera to move around the scene
let controls;

// Set which object to render
let objToRender = 'punter';

// Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

// Load the file
loader.load(
  `/models/${objToRender}/scene.gltf`,
  function (gltf) {
    // If the file is loaded, add it to the scene
    object = gltf.scene;
    scene.add(object);
  },
  function (xhr) {
    if (xhr.total) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    } else {
      console.log(`Loaded ${xhr.loaded} bytes`);
    }
  },
  function (error) {
    console.error('An error happened while loading the model:', error);
  }
);

// Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Alpha: true allows for the transparent background
renderer.setSize(500, 500);

// Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

// Set how far the camera will be from the 3D model
camera.position.z = 350;
camera.position.x = 100;
camera.position.y = 100;

// Add lights to the scene, so we can actually see the 3D model
const topLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
topLight.position.set(500, 500, 500); // top-left-ish
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, 10);
scene.add(ambientLight);

// This adds controls to the camera, so we can rotate / zoom it with the mouse
if (objToRender === "punter") {
  controls = new OrbitControls(camera, renderer.domElement);
}

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Start the 3D rendering
animate();

// Variables for storing data
let allLabels = []; // Labels for time or index
let allXData = [];
let allYData = [];
let allZData = [];

let allGyroXData = [];
let allGyroYData = [];
let allGyroZData = [];

const maxDataPoints = 30; // Maximum number of data points to display on the chart

// Function to update chart and table
function updateChartData(chart) {
  // Get the latest maxDataPoints data for the chart
  const labels = allLabels.slice(-maxDataPoints);
  const accX = allXData.slice(-maxDataPoints);
  const accY = allYData.slice(-maxDataPoints);
  const accZ = allZData.slice(-maxDataPoints);
  const gyroX = allGyroXData.slice(-maxDataPoints);
  const gyroY = allGyroYData.slice(-maxDataPoints);
  const gyroZ = allGyroZData.slice(-maxDataPoints);

  // Update data chart
  chart.data.labels = labels;
  chart.data.datasets[0].data = accX;
  chart.data.datasets[1].data = accY;
  chart.data.datasets[2].data = accZ;
  chart.data.datasets[3].data = gyroX;
  chart.data.datasets[4].data = gyroY;
  chart.data.datasets[5].data = gyroZ;
  chart.update();
}

// Initialize chart
const ctx = document.getElementById('accelerometerChart').getContext('2d');
const accelerometerChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'X-Axis',
      data: [],
      borderColor: 'rgba(255, 99, 132, 1)',      // Red
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: false
    },
    {
      label: 'Y-Axis',
      data: [],
      borderColor: 'rgba(54, 162, 235, 1)',      // Blue
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: false
    },
    {
      label: 'Z-Axis',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',      // Teal
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false
    },
    {
      label: 'X-Gyro',
      data: [],
      borderColor: 'rgba(153, 102, 255, 1)',     // Purple
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      fill: false
    },
    {
      label: 'Y-Gyro',
      data: [],
      borderColor: 'rgba(255, 159, 64, 1)',      // Orange
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      fill: false
    },
    {
      label: 'Z-Gyro',
      data: [],
      borderColor: 'rgba(255, 206, 86, 1)',      // Yellow
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      fill: false
    }
    ]
  },
  options: {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (s)'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Acceleration (g)'
        }
      }
    }
  }
});

function compressDegree(degree) {
  // Mengubah derajat ke radian
  let radian = degree * (180 / Math.PI);
  return radian;
}

// Create events for the sensor readings
if (!!window.EventSource) {
  var source = new EventSource('/events');

  source.addEventListener('open', function (e) {
    console.log("Events Connected");
  }, false);

  source.addEventListener('error', function (e) {
    if (e.target.readyState != EventSource.OPEN) {
      console.log("Events Disconnected");
    }
  }, false);

  source.addEventListener('datas', function (e) {
    const data = JSON.parse(event.data);
    document.getElementById('data').textContent = JSON.stringify(data, null, 2);

    let gx = data.gyroX;
    let gy = data.gyroY;
    let gz = data.gyroZ;

    document.getElementById("gyroX").innerHTML = compressDegree(data.gyroX).toFixed(2);
    document.getElementById("gyroY").innerHTML = compressDegree(data.gyroY).toFixed(2);
    document.getElementById("gyroZ").innerHTML = compressDegree(data.gyroZ).toFixed(2);
    document.getElementById("accX").innerHTML = data.accX;
    document.getElementById("accY").innerHTML = data.accY;
    document.getElementById("accZ").innerHTML = data.accZ;

    // Change cube rotation after receiving the readings
    if (object) {
      object.rotation.x = gx;
      object.rotation.z = gy;
      object.rotation.y = gz;
      renderer.render(scene, camera);
    }

    // Set timestamp to current local date and time
    const timestamp = new Date().toISOString(); // ISO format: 'YYYY-MM-DDTHH:MM:SS.sssZ'

    // Store data in arrays for charts
    allLabels.push(timestamp);
    allXData.push(data.accX);
    allYData.push(data.accY);
    allZData.push(data.accZ);
    allGyroXData.push(compressDegree(data.gyroX).toFixed(2));
    allGyroYData.push(compressDegree(data.gyroY).toFixed(2));
    allGyroZData.push(compressDegree(data.gyroZ).toFixed(2));

    // Update chart data
    updateChartData(accelerometerChart);

    renderTablePage(currentPage);
    renderPagination();
  }, false);

}


// Pagination variables
const rowsPerPage = 10;
let currentPage = 1;

function renderTablePage(page) {
  const tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, allLabels.length);
  for (let i = startIndex; i < endIndex; i++) {
    const row = document.createElement('tr');
    row.classList.add('mdc-data-table__row');
    row.innerHTML = `
      <td class="mdc-data-table__cell">${i + 1}</td>
      <td class="mdc-data-table__cell">${allLabels[i]}</td>
      <td class="mdc-data-table__cell">${allXData[i]}</td>
      <td class="mdc-data-table__cell">${allYData[i]}</td>
      <td class="mdc-data-table__cell">${allZData[i]}</td>
      <td class="mdc-data-table__cell">${allGyroXData[i]}</td>
      <td class="mdc-data-table__cell">${allGyroYData[i]}</td>
      <td class="mdc-data-table__cell">${allGyroZData[i]}</td>
    `;
    tbody.appendChild(row);
  }
}

function updatePage(page) {
  currentPage = page;
  renderTablePage(page);
  renderPagination();
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(allLabels.length / rowsPerPage);
  const maxPagesToShow = 10;
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const middlePage = Math.ceil(maxPagesToShow / 2);
    if (currentPage <= middlePage) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + middlePage - 1 >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - middlePage + 1;
      endPage = currentPage + middlePage - 1;
    }
  }

  pagination.innerHTML = `
<button id="first-btn" ${currentPage === 1 ? 'disabled' : ''}>&lt;&lt;</button>
<button id="prev-btn" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
${Array.from({ length: endPage - startPage + 1 }, (_, i) => `
<span class="page-number ${currentPage === startPage + i ? 'active' : ''}" data-page="${startPage + i}">${startPage + i}</span>
`).join('')}
<button id="next-btn" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
<button id="last-btn" ${currentPage === totalPages ? 'disabled' : ''}>&gt;&gt;</button>
`;
}


document.getElementById('pagination').addEventListener('click', (event) => {
  if (event.target.classList.contains('page-number')) {
    updatePage(Number(event.target.dataset.page));
  } else if (event.target.id === 'prev-btn') {
    if (currentPage > 1) {
      updatePage(currentPage - 1);
    }
  } else if (event.target.id === 'next-btn') {
    const totalPages = Math.ceil(allLabels.length / rowsPerPage);
    if (currentPage < totalPages) {
      updatePage(currentPage + 1);
    }
  } else if (event.target.id === 'first-btn') {
    if (currentPage > 1) {
      updatePage(1);
    }
  } else if (event.target.id === 'last-btn') {
    const totalPages = Math.ceil(allLabels.length / rowsPerPage);
    if (currentPage < totalPages) {
      updatePage(totalPages);
    }
  }
});

// Download functionality
document.getElementById('download-btn').addEventListener('click', () => {
  const csvRows = [];
  // Header
  csvRows.push(['Index', 'Timestamp', 'Acc X', 'Acc Y', 'Acc Z', 'Gyro X', 'Gyro Y', 'Gyro Z'].join(','));

  // Data rows
  allLabels.forEach((label, index) => {
    csvRows.push([
      index + 1,
      label,
      allXData[index],
      allYData[index],
      allZData[index],
      allGyroXData[index],
      allGyroYData[index],
      allGyroZData[index]
    ].join(','));
  });

  // Create CSV file
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Initialize first page of the table and pagination

