import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const DAKAR_CENTER = { lat: 14.7167, lng: -17.4677 };

function WebMap({ userLocation, destination, nearbyDrivers, driverLocation, onRouteCalculated }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const destMarker = useRef(null);
  const routeLayer = useRef(null);
  const driverMarkers = useRef([]);
  const activeDriverMarker = useRef(null);

  useEffect(() => {
    if (!mapRef.current || map.current) return;

    // Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, []);

  const initMap = () => {
    const L = window.L;
    const lat = userLocation?.latitude || DAKAR_CENTER.lat;
    const lng = userLocation?.longitude || DAKAR_CENTER.lng;

    const m = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], 14);

    // CartoDB Dark Matter — clean dark tiles like Uber/Bolt
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(m);

    // User marker - blue pulse
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:18px;height:18px;">
        <div style="position:absolute;top:-11px;left:-11px;width:40px;height:40px;border-radius:50%;background:rgba(74,144,255,0.15);animation:pulse 2s infinite;"></div>
        <div style="width:18px;height:18px;border-radius:50%;background:#4A90FF;border:3px solid #fff;box-shadow:0 2px 8px rgba(74,144,255,0.5);position:relative;z-index:2;"></div>
      </div>
      <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.4}}</style>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    userMarker.current = L.marker([lat, lng], { icon: userIcon }).addTo(m);

    map.current = m;
    setTimeout(() => m.invalidateSize(), 100);
  };

  // Update user position
  useEffect(() => {
    if (!map.current || !userLocation || !userMarker.current) return;
    userMarker.current.setLatLng([userLocation.latitude, userLocation.longitude]);
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Update nearby drivers
  useEffect(() => {
    if (!map.current || !window.L) return;
    const L = window.L;
    const m = map.current;

    // Clear previous driver markers
    driverMarkers.current.forEach(marker => m.removeLayer(marker));
    driverMarkers.current = [];

    if (!nearbyDrivers?.length) return;

    const driverIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#22C55E;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(34,197,94,0.4);border:2px solid #fff;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    nearbyDrivers.forEach(d => {
      if (d.latitude && d.longitude) {
        const marker = L.marker([d.latitude, d.longitude], { icon: driverIcon }).addTo(m);
        driverMarkers.current.push(marker);
      }
    });
  }, [nearbyDrivers]);

  // Update active driver location (real-time tracking)
  useEffect(() => {
    if (!map.current || !window.L) return;
    const L = window.L;
    const m = map.current;

    if (!driverLocation?.latitude || !driverLocation?.longitude) {
      if (activeDriverMarker.current) { m.removeLayer(activeDriverMarker.current); activeDriverMarker.current = null; }
      return;
    }

    const drvIcon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;border-radius:50%;background:#22C55E;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(34,197,94,0.5);border:3px solid #fff;transition:all 0.5s ease;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (activeDriverMarker.current) {
      activeDriverMarker.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    } else {
      activeDriverMarker.current = L.marker([driverLocation.latitude, driverLocation.longitude], { icon: drvIcon, zIndexOffset: 1000 }).addTo(m);
    }
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  // Update destination + route
  useEffect(() => {
    if (!map.current || !window.L) return;
    const L = window.L;
    const m = map.current;

    // Clear previous
    if (destMarker.current) { m.removeLayer(destMarker.current); destMarker.current = null; }
    if (routeLayer.current) { m.removeLayer(routeLayer.current); routeLayer.current = null; }

    if (!destination) {
      const lat = userLocation?.latitude || DAKAR_CENTER.lat;
      const lng = userLocation?.longitude || DAKAR_CENTER.lng;
      m.setView([lat, lng], 14);
      return;
    }

    // Destination marker - green
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:32px;height:32px;border-radius:50%;background:#22C55E;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(34,197,94,0.4);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
        </div>
        <div style="width:2px;height:8px;background:#22C55E;"></div>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });
    destMarker.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(m);

    // Fetch real route from OSRM
    const uLat = userLocation?.latitude || DAKAR_CENTER.lat;
    const uLng = userLocation?.longitude || DAKAR_CENTER.lng;

    fetchRoute(uLng, uLat, destination.lng, destination.lat).then(routeData => {
      if (routeData && routeData.geometry) {
        // Decode polyline and draw route
        const coords = decodePolyline(routeData.geometry);
        routeLayer.current = L.layerGroup().addTo(m);

        // Shadow line
        L.polyline(coords, { color: '#000', weight: 7, opacity: 0.3 }).addTo(routeLayer.current);
        // Main line
        L.polyline(coords, { color: '#22C55E', weight: 4, opacity: 0.9 }).addTo(routeLayer.current);

        // Fit bounds to route
        const bounds = L.latLngBounds(coords);
        m.fitBounds(bounds, { padding: [50, 50] });

        // Callback with distance/duration
        if (onRouteCalculated) {
          onRouteCalculated({
            distance: routeData.distance / 1000, // km
            duration: routeData.duration / 60, // min
          });
        }
      } else {
        // Fallback: straight line
        routeLayer.current = L.polyline(
          [[uLat, uLng], [destination.lat, destination.lng]],
          { color: '#22C55E', weight: 3, opacity: 0.7, dashArray: '10, 6' }
        ).addTo(m);
        const bounds = L.latLngBounds([[uLat, uLng], [destination.lat, destination.lng]]);
        m.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [destination?.lat, destination?.lng]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// OSRM routing API (free, open)
async function fetchRoute(fromLng, fromLat, toLng, toLat) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=polyline`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('OSRM error:', e);
  }
  return null;
}

// Decode Google-style encoded polyline
function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// Native map with OSRM routing
function NativeMap({ userLocation, destination, nearbyDrivers, driverLocation }) {
  let MapView, Marker, Polyline;
  try {
    MapView = require('react-native-maps').default;
    const maps = require('react-native-maps');
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  } catch (e) {
    // react-native-maps not available
    return <View style={StyleSheet.absoluteFillObject} />;
  }

  const [routeCoords, setRouteCoords] = React.useState([]);

  React.useEffect(() => {
    if (!destination || !userLocation) { setRouteCoords([]); return; }
    const uLat = userLocation.latitude;
    const uLng = userLocation.longitude;
    fetchRoute(uLng, uLat, destination.lng, destination.lat).then(routeData => {
      if (routeData?.geometry) {
        const decoded = decodePolyline(routeData.geometry);
        setRouteCoords(decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng })));
      } else {
        // Fallback straight line
        setRouteCoords([
          { latitude: uLat, longitude: uLng },
          { latitude: destination.lat, longitude: destination.lng },
        ]);
      }
    });
  }, [destination?.lat, destination?.lng]);

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: userLocation?.latitude || DAKAR_CENTER.lat,
        longitude: userLocation?.longitude || DAKAR_CENTER.lng,
        latitudeDelta: 0.05, longitudeDelta: 0.05,
      }}
    >
      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
          title="Ma position"
        />
      )}
      {destination && (
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title={destination.name}
          pinColor="#22C55E"
        />
      )}
      {nearbyDrivers?.map(d => d.latitude && d.longitude && (
        <Marker
          key={d.id}
          coordinate={{ latitude: d.latitude, longitude: d.longitude }}
          title={d.nom || 'Chauffeur'}
          pinColor="#22C55E"
        />
      ))}
      {driverLocation?.latitude && driverLocation?.longitude && (
        <Marker
          coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
          title="Votre chauffeur"
          pinColor="#22C55E"
        />
      )}
      {routeCoords.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#22C55E"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

export default function DakarMap({ userLocation, destination, nearbyDrivers, driverLocation, onRouteCalculated }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <WebMap
          userLocation={userLocation}
          destination={destination}
          nearbyDrivers={nearbyDrivers}
          driverLocation={driverLocation}
          onRouteCalculated={onRouteCalculated}
        />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <NativeMap
        userLocation={userLocation}
        destination={destination}
        nearbyDrivers={nearbyDrivers}
        driverLocation={driverLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
