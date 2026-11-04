import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  streetAddress: string;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onStreetAddressChange: (addr: string) => void;
}

// Default center: Kampala city center
const KAMPALA_CENTER: [number, number] = [0.3476, 32.5825];

export default function LocationPicker({ latitude, longitude, streetAddress, onLocationChange, onStreetAddressChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Custom pin icon
  const pinIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="width:32px;height:42px;position:relative;">
      <svg width="32" height="42" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#2DBD4E" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: [number, number] = latitude && longitude ? [latitude, longitude] : KAMPALA_CENTER;
    const map = L.map(mapRef.current, {
      center,
      zoom: latitude && longitude ? 15 : 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e: L.DragEndEvent) => {
        const latlng = e.target.getLatLng();
        onLocationChange(latlng.lat, latlng.lng);
      });
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', (ev: L.DragEndEvent) => {
          const ll = ev.target.getLatLng();
          onLocationChange(ll.lat, ll.lng);
        });
      }
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when lat/lng changes externally
  useEffect(() => {
    if (!mapInstance.current || !latitude || !longitude) return;
    const map = mapInstance.current;
    map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e: L.DragEndEvent) => {
        const ll = e.target.getLatLng();
        onLocationChange(ll.lat, ll.lng);
      });
    }
  }, [latitude, longitude]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Uganda')}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        onLocationChange(parseFloat(lat), parseFloat(lon));
        if (!streetAddress) onStreetAddressChange(display_name.split(',').slice(0, 3).join(','));
      } else {
        setSearchError('Location not found. Try searching for an area or district name.');
      }
    } catch {
      setSearchError('Search failed. Please try again or pin manually on the map.');
    } finally {
      setSearching(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setGettingLocation(false);
      },
      (err) => {
        setSearchError('Could not get your location. Please pin manually on the map.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearLocation() {
    onLocationChange(null, null);
    if (markerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          placeholder="Search for area, e.g. Kololo Kampala..."
          style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          style={{ padding: '10px 16px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: searching ? 0.6 : 1 }}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gettingLocation}
          style={{ padding: '8px 14px', background: 'var(--green-light)', color: 'var(--green-dark)', border: '1.5px solid var(--green)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: gettingLocation ? 0.6 : 1 }}
        >
          <MapPin size={14} /> {gettingLocation ? 'Getting location...' : 'Use My Current Location'}
        </button>
        {latitude && longitude && (
          <button
            type="button"
            onClick={clearLocation}
            style={{ padding: '8px 14px', background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #FCA5A5', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Clear Pin
          </button>
        )}
      </div>

      {searchError && (
        <div style={{ fontSize: '12px', color: '#991B1B', marginBottom: '8px', fontWeight: 600 }}>{searchError}</div>
      )}

      <div
        ref={mapRef}
        style={{ width: '100%', height: '300px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)', zIndex: 0 }}
      />

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
        Click on the map to drop a pin, or drag the pin to fine-tune the exact location.
        {latitude && longitude && (
          <span style={{ color: 'var(--green)', fontWeight: 700, display: 'block', marginTop: '2px' }}>
             Pinned at {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '10px' }}>
        <label>Street address / landmark <span className="opt">(optional)</span></label>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => onStreetAddressChange(e.target.value)}
          placeholder="e.g. Plot 12, Kololo Hill Drive, near Kampala Serena Hotel"
        />
      </div>
    </div>
  );
}
