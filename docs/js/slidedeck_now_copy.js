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

    if (slide.id === 'stitchintro') {
      // Slide 0: Philadelphia boundary + studyarea (orange) + centered labels

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
      
      await loadAndStyle('data/chinatownstitch.json', {
        color: '#E7551B',
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 1,
      }, 'Chinatown Stitch');

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
      // Slide 1: zoomed to stitch itself

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

      // Load stitch data
      await loadAndStyle('data/chinatownstitch.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 0.25,
      }, 'Chinatown Stitch');

      // Draw stitch outline (grey dashed, no label needed here)
      const stitchResp = await fetch('data/chinatownstitch.json');
      const stitchData = await stitchResp.json();
      const stitchLayer = L.geoJSON(stitchData, {
        style: {
          color: '#E7551B',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

      this.map.fitBounds(stitchLayer.getBounds());

      // Load Chinatown Stitch Phase I data
      await loadAndStyle('data/chinatownstitch_phase1.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#ffae00',
        fillOpacity: 0.25,
      }, 'Phase 1');

      // Draw stitch outline (dashed, no label needed here)
      const phase1Resp = await fetch('data/chinatownstitch_phase1.json');
      const phase1Data = await phase1Resp.json();
      const phase1Layer = L.geoJSON(phase1Data, {
        style: {
          color: '#ffae00',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

      // Load Chinatown Stitch Phase II data
      await loadAndStyle('data/chinatownstitch_phase2.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#ffd883',
        fillOpacity: 0.25,
      }, 'Phase 2');

      // Draw stitch outline (dashed, no label needed here)
      const phase2Resp = await fetch('data/chinatownstitch_phase2.json');
      const phase2Data = await phase2Resp.json();
      const phase2Layer = L.geoJSON(phase2Data, {
        style: {
          color: '#ffd883',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

    } else if (slide.id === 'othercity1') {
      // Slide 2: Klyde Warren Park (KWP)

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

      // Load Klyde Warren Park (KWP) Data
      await loadAndStyle('data/klydewarrenpark.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 0.25,
      }, 'Klyde Warren Park');

      // Draw KWP outline (dashed, no label needed here)
      const KWPResp = await fetch('data/klydewarrenpark.json');
      const KWPData = await KWPResp.json();
      const KWPLayer = L.geoJSON(KWPData, {
        style: {
          color: '#E7551B',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

      this.map.fitBounds(KWPLayer.getBounds());

    } else if (slide.id === 'othercity2') {
      // Slide 3: Cap at Union Station (CUS)

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

      // Load CUS Data
      await loadAndStyle('data/capunionstation.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 0.25,
      }, 'Cap at Union Station');

      // Draw CUS outline (dashed, no label needed here)
      const CUSResp = await fetch('data/capunionstation.json');
      const CUSData = await CUSResp.json();
      const CUSLayer = L.geoJSON(CUSData, {
        style: {
          color: '#E7551B',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

      this.map.fitBounds(CUSLayer.getBounds());

    } else if (slide.id === 'othercity3') {
      // Slide 4: Central Artery (CA)

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

      // Load CA Data
      await loadAndStyle('data/centralartery.json', {
        color: false,
        weight: 2,
        fill: true,
        fillColor: '#E7551B',
        fillOpacity: 0.25,
      }, 'Central Artery');

      // Draw CA outline (dashed, no label needed here)
      const CAResp = await fetch('data/centralartery.json');
      const CAData = await CAResp.json();
      const CALayer = L.geoJSON(CAData, {
        style: {
          color: '#E7551B',
          weight: 2,
          fill: false,
          fillOpacity: 1,
          dashArray: '5, 5'
        }
      }).addTo(this.dataLayer);

      this.map.fitBounds(CALayer.getBounds());

    } else {
      // Other slides - empty map
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
      // console log comment for debugging purposes
      // console.log(`Slide changed to index: ${newSlideIndex}, id: ${this.slides[newSlideIndex].id}`);
      this.currentSlideIndex = newSlideIndex;
      this.syncMapToCurrentSlide();
    }
  }
}

export { SlideDeck };
