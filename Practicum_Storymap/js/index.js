import { SlideDeck } from './slidedeck.js';

const map = L.map('map', {scrollWheelZoom: false}).setView([0, 0], 0);

// ## The Base Tile Layer
const mapboxKey = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2w3ZTh1NTIxMTgxNTQwcGhmODU2NW5kaSJ9.pBPd19nWO-Gt-vTf1pOHBA';
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

// ## The SlideDeck object
const deck = new SlideDeck(slides, map);

document.addEventListener('scroll', () => deck.calcCurrentSlideIndex());

deck.preloadFeatureCollections();
deck.syncMapToCurrentSlide();

// Add a color legend to the bottom-left
const legend = L.control({ position: 'bottomleft' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  const priceRanges = [0, 100000, 200000, 300000, 400000, 500000, 600000];

  const getColor = (t) => {
    const interpolate = (start, end) => Math.round(start + (end - start) * t);
    const r = interpolate(41, 231);   
    const g = interpolate(153, 85);   
    const b = interpolate(136, 27);   
    return `rgb(${r}, ${g}, ${b})`;
  };

  div.innerHTML += '<b>Predicted Price</b><br>';

  for (let i = 0; i < priceRanges.length - 1; i++) {
    const t = i / (priceRanges.length - 2);
    div.innerHTML += `
      <i style="background:${getColor(t)}; width: 18px; height: 18px; display:inline-block; margin-right:6px;"></i>
      $${(priceRanges[i] / 1000).toFixed(0)}k–$${(priceRanges[i + 1] / 1000).toFixed(0)}k<br>
    `;
  }

  return div;
};


legend.addTo(map);
