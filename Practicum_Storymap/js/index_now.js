// Initialize map of Philadelphia for slide 1
const phillyMap = L.map('map-slide1').setView([39.9530, -75.1636], 12); // map centered at city hall

const mapboxKey = 'pk.eyJ1IjoiY2hpYmlha2kiLCJhIjoiY20xODh2NTNqMTBvaDJqb2ptbjM4ZGViayJ9.un9M1_-S6kI8M0ktqZLz_Q';
const mapboxStyle = 'mapbox/streets-v11';

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(phillyMap);

// Initialize map of Chinatown and Callowhill for slide 2
const studyareaMap = L.map('map-slide2').setView([39.95737510294851, -75.15808142492733], 12); // map centered at Chinatown Stitch, showing our whole study area

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(studyareaMap);

