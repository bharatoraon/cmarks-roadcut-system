import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Ideally from env
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmhhcmF0b3Jhb24iLCJhIjoiY21nd2l3eDNpMGl6cTJrc2lpa2I1czgybyJ9.K_ICeJ0NzQi4bPLGgmF9Yw";

export default function MapView({
  onSelectRoad,
  theme,
  flyToLocation,
  layers,
  clickedLocation,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const clickMarker = useRef(null); // Ref to store the current click marker
  const [lng, setLng] = useState(80.2707);
  const [lat, setLat] = useState(13.0827);
  const [zoom, setZoom] = useState(12);

  // Handle Click Marker
  useEffect(() => {
    if (!map.current || !clickedLocation) return;

    // Remove existing marker
    if (clickMarker.current) {
      clickMarker.current.remove();
    }

    // Add new marker
    clickMarker.current = new mapboxgl.Marker({ color: "#ef4444" }) // Red color
      .setLngLat([clickedLocation.lng, clickedLocation.lat])
      .addTo(map.current);
  }, [clickedLocation]);

  // Store regions data for filtering
  const [regionsData, setRegionsData] = useState(null);

  // Handle Layer Visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const toggle = (id, visible) => {
      if (map.current.getLayer(id)) {
        map.current.setLayoutProperty(
          id,
          "visibility",
          visible ? "visible" : "none",
        );
      }
    };

    toggle("roads-layer", layers.roads);
    toggle("regions-layer", layers.regions);
    toggle("wards-layer", layers.wards);
    toggle("wards-outline", layers.wards);
    toggle("applications-layer", layers.applications);

    // Special handling for Traffic (Source/Layer addition)
    if (layers.traffic) {
      if (!map.current.getSource("traffic")) {
        map.current.addSource("traffic", {
          type: "vector",
          url: "mapbox://mapbox.mapbox-traffic-v1",
        });
        map.current.addLayer(
          {
            id: "traffic-layer",
            type: "line",
            source: "traffic",
            "source-layer": "traffic",
            paint: {
              "line-width": 2,
              "line-color": [
                "match",
                ["get", "congestion"],
                "low",
                "#4ade80",
                "moderate",
                "#facc15",
                "heavy",
                "#f87171",
                "severe",
                "#dc2626",
                "#000000",
              ],
            },
          },
          "roads-layer",
        ); // Place below roads
      }

      // Apply Boundary Filter if regions data exists
      if (regionsData) {
        try {
          // Collect all Polygon/MultiPolygon coordinates
          const allCoordinates = [];

          regionsData.features.forEach((f) => {
            if (f.geometry.type === "Polygon") {
              allCoordinates.push(f.geometry.coordinates);
            } else if (f.geometry.type === "MultiPolygon") {
              f.geometry.coordinates.forEach((polyCoords) => {
                allCoordinates.push(polyCoords);
              });
            }
          });

          if (allCoordinates.length > 0) {
            const multiPoly = {
              type: "MultiPolygon",
              coordinates: allCoordinates,
            };

            // Check if the filter is already applied to avoid redundancy?
            // Mapbox is efficient, we can just set it.
            map.current.setFilter("traffic-layer", ["within", multiPoly]);
          }
        } catch (e) {
          console.error("Error applying traffic filter:", e);
        }
      }
    } else {
      if (map.current.getLayer("traffic-layer"))
        map.current.removeLayer("traffic-layer");
      if (map.current.getSource("traffic")) map.current.removeSource("traffic");
    }
  }, [layers, regionsData]); // Re-run when regionsData loads

  // Handle Smart Search flyTo
  useEffect(() => {
    if (map.current && flyToLocation) {
      map.current.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: flyToLocation.zoom || 16,
        essential: true, // This animation is considered essential with respect to prefers-reduced-motion
      });
      // Optional: Helper marker
      new mapboxgl.Marker({ color: "red" })
        .setLngLat([flyToLocation.lng, flyToLocation.lat])
        .addTo(map.current);
    }
  }, [flyToLocation]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current) return;
    const styleUrl =
      theme === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11";
    map.current.setStyle(styleUrl);
    // Note: setStyle removes layers, so we need to reload them.
    // Mapbox fires 'style.load' when the new style is ready.
    map.current.once("style.load", () => {
      loadLayers();
    });
  }, [theme]);

  useEffect(() => {
    if (map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11", // Default
      center: [lng, lat],
      zoom: zoom,
    });

    // ... keep existing listeners but move click to ref if needed or ensure it persists
    // Actually, listeners persist on the map instance usually, but layers are gone.

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.on("load", () => {
      loadLayers();
    });

    map.current.on("click", (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["roads-layer"],
      });
      if (features.length > 0) {
        // Pass merged properties AND geometry
        const feature = features[0];
        const roadData = {
          ...feature.properties,
          geometry: feature.geometry,
        };
        onSelectRoad(roadData, { lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });
  }, []);

  const loadLayers = () => {
    // 1. REGIONS BOUNDARY (Bottom Layer)
    fetch("http://localhost:5001/api/boundaries/regions")
      .then((res) => res.json())
      .then((data) => {
        setRegionsData(data); // Save for traffic filtering filters
        if (!map.current.getSource("regions")) {
          map.current.addSource("regions", { type: "geojson", data: data });
          map.current.addLayer({
            id: "regions-layer",
            type: "line",
            source: "regions",
            layout: {},
            paint: {
              "line-color": "#f97316", // Orange
              "line-width": 3,
            },
          });
        }
      })
      .catch((err) => console.error("Error loading regions:", err));

    // 2. WARDS BOUNDARY
    fetch("http://localhost:5001/api/boundaries/wards")
      .then((res) => res.json())
      .then((data) => {
        if (!map.current.getSource("wards")) {
          map.current.addSource("wards", { type: "geojson", data: data });
          map.current.addLayer({
            id: "wards-layer",
            type: "fill",
            source: "wards",
            layout: {},
            paint: {
              "fill-color": "#3b82f6", // Blue
              "fill-opacity": 0.1,
              "fill-outline-color": "rgba(59, 130, 246, 0.5)",
            },
          });
          // Add line layer for sharper ward boundaries
          map.current.addLayer({
            id: "wards-outline",
            type: "line",
            source: "wards",
            layout: {},
            paint: {
              "line-color": "#3b82f6",
              "line-width": 1,
              "line-opacity": 0.3,
            },
          });
        }
      })
      .catch((err) => console.error("Error loading wards:", err));

    // 3. ROADS (Top Layer)
    fetch("http://localhost:5001/api/roads")
      .then((res) => res.json())
      .then((data) => {
        if (!map.current.getSource("roads")) {
          map.current.addSource("roads", {
            type: "geojson",
            data: data,
          });
          map.current.addLayer({
            id: "roads-layer",
            type: "line",
            source: "roads",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": [
                "match",
                ["get", "owner"],
                "GCC",
                "#10b981",
                "Highways",
                "#0ea5e9",
                "CMRL",
                "#f59e0b",
                "#64748b",
              ],
              "line-width": 3,
              "line-opacity": 0.8,
            },
          });
        }
      })
      .catch((err) => console.error("Error loading roads:", err));

    // 4. APPLICATIONS
    fetch("http://localhost:5001/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (!map.current.getSource("applications")) {
          map.current.addSource("applications", {
            type: "geojson",
            data: data,
          });
          map.current.addLayer({
            id: "applications-layer",
            type: "line",
            source: "applications",
            paint: {
              "line-color": [
                "match",
                ["get", "status"],
                "approved",
                "#10b981", // Green
                "rejected",
                "#64748b", // Gray
                "#ef4444", // Default/Pending = Red
              ],
              "line-width": 4,
              "line-dasharray": [2, 1],
              "line-opacity": 1,
            },
          });
        }
      })
      .catch((err) => console.error("Error loading applications:", err));
  };

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}
