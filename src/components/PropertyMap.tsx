import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const pinIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="width:32px;height:42px;position:relative;">
      <svg width="32" height="42" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#1B2B4B" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markerRef.current = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
    markerRef.current.bindPopup(`<strong>${title}</strong>`);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  function handleGetDirections() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Use the "Open in Maps" button below.');
      return;
    }
    setGettingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserPos([uLat, uLng]);
        setDistance(haversine(uLat, uLng, latitude, longitude));
        setGettingLocation(false);

        const map = mapInstance.current;
        if (!map) return;

        // Draw user position
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.circleMarker([uLat, uLng], {
          radius: 8,
          fillColor: '#2563EB',
          color: 'white',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map);
        userMarkerRef.current.bindPopup('Your location');

        // Draw route line
        if (routeLineRef.current) map.removeLayer(routeLineRef.current);
        routeLineRef.current = L.polyline(
          [
            [uLat, uLng],
            [latitude, longitude],
          ],
          { color: '#2563EB', weight: 3, dashArray: '8,8' }
        ).addTo(map);

        // Fit bounds to show both
        map.fitBounds(
          [
            [uLat, uLng],
            [latitude, longitude],
          ],
          { padding: [40, 40] }
        );
      },
      () => {
        setLocationError('Could not get your location. Allow location access or use "Open in Maps" below.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function openInExternalMaps() {
    if (userPos) {
      window.open(
        `https://www.openstreetmap.org/directions?from=${userPos[0]}%2C${userPos[1]}&to=${latitude}%2C${longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
        '_blank'
      );
    }
  }

  function openInGoogleMaps() {
    if (userPos) {
      window.open(
        `https://www.google.com/maps/dir/${userPos[0]},${userPos[1]}/${latitude},${longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        '_blank'
      );
    }
  }

  return (
    <div>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '280px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)', zIndex: 0 }}
      />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
        <button
          onClick={handleGetDirections}
          disabled={gettingLocation}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', background: 'var(--green)', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', opacity: gettingLocation ? 0.6 : 1,
          }}
        >
           {gettingLocation ? 'Getting your location...' : 'Get Directions'}
        </button>
        <button
          onClick={openInGoogleMaps}
          style={{
            padding: '10px 16px', background: 'white', color: 'var(--navy)',
            border: '1.5px solid var(--navy)', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Open in Google Maps 
        </button>
        <button
          onClick={openInExternalMaps}
          style={{
            padding: '10px 16px', background: 'white', color: 'var(--navy)',
            border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Open in OpenStreetMap 
        </button>
      </div>

      {locationError && (
        <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '8px', fontWeight: 600 }}>{locationError}</div>
      )}

      {distance !== null && (
        <div style={{
          fontSize: '13px', fontWeight: 700, color: 'var(--green-dark)',
          background: 'var(--green-light)', borderRadius: '8px', padding: '8px 14px',
          marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}>
          <MapPin size={16} /> You are {distance} km away from this property
        </div>
      )}

      {userPos && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Blue dot = your location. Dashed line = direct route. Tap "Open in Google Maps" for turn-by-turn navigation.
        </div>
      )}
    </div>
  );
}
