class SlideDeck {
  constructor(slides, map) {
    this.slides = slides;
    this.map = map;
    this.dataLayer = L.layerGroup().addTo(map);
    this.labelLayer = L.layerGroup().addTo(map); // Separate layer for labels
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

  updateDataLayer(data) {
    this.dataLayer.clearLayers();
    const prices = data.features
      .filter(f => f.geometry.type === 'Point')
      .map(f => f.properties.predicted_price || 0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const interpolateColor = (price) => {
      const t = Math.max(0, Math.min(1, (price - minPrice) / (maxPrice - minPrice)));
      const start = { r: 41, g: 153, b: 136 };
      const end = { r: 231, g: 85, b: 27 };
      const r = Math.round(start.r + (end.r - start.r) * t);
      const g = Math.round(start.g + (end.g - start.g) * t);
      const b = Math.round(start.b + (end.b - start.b) * t);
      return `rgb(${r},${g},${b})`;
    };

    const geoJsonLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const price = feature.properties.predicted_price || 0;
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: interpolateColor(price),
          color: '#fff',
          weight: 0.5,
          fillOpacity: 0.9
        });
      }
    });

    geoJsonLayer.addTo(this.dataLayer);
    return geoJsonLayer;
  }

  async syncMapToSlide(slide) {
    this.dataLayer.clearLayers();
    this.labelLayer.clearLayers();

    if (slide.id === 'philly') {
      // Slide 0: Philadelphia boundary + studyarea (orange) + centered labels

      const phillyResp = await fetch('data/Philly.json');
      const phillyData = await phillyResp.json();
      const phillyLayer = L.geoJSON(phillyData, {
        style: {
          color: '#279382',
          weight: 2,
          dashArray: '5,5',
          fill: false,
          fillOpacity: 0
        }
      }).addTo(this.dataLayer);

      const studyResp = await fetch('data/studyarea.json');
      const studyData = await studyResp.json();
      const studyLayer = L.geoJSON(studyData, {
        style: {
          color: '#E7551B',
          weight: 2,
          dashArray: null,
          fill: false,
          fillOpacity: 0
        }
      }).addTo(this.dataLayer);

      // Center label for Philly
      const phillyCenter = phillyLayer.getBounds().getCenter();
      L.marker(phillyCenter, {
        icon: L.divIcon({
          className: 'label-icon',
          html: `<div>Philadelphia</div>`
        })
      }).addTo(this.labelLayer);

      // Center label for Study Area
      const studyCenter = studyLayer.getBounds().getCenter();
      L.marker(studyCenter, {
        icon: L.divIcon({
          className: 'label-icon',
          html: `<div>Study Area</div>`
        })
      }).addTo(this.labelLayer);

      this.map.fitBounds(phillyLayer.getBounds());

    } else if (slide.id === 'studyarea') {
      // Slide 1: Study Area + neighborhoods + labels

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

    } else {
      // Other slides - property points
      const collection = await this.getSlideFeatureCollection(slide);
      const layer = this.updateDataLayer(collection);

      if (collection.bbox) {
        this.map.fitBounds(this.boundsFromBbox(collection.bbox));
      } else {
        this.map.fitBounds(layer.getBounds());
      }
    }
  }

  syncMapToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.syncMapToSlide(slide);
  }

  preloadFeatureCollections() {
    for (const slide of this.slides) {
      this.getSlideFeatureCollection(slide);
    }
  }

  calcCurrentSlideIndex() {
    let newSlideIndex = this.currentSlideIndex;
    for (let i = 0; i < this.slides.length; i++) {
      const rect = this.slides[i].getBoundingClientRect();
      const middleOfScreen = window.innerHeight / 2;

      if (rect.top <= middleOfScreen && rect.bottom >= middleOfScreen) {
        newSlideIndex = i;
        break;
      }
    }

    if (newSlideIndex !== this.currentSlideIndex) {
      this.currentSlideIndex = newSlideIndex;
      this.syncMapToCurrentSlide();
    }
  }
}

export { SlideDeck };
