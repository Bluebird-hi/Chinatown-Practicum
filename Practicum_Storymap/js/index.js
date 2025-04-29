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

  // SAME price breaks and colors as updateDataLayer
  const priceBreaks = [0, 15126.36, 234573, 351408, 461629.4, 841995.8];
  const quintileColors = [
    '#0D564B', // low
    '#299988',
    '#ffd883',
    '#ffae00',
    '#E7551B'  // high
  ];

  div.innerHTML += '<b>Predicted Price</b><br>';

  for (let i = 0; i < priceBreaks.length - 1; i++) {
    div.innerHTML += `
      <i style="background:${quintileColors[i]}; width: 18px; height: 18px; display:inline-block; margin-right:6px;"></i>
      $${priceBreaks[i].toLocaleString(undefined, {maximumFractionDigits:0})}
      – 
      $${priceBreaks[i + 1].toLocaleString(undefined, {maximumFractionDigits:0})}
      <br>
    `;
  }

  return div;
};

legend.addTo(map);

