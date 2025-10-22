import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 아이콘 경로 문제 해결(번들러용 CDN 사용)
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng); }
  });
  return null;
}

export default function MapPicker({
  open,
  onClose,
  onSelect,
  initial = { lat: 37.5665, lng: 126.9780 }, // 서울 시청
}) {
  const mapRef = useRef(null);
  const [pos, setPos] = useState(initial);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => { if (open) setPos(initial); }, [open, initial]);

  const flyTo = (latlng) => {
    setPos(latlng);
    const map = mapRef.current;
    if (map) map.flyTo(latlng, 15, { duration: 0.5 });
  };

  const search = async () => {
    if (!q.trim()) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'Accept-Language': 'ko' } });
    const j = await r.json();
    setResults(
      j.map((it) => ({
        label: it.display_name,
        lat: parseFloat(it.lat),
        lng: parseFloat(it.lon),
      }))
    );
    if (j[0]) flyTo({ lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) });
  };

  if (!open) return null;

  return (
    <div className="map-modal">
      <div className="map-card">
        <div className="map-head">
          <input
            className="map-search"
            placeholder="주소/장소 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button className="map-btn" onClick={search}>검색</button>
          <button className="map-btn ghost" onClick={onClose}>닫기</button>
        </div>

        <div className="map-body">
          <div className="map-left">
            <MapContainer
              center={pos}
              zoom={13}
              style={{ height: 360, width: '100%', borderRadius: 12 }}
              whenCreated={(m) => (mapRef.current = m)}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickToPick onPick={(ll) => setPos(ll)} />
              <Marker
                position={pos}
                icon={markerIcon}
                draggable={true}
                eventHandlers={{ dragend: (e) => setPos(e.target.getLatLng()) }}
              />
            </MapContainer>
            <div className="map-foot">
              <div className="map-ll">
                위도 {pos.lat.toFixed(5)} / 경도 {pos.lng.toFixed(5)}
              </div>
              <button
                className="map-btn primary"
                onClick={() => {
                  onSelect({ lat: pos.lat, lng: pos.lng, accuracy: null });
                  onClose();
                }}
              >
                이 위치로 선택
              </button>
            </div>
          </div>

          <div className="map-right">
            <div className="map-results">
              {results.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  className="map-result"
                  onClick={() => flyTo({ lat: r.lat, lng: r.lng })}
                  title={r.label}
                >
                  {r.label}
                </button>
              ))}
              {!results.length && <div className="map-result empty">검색 결과가 여기에 표시됩니다.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
