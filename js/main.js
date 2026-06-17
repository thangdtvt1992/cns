/* =========================================================
   VHF Coverage — Long Thành ATC | main.js
   Web tĩnh thuần (no framework)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Navbar: shrink on scroll + scroll progress ---------- */
  var navbar = $("#navbar");
  var progress = $("#scroll-progress");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (navbar) navbar.classList.toggle("scrolled", y > 24);

    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (y / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = $("#nav-toggle");
  var navLinks = $("#nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.classList.toggle("active", open);
    });
    $$(".nav-link", navLinks).forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Active section highlight (scrollspy) ---------- */
  var sections = $$("main section[id]");
  var linkMap = {};
  $$(".nav-link").forEach(function (l) { linkMap[l.getAttribute("data-target")] = l; });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          $$(".nav-link").forEach(function (l) { l.classList.remove("active"); });
          var active = linkMap[e.target.id];
          if (active) active.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Accordion ---------- */
  $$(".acc-head").forEach(function (head) {
    head.addEventListener("click", function () {
      var item = head.parentElement;
      var body = $(".acc-body", item);
      var isOpen = head.getAttribute("aria-expanded") === "true";

      head.setAttribute("aria-expanded", String(!isOpen));
      item.classList.toggle("open", !isOpen);
      if (!isOpen) {
        body.style.maxHeight = body.scrollHeight + "px";
      } else {
        body.style.maxHeight = "0px";
      }
    });
  });
  // open the first one by default
  (function initAccordion() {
    var first = $(".acc-item .acc-head[aria-expanded='true']");
    if (first) {
      var body = $(".acc-body", first.parentElement);
      first.parentElement.classList.add("open");
      body.style.maxHeight = body.scrollHeight + "px";
    }
  })();
  // recalc on resize for open items
  window.addEventListener("resize", function () {
    $$(".acc-item.open .acc-body").forEach(function (body) {
      body.style.maxHeight = body.scrollHeight + "px";
    });
  });

  /* ---------- KaTeX render ---------- */
  function renderMath() {
    if (typeof window.katex === "undefined") return;
    $$(".formula[data-tex]").forEach(function (el) {
      try {
        window.katex.render(el.getAttribute("data-tex"), el, {
          throwOnError: false,
          displayMode: true
        });
      } catch (err) {
        el.textContent = el.getAttribute("data-tex");
      }
    });
  }
  if (document.readyState === "complete") {
    renderMath();
  } else {
    window.addEventListener("load", renderMath);
  }

  /* =========================================================
     LEAFLET MAP — VHF coverage demo
     ========================================================= */
  function initMap() {
    if (typeof window.L === "undefined") return;
    var mapEl = $("#map");
    if (!mapEl) return;

    // Long Thành approx coordinates (Đài KSKL Long Thành)
    var STATION = [10.825, 107.06];

    var map = L.map("map", {
      center: STATION,
      zoom: 9,
      scrollWheelZoom: true,
      zoomControl: true
    });

    // Satellite imagery basemap to match the screenshot style
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    }).addTo(map);

    /* ---- Station marker only (KMZ layers handled separately) ---- */

    // Station marker
    var stationIcon = L.divIcon({
      className: "station-marker",
      html: '<span class="sm-core"></span><span class="sm-ring"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    var station = L.marker(STATION, { icon: stationIcon }).bindPopup(
      "<strong>Trạm VHF mặt đất</strong><br>Đài KSKL Long Thành<br>" +
        STATION[0].toFixed(3) + "°N, " + STATION[1].toFixed(3) + "°E<br>Tần số: 118–137 MHz"
    );

    // add station by default
    station.addTo(map);

    /* ---- Legend ---- */
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      var div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML =
        '<h6>Chú giải</h6>' +
        '<div class="lg-row"><label><input type="checkbox" id="lg-station" checked /> <span class="lg-swatch lg-station"></span>Trạm VHF</label></div>';
      return div;
    };
    legend.addTo(map);
    function legendBind(id, layer) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function (e) {
        if (e.target.checked) layer.addTo(map); else map.removeLayer(layer);
      });
    }
    legendBind('lg-station', station);

    /* ---- Toggles ---- */
    function bindToggle(id, layer) {
      var cb = $("#" + id);
      if (!cb) return;
      cb.addEventListener("change", function () {
        if (cb.checked) {
          layer.addTo(map);
        } else {
          map.removeLayer(layer);
        }
      });
    }
    bindToggle("toggle-station", station);

    // fix tile sizing if container animates in
    setTimeout(function () { map.invalidateSize(); }, 300);

    /* ---- Load KMZ overlay (from data/vhf_coverage.kmz) ---- */
    var kmzGroups = {};
    var kmzMasterEnabled = true;

    function getFolderName(folderEl) {
      var nameEl = folderEl.getElementsByTagName('name')[0] || folderEl.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'name')[0];
      return nameEl ? nameEl.textContent.trim() : 'Layer';
    }

    function createKmzStyle(index) {
      var colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#a855f7', '#f43f5e', '#22c55e', '#eab308'];
      return {
        color: colors[index % colors.length],
        weight: 1.4,
        opacity: 0.85,
        fillColor: colors[index % colors.length],
        fillOpacity: 0.24
      };
    }

    function addKmzLayerControl() {
      var control = L.control({ position: 'topright' });
      control.onAdd = function () {
        var div = L.DomUtil.create('div', 'kmz-control');
        div.innerHTML = '<div class="kmz-panel"><strong>KMZ Layers</strong><div id="kmz-layers"></div></div>';
        return div;
      };
      control.addTo(map);
    }
    // Simple inline KML parser - converts KML Folder to GeoJSON
    function kmlFolderToGeoJSON(folderEl) {
      var features = [];
      
      // Find all Placemarks (handle both with and without namespace)
      var placemarks = Array.prototype.slice.call(folderEl.getElementsByTagName('Placemark'));
      if (!placemarks.length) {
        placemarks = Array.prototype.slice.call(folderEl.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'Placemark'));
      }
      
      placemarks.forEach(function (pm) {
        var name = '';
        var nameEls = pm.getElementsByTagName('name');
        if (!nameEls.length) nameEls = pm.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'name');
        if (nameEls.length) name = nameEls[0].textContent;
        
        var geometry = null;
        
        // Try to find Polygon
        var polygons = pm.getElementsByTagName('Polygon');
        if (!polygons.length) polygons = pm.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'Polygon');
        
        if (polygons.length) {
          var poly = polygons[0];
          var outer = poly.getElementsByTagName('coordinates');
          if (!outer.length) outer = poly.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'coordinates');
          
          if (outer.length && outer[0].textContent) {
            try {
              var coordText = outer[0].textContent.trim();
              var pairs = coordText.split(/\s+/);
              var coords = pairs.map(function(pair) {
                var parts = pair.split(',');
                return [parseFloat(parts[0]), parseFloat(parts[1])];
              }).filter(function(c) { return !isNaN(c[0]) && !isNaN(c[1]); });
              
              if (coords.length > 2) {
                // Ensure polygon is closed
                if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                  coords.push(coords[0]);
                }
                geometry = {
                  type: 'Polygon',
                  coordinates: [coords]
                };
              }
            } catch (e) {
              console.log('  Error parsing polygon:', e);
            }
          }
        }
        
        // Try Point if no Polygon
        if (!geometry) {
          var points = pm.getElementsByTagName('Point');
          if (!points.length) points = pm.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'Point');
          
          if (points.length) {
            var coords = points[0].getElementsByTagName('coordinates');
            if (!coords.length) coords = points[0].getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'coordinates');
            
            if (coords.length && coords[0].textContent) {
              try {
                var parts = coords[0].textContent.trim().split(',');
                var lng = parseFloat(parts[0]);
                var lat = parseFloat(parts[1]);
                if (!isNaN(lng) && !isNaN(lat)) {
                  geometry = {
                    type: 'Point',
                    coordinates: [lng, lat]
                  };
                }
              } catch (e) {
                console.log('  Error parsing point:', e);
              }
            }
          }
        }
        
        if (geometry) {
          features.push({
            type: 'Feature',
            properties: { name: name },
            geometry: geometry
          });
        }
      });
      
      return {
        type: 'FeatureCollection',
        features: features
      };
    }
    function renderKmzLayerList() {
      var container = document.getElementById('kmz-layers');
      if (!container) return;
      container.innerHTML = '';
      Object.keys(kmzGroups).forEach(function (name) {
        var row = document.createElement('div');
        row.className = 'kmz-row';
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'kmz_' + name.replace(/\s+/g, '_');
        input.checked = true;
        input.addEventListener('change', function (e) {
          if (e.target.checked) {
            kmzGroups[name].addTo(map);
          } else {
            map.removeLayer(kmzGroups[name]);
          }
        });
        var label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.textContent = name;
        row.appendChild(input);
        row.appendChild(label);
        container.appendChild(row);
      });
    }

    async function loadKmz(url) {
      try {
        console.log('Starting KMZ load from:', url);
        var resp = await fetch(url);
        if (!resp.ok) throw new Error('KMZ not found: ' + resp.status);
        var ab = await resp.arrayBuffer();
        console.log('KMZ file size:', ab.byteLength);
        var zip = await JSZip.loadAsync(ab);
        var kmlName = Object.keys(zip.files).find(function (n) { return n.toLowerCase().endsWith('.kml'); });
        if (!kmlName) throw new Error('No .kml inside KMZ');
        console.log('KML file found:', kmlName);
        var kmlText = await zip.files[kmlName].async('string');
        var parser = new DOMParser();
        var kmlDoc = parser.parseFromString(kmlText, 'text/xml');

        var folders = Array.prototype.slice.call(kmlDoc.getElementsByTagName('Folder'));
        if (!folders.length) {
          folders = Array.prototype.slice.call(kmlDoc.getElementsByTagNameNS('http://www.opengis.net/kml/2.2', 'Folder'));
        }
        console.log('Total folders:', folders.length);

        if (!folders.length) throw new Error('No Folder elements found in KML');

        folders.forEach(function (folderEl, index) {
          var title = getFolderName(folderEl);
          console.log('Processing folder', index, ':', title);
          if (!title || title.toLowerCase().indexOf('vhf lta coverage') !== -1) {
            console.log('  -> Skipping (main folder)');
            return;
          }
          
          // Use inline KML parser instead of external togeojson
          var geojson = kmlFolderToGeoJSON(folderEl);
          console.log('  -> KML to GeoJSON: ' + (geojson && geojson.features ? geojson.features.length : 0) + ' features');
          
          if (!geojson || !geojson.features || !geojson.features.length) {
            console.log('  -> No features found, skipping');
            return;
          }

          var layer = L.geoJSON(geojson, {
            style: function () { return createKmzStyle(index); },
            onEachFeature: function (f, layer) {
              var ftitle = (f.properties && (f.properties.name || f.properties.Name)) || title;
              layer.bindPopup('<strong>' + ftitle + '</strong>');
            }
          });

          kmzGroups[title] = layer;
          if (kmzMasterEnabled) layer.addTo(map);
          console.log('  -> Added to map');
        });

        console.log('Total KMZ layers added:', Object.keys(kmzGroups).length);
        addKmzLayerControl();
        renderKmzLayerList();

        var bounds = L.latLngBounds([]);
        Object.values(kmzGroups).forEach(function (layer) {
          try { bounds.extend(layer.getBounds()); } catch (e) { /* ignore */ }
        });
        if (bounds.isValid()) {
          console.log('Fitting map to bounds');
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.error('Load KMZ error:', err);
      }
    }

    loadKmz('data/vhf_coverage.kmz');
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    initMap();
  } else {
    window.addEventListener("DOMContentLoaded", initMap);
  }
})();
