class SlideDeck {
  constructor(container, slides, map) {
    this.container = container;
    this.slides = slides;
    this.map = map;

    this.dataLayer = L.layerGroup().addTo(map);
    this.labelLayer = L.layerGroup().addTo(map);
    this.loadBaseLayers();
    this.currentSlideIndex = 0;
  }

  loadBaseLayers() {
    // Load Philadelphia base outline once
    fetch('data/Philly.json')
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#279382',
            weight: 2,
            dashArray: '5,5',
            fill: false,
            fillOpacity: 0
          }
        }).addTo(this.map);
      });
  }

  async getSlideFeatureCollection(slide) {
    const resp = await fetch(`data/${slide.id}.json`);
    const data = await resp.json();
    return data;
  }

  updateDataLayer(data, options) {
    this.dataLayer.clearLayers();

    const defaultOptions = {
      pointToLayer: (p, latlng) => L.marker(latlng),
      style: (feature) => feature.properties.style,
    };
    const geoJsonLayer = L.geoJSON(data, options || defaultOptions)
        .bindTooltip((l) => l.feature.properties.label)
        .addTo(this.dataLayer);

    return geoJsonLayer;
  }
  
  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }
  }

  async syncMapToSlide(slide) {
    this.dataLayer.clearLayers();
    this.labelLayer.clearLayers();

    if (slide.id === 'stitchintro') {
      // Slide 0: Map of Philly zoomed in to study area with study area and cap outlined

      const loadAndStyle = async (url, styleOptions, labelText) => {
        const resp = await fetch(url);
        const data = await resp.json();
        const layer = L.geoJSON(data, { style: styleOptions }).addTo(this.dataLayer);

        const center = layer.getBounds().getCenter();
        L.marker(center, {
          icon: L.divIcon({
            className: 'label-icon',
            html: `<div>${labelText}</div>`
          })
        }).addTo(this.labelLayer);

        return layer;
      };

      // Load all four neighborhoods
      await loadAndStyle('data/callowhill.json', {
        color: '#279382',
        weight: 2,
        fill: true,
        fillColor: '#279382',
        fillOpacity: 0.1,
        dashArray: '5,5'
      }, 'Callowhill');

      await loadAndStyle('data/chinatown.json', {
        color: '#279382',
        weight: 2,
        fill: true,
        fillColor: '#279382',
        fillOpacity: 0.1,
        dashArray: '5,5'
      }, 'Chinatown');
      
      await loadAndStyle('data/viaduct.json', {
        color: '#279382',
        weight: 2,
        fill: true,
        fillColor: '#279382',
        fillOpacity: 1,
        dashArray: null
      }, 'Viaduct');

      await loadAndStyle('data/stitch.json', {
        color: '#E7551B',
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 1,
      }, 'Stitch Project');

      // Draw Study Area outline (grey dashed, no label needed here)
      const studyResp = await fetch('data/studyarea.json');
      const studyData = await studyResp.json();
      const studyLayer = L.geoJSON(studyData, {
        style: {
          color: false,
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5,5'
        }
      }).addTo(this.dataLayer);

      this.map.fitBounds(studyLayer.getBounds());

    } else if (slide.id === 'stitchtimeline') {
      // Center the map around the specified coordinates with zoom level 17
      this.map.setView([39.957421693546706, -75.15870220061866], 17);
    } else if (slide.id === 'othercity1') {

      // coordinates for Klyde Warren Park: [32.78972514811879, -96.80168277640266]

      // Center the map so that Klyde Warren Park is to the left of center
      this.map.setView([32.786726130661414, -96.7570779807717], 13);
    } else if (slide.id === 'othercity2') {

      // coordinates for cap at union station: [39.97604981494547, -83.00304477130415]

      // Center the map so that the Cap at Union Park is to the right of center
      this.map.setView([39.98369303341038, -83.17023983952679], 17);
    } else if (slide.id === 'othercity3') {
      
      // coordinates for the Central Artery: [42.35865074744755, -71.05180621461585]

      // Center the map so that the Central Artery is to the left of center
      this.map.setView([42.355878771896904, -71.02043983440369], 17);
    } else {
      
    }

    const collection = await this.getSlideFeatureCollection(slide);
    const options = this.slideOptions[slide.id];
    const layer = this.updateDataLayer(collection, options);

  }

  syncMapToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.syncMapToSlide(slide);
  }

  /**
   * Increment the currentSlideIndex and show the corresponding slide. If the
   * current slide is the final slide, then the next is the first.
   */
  goNextSlide() {
    this.currentSlideIndex++;

    if (this.currentSlideIndex === this.slides.length) {
      this.currentSlideIndex = 0;
    }

    this.syncMapToCurrentSlide();
  }

  /**
   * Decrement the currentSlideIndes and show the corresponding slide. If the
   * current slide is the first slide, then the previous is the final.
   */
  goPrevSlide() {
    this.currentSlideIndex--;

    if (this.currentSlideIndex < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    }

    this.syncMapToCurrentSlide();
  }

  preloadFeatureCollections() {
    for (const slide of this.slides) {
      this.getSlideFeatureCollection(slide);
    }
  }

  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY - this.container.offsetTop;
    const windowHeight = window.innerHeight;

    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos =
        this.slides[i].offsetTop - scrollPos + windowHeight * 0.7;
      if (slidePos >= 0) {
        break;
      }
    }

    if (i !== this.currentSlideIndex) {
      this.currentSlideIndex = i;
      this.syncMapToCurrentSlide();
    }
  }
}

export { SlideDeck };