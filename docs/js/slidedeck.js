class SlideDeck {
  constructor(slides, map) {
    this.slides = slides;
    this.map = map;
    this.dataLayer = L.layerGroup().addTo(map);
  
    this.loadPhiladelphiaLayer();
    this.loadI676Layer();
    this.loadstitchLayer();  // ← Add both Stitch and I676 layers to every slide
  
    this.currentSlideIndex = 0;
    this.legendControl = null;
  }
  
  loadPhiladelphiaLayer() {
    fetch('data/studyarea.json')
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#299988',
            dashArray: '5, 5',
            weight: 2,
            fillOpacity: 0,
          }
        }).addTo(this.map);
      })
      .catch(error => console.error('Error loading Philadelphia boundary:', error));
  }

  loadI676Layer() {
    fetch('data/I676.json')
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#DB5420',
            weight: 2,
            fillOpacity: 0,
          }
        }).addTo(this.map);
      })
      .catch(error => console.error('Error loading Philadelphia boundary:', error));
  }

  loadstitchLayer() {
    fetch('data/chinatownstitch.json')
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#299988',
            weight: 2,
            fillOpacity: 1,
          }
        }).addTo(this.map);
      })
      .catch(error => console.error('Error loading Philadelphia boundary:', error));
  }

  updateDataLayer(data) {
    this.dataLayer.clearLayers();

    const id = this.slides[this.currentSlideIndex].id;

    const priceFieldById = {
      "property_S0_js": "predicted_price",
      "property_S1_js": "predicted_price",
      "property_S2_js": "predicted_price"
    };

    const priceBreaks = [0, 264113.8, 372724.9, 465496.9, 575404.7, 901822.7, 172823489.1];
    const quintileColors = ['#0D564B', '#299988', '#ffd883', '#ffae00', '#E7551B','#000000'];
    const radiusByGroup = [3, 3.5, 4, 4.5, 5,3];

    const percBucketStyles = {
      "property_s0_s1": {
        sizes: {
          "< -10%": 3.5, "-10% to 0%": 4, "0% to +10%": 4.5,
          "+10% to +50%": 5, "+50 % to +100%": 6, "+50% to +200%": 7, "> 200%": 8
        },
        colors: {
          "< -10%": "#06402B", "-10% to 0%": "#008B8B", "0% to +10%": "#CDB902",
          "+10% to +50%": "#FFB343", "+50 % to +100%": "#F8A58E",
          "+50% to +200%": "#CD1C18", "> 200%": "#660033"
        }
      },
      "property_s0_s2": {
        sizes: {
          "< -10%": 3.5, "-10% to 0%": 4, "0% to +10%": 4.5,
          "+10% to +50%": 5, "+50 % to +100%": 6, "+50% to +200%": 7, "> 200%": 8
        },
        colors: {
          "< -10%": "#06402B", "-10% to 0%": "#008B8B", "0% to +10%": "#CDB902",
          "+10% to +50%": "#FFB343", "+50 % to +100%": "#F8A58E",
          "+50% to +200%": "#CD1C18", "> 200%": "#660033"
        }
      },
      "property_s1_s2": {
        sizes: {
          "< 0%": 3, "0%": 3.5, "0–10%": 4,
          "10–30%": 5, "30–50%": 6, "50%-60%": 7
        },
        colors: {
          "< 0%": "#06402B", "0%": "#CDB902", "0–10%": "#FFB343",
          "10–30%": "#F8A58E", "30–50%": "#CD1C18", "50%-60%": "#660033"
        }
      }
    };

    
    const geoJsonLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const p = feature.properties;
        let radius = 3;
        let fillColor = "#999";

        if (priceFieldById[id]) {
          const value = p[priceFieldById[id]];
          for (let i = 0; i < priceBreaks.length - 1; i++) {
            if (value >= priceBreaks[i] && value < priceBreaks[i + 1]) {
              fillColor = quintileColors[i];
              radius = radiusByGroup[i];
              break;
            }
          }
        } else if (percBucketStyles[id]) {
          const bucket = p.perc_bucket;
          const { sizes, colors } = percBucketStyles[id];
          radius = sizes[bucket] || 2;
          fillColor = colors[bucket] || "#ccc";
        }

        return L.circleMarker(latlng, {
          radius,
          fillColor,
          color: "#fff",
          weight: 0.5,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        let popup = `
          <b>ObjectID:</b> ${p.objectid || 'N/A'}<br>
          <b>Land Use:</b> ${p.landuse || 'N/A'}<br>
          <b>Zoning:</b> ${p.zoning || 'N/A'}<br>
        `;
        if (priceFieldById[id]) {
          popup += `<b>Price:</b> $${(p[priceFieldById[id]] || 0).toLocaleString()}<br>`;
        }
        if (p.perc_change !== undefined) {
          popup += `<b>Price Change Percentage:</b> ${p.perc_change}%`;
        }
        layer.bindPopup(popup);
      }
    });

    geoJsonLayer.addTo(this.dataLayer);
    this.updateLegend(id);
    return geoJsonLayer;
  }

  updateLegend(id) {
    if (this.legendControl) {
      this.map.removeControl(this.legendControl);
    }
  
    const quintileColors = ['#0D564B', '#299988', '#ffd883', '#ffae00', '#E7551B'];
    const priceLabels = [
      "Very Low (<363K)", "Low (363K–458K)", "Lower-Mid (458K–544K)",
      "Upper-Mid (544K–851K)", "High (851K–1.15M)"
    ];
  
    const percBucketStyles = {
      "property_s0_s1": {
        order: ["< -10%", "-10% to 0%", "0% to +10%", "+10% to +50%", "+50 % to +100%", "+50% to +200%", "> 200%"],
        colors: {
          "< -10%": "#06402B", "-10% to 0%": "#008B8B", "0% to +10%": "#CDB902",
          "+10% to +50%": "#FFB343", "+50 % to +100%": "#F8A58E",
          "+50% to +200%": "#CD1C18", "> 200%": "#660033"
        }
      },
      "property_s0_s2": {
        order: ["< -10%", "-10% to 0%", "0% to +10%", "+10% to +50%", "+50 % to +100%", "+50% to +200%", "> 200%"],
        colors: {
          "< -10%": "#06402B", "-10% to 0%": "#008B8B", "0% to +10%": "#CDB902",
          "+10% to +50%": "#FFB343", "+50 % to +100%": "#F8A58E",
          "+50% to +200%": "#CD1C18", "> 200%": "#660033"
        }
      },
      "property_s1_s2": {
        order: ["< 0%", "0%", "0–10%", "10–30%", "30–50%", "50%-60%"],
        colors: {
          "< 0%": "#06402B", "0%": "#CDB902", "0–10%": "#FFB343",
          "10–30%": "#F8A58E", "30–50%": "#CD1C18", "50%-60%": "#660033"
        }
      }
    };
  
    this.legendControl = L.control({ position: 'bottomleft' });
  
    this.legendControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      
      if (["property_S0_js", "property_S1_js", "property_S2_js"].includes(id)) {
        div.innerHTML = "<b>Price Category</b><br>";
        quintileColors.forEach((color, i) => {
          div.innerHTML += `<i style="background:${color}"></i> ${priceLabels[i]}<br>`;
        });
      } else if (percBucketStyles[id]) {
        div.innerHTML = "<b>Price Change (%)</b><br>";
        const { order, colors } = percBucketStyles[id];
        order.forEach(bucket => {
          const color = colors[bucket];
          div.innerHTML += `<i style="background:${color}"></i> ${bucket}<br>`;
        });
      }
  
      return div;
    };
  
    this.legendControl.addTo(this.map);
  }  

  async getSlideFeatureCollection(slide) {
    const resp = await fetch(`data/${slide.id}.json`);
    return await resp.json();
  }

  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add("hidden");
    }
  }

  async syncMapToSlide(slide) {
    const collection = await this.getSlideFeatureCollection(slide);
    const layer = this.updateDataLayer(collection);

    const boundsFromBbox = (bbox) => {
      const [west, south, east, north] = bbox;
      return L.latLngBounds(L.latLng(south, west), L.latLng(north, east));
    };

    const handleFlyEnd = () => {
      if (slide.showpopups) {
        layer.eachLayer(l => {
          l.bindTooltip(l.feature.properties.label, { permanent: true });
          l.openTooltip();
        });
      }
      this.map.removeEventListener("moveend", handleFlyEnd);
    };

    this.map.addEventListener("moveend", handleFlyEnd);
    if (collection.bbox) {
      this.map.flyToBounds(boundsFromBbox(collection.bbox));
    } else {
      this.map.flyToBounds(layer.getBounds());
    }
  }

  syncMapToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.syncMapToSlide(slide);
  }

  goNextSlide() {
    this.currentSlideIndex++;
    if (this.currentSlideIndex === this.slides.length) this.currentSlideIndex = 0;
    this.syncMapToCurrentSlide();
  }

  goPrevSlide() {
    this.currentSlideIndex--;
    if (this.currentSlideIndex < 0) this.currentSlideIndex = this.slides.length - 1;
    this.syncMapToCurrentSlide();
  }

  preloadFeatureCollections() {
    for (const slide of this.slides) {
      this.getSlideFeatureCollection(slide);
    }
  }

  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos = this.slides[i].offsetTop - scrollPos + windowHeight * 3;
      if (slidePos >= 0) break;
    }
    if (i !== this.currentSlideIndex) {
      this.currentSlideIndex = i;
      this.syncMapToCurrentSlide();
    }
  }
}

export { SlideDeck };
