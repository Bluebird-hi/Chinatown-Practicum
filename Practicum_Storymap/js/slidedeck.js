/**
 * A slide deck object
 */
class SlideDeck {
  constructor(slides, map) {
    this.slides = slides;
    this.map = map;
    this.dataLayer = L.layerGroup().addTo(map);
    this.loadPhiladelphiaLayer();  
    this.currentSlideIndex = 0;
  }

  // Site  boundary
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
      .catch(error => console.error('Error loading the Philadelphia layer:', error));
  }

  // ... other methods like updateDataLayer, syncMapToCurrentSlide, etc.

  /**
   * ### updateDataLayer
   *
   * The updateDataLayer function will clear any markers or shapes previously
   * added to the GeoJSON layer on the map, and replace them with the data
   * provided in the `data` argument. The `data` should contain a GeoJSON
   * FeatureCollection object.
   *
   * @param {object} data A GeoJSON FeatureCollection object
   * @return {L.GeoJSONLayer} The new GeoJSON layer that has been added to the
   *                          data layer group.
   */
  // updateDataLayer(data) {
  //   this.dataLayer.clearLayers();
  //   const geoJsonLayer = L.geoJSON(data, {
  //     pointToLayer: (p, latlng) => L.marker(latlng),
  //     style: (feature) => ({
  //       color: '#299988', 
  //       // fillColor: '#a6c038', 
  //       weight: feature.properties.weight || 1,
  //       opacity: feature.properties.opacity || 1,
  //       fillOpacity: feature.properties.fillOpacity || 0.5
  //     }),
  //   })
  //   .bindTooltip((l) => l.feature.properties.label)
  //   .addTo(this.dataLayer);

  //   return geoJsonLayer;
  // }

  updateDataLayer(data) {
    this.dataLayer.clearLayers();
  
    const quintileColors = [
      '#0D564B' ,// low
      '#299988',
      '#ffd883',
      '#ffae00',
      '#E7551B'// high
    ];
  
    const priceBreaks = [0, 15126.36, 234573, 351408 , 461629.4, 841995.8]; // ← your fixed breaks
  
    const getColorByPrice = (price) => {
      if (price <= priceBreaks[1]) return quintileColors[0];
      if (price <= priceBreaks[2]) return quintileColors[1];
      if (price <= priceBreaks[3]) return quintileColors[2];
      if (price <= priceBreaks[4]) return quintileColors[3];
      return quintileColors[4];
    };
  
    const geoJsonLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const price = feature.properties.predicted_price || 0;
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: getColorByPrice(price),
          color: '#fff',
          weight: 0.5,
          fillOpacity: 0.9
        });
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          let popupContent = `
            <b>ObjectID:</b> ${feature.properties.objectid || 'N/A'}<br>
            <b>Sale Price:</b> $${(feature.properties.predicted_price || feature.properties.adj_sale_price || 0).toLocaleString()}<br>
            <b>Property Category:</b> ${feature.properties.category_code_description || 'N/A'}<br>
            <b>Land Use:</b> ${feature.properties.landuse || 'N/A'}<br>
            <b>Zoning Code:</b> ${feature.properties.zoning || 'N/A'}<br>
            <b>Location:</b> ${feature.properties.location || 'N/A'}
          `;
          layer.bindPopup(popupContent);
        }
      }
    });
  
    geoJsonLayer.addTo(this.dataLayer);
    return geoJsonLayer;
  }
  
  
  
  

  /**
   * ### getSlideFeatureCollection
   *
   * Load the slide's features from a GeoJSON file.
   *
   * @param {HTMLElement} slide The slide's HTML element. The element id should match the key for the slide's GeoJSON file
   * @return {object} The FeatureCollection as loaded from the data file
   */
  async getSlideFeatureCollection(slide) {
    const resp = await fetch(`data/${slide.id}.json`);
    const data = await resp.json();
    return data;
  }

  /**
   * ### hideAllSlides
   *
   * Add the hidden class to all slides' HTML elements.
   *
   * @param {NodeList} slides The set of all slide elements, in order.
   */
  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }
  }

  /**
   * ### syncMapToSlide
   *
   * Go to the slide that mathces the specified ID.
   *
   * @param {HTMLElement} slide The slide's HTML element
   */
  async syncMapToSlide(slide) {
    const collection = await this.getSlideFeatureCollection(slide);
    const layer = this.updateDataLayer(collection);

    /**
     * Create a bounds object from a GeoJSON bbox array.
     * @param {Array} bbox The bounding box of the collection
     * @return {L.latLngBounds} The bounds object
     */
    const boundsFromBbox = (bbox) => {
      const [west, south, east, north] = bbox;
      const bounds = L.latLngBounds(
          L.latLng(south, west),
          L.latLng(north, east),
      );
      return bounds;
    };

    /**
     * Create a temporary event handler that will show tooltips on the map
     * features, after the map is done "flying" to contain the data layer.
     */
    const handleFlyEnd = () => {
      if (slide.showpopups) {
        layer.eachLayer((l) => {
          l.bindTooltip(l.feature.properties.label, { permanent: true });
          l.openTooltip();
        });
      }
      this.map.removeEventListener('moveend', handleFlyEnd);
    };

    this.map.addEventListener('moveend', handleFlyEnd);
    if (collection.bbox) {
      this.map.flyToBounds(boundsFromBbox(collection.bbox));
    } else {
      this.map.flyToBounds(layer.getBounds());
    }
  }

  /**
   * Show the slide with ID matched by currentSlideIndex. If currentSlideIndex is
   * null, then show the first slide.
   */
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

  /**
   * ### preloadFeatureCollections
   *
   * Initiate a fetch on all slide data so that the browser can cache the
   * requests. This way, when a specific slide is loaded it has a better chance
   * of loading quickly.
   */
  preloadFeatureCollections() {
    for (const slide of this.slides) {
      this.getSlideFeatureCollection(slide);
    }
  }

  /**
   * Calculate the current slide index based on the current scroll position.
   */
  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;

    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos =
        this.slides[i].offsetTop - scrollPos + windowHeight * 2;
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
