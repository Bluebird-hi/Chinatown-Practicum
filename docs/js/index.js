// index.js
import { SlideDeck } from './slidedeck.js';

const map = L.map('map', {scrollWheelZoom: false}).setView([39.9578, -75.1575], 15);

const mapboxKey = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2w3ZTh1NTIxMTgxNTQwcGhmODU2NW5kaSJ9.pBPd19nWO-Gt-vTf1pOHBA';
const mapboxStyle = 'mapbox/light-v11';

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  detectRetina: true,
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const slides = document.querySelectorAll('.slide');
const container = document.querySelector('.slide-section');
const deck = new SlideDeck(slides, map);

document.addEventListener('scroll', () => deck.calcCurrentSlideIndex());
deck.preloadFeatureCollections();
deck.syncMapToCurrentSlide();

// Checkbox filter integration - only apply to comparison slides
const filterSlides = ["property_s0_s1", "property_s1_s2", "property_s0_s2"];
const filterContainer = document.getElementById('category-filters');
if (filterContainer) {
  const checkboxes = filterContainer.querySelectorAll('input[name="category"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const currentSlide = slides[deck.currentSlideIndex].id;
      if (filterSlides.includes(currentSlide)) {
        deck.syncMapToCurrentSlide();
      }
    });
  });
}
