// Initialize the map object
const map = L.map('map', { scrollWheelZoom: false }).setView([39.95487450323784, -75.19999447856563], 13);

// ## The Base Tile Layer
const mapboxKey = 'pk.eyJ1IjoiY2hpYmlha2kiLCJhIjoiY20xODh2NTNqMTBvaDJqb2ptbjM4ZGViayJ9.un9M1_-S6kI8M0ktqZLz_Q';
const mapboxStyle = 'mapbox/light-v11';

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  detectRetina: true,
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// ## Interface Elements
const slides = document.querySelectorAll('.slide');
const container = document.querySelector('.slide-section');

const deck = new SlideDeck(slides, map);

// Scroll triggers slide change
document.addEventListener('scroll', () => deck.calcCurrentSlideIndex());

deck.preloadFeatureCollections();
deck.syncMapToCurrentSlide();