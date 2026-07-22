import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MARKER_COLOR, UNLOCK_DISTANCE } from '../utils.js';

const userIcon = L.divIcon({
  className: '',
  iconSize: [20, 20], iconAnchor: [10, 10],
  html: `<div class="user-dot"></div>`,
});

const iconCache = {};

function createCpIcon(orderNum, taskType, status, cp) {
  const cacheKey = `${orderNum}_${taskType}_${status}_${cp.difficulty}`;
  if (iconCache[cacheKey]) {
    return iconCache[cacheKey];
  }

  // GOTG cyberpunk status colors
  const color =
    status === 'completed' ? '#00FF88' : // GotG Electric Green
    status === 'current'   ? '#FFC800' : // GotG Gold
    cp.difficulty === 'hard' ? '#FF0055' : // GotG Volt Magenta
    '#8A2BE2'; // GotG Active Purple

  const glow = status === 'future'
    ? 'drop-shadow(0 0 3px rgba(138,43,226,0.4))'
    : `drop-shadow(0 0 10px ${color})`;

  const opacity = status === 'future' ? 0.65 : 1;

  const icon = L.divIcon({
    className: '',
    iconSize: [42, 50], iconAnchor: [21, 50],
    html: `<div style="opacity:${opacity};width:42px;height:50px;">
      <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;height:100%;filter:${glow}">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
          fill="${color}" stroke="#0A0314" stroke-width="2"/>
        <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="900"
          font-family="Orbitron,Arial,sans-serif" fill="#0A0314">
          ${status === 'completed' ? '✔' : orderNum}
        </text>
      </svg></div>`,
  });

  iconCache[cacheKey] = icon;
  return icon;
}

function AutoCenter({ userPos, currentCp }) {
  const map  = useMap();
  const prev = useRef(null);

  useEffect(() => {
    if (!userPos && !currentCp) return;

    const key = userPos
      ? `${userPos.lat.toFixed(4)},${userPos.lng.toFixed(4)}`
      : String(currentCp?.id);

    if (key !== prev.current) {
      prev.current = key;
      if (userPos) {
        // Only recenter if map center is far from new userPos (approx > 8 meters)
        const currentCenter = map.getCenter();
        const diffLat = Math.abs(currentCenter.lat - userPos.lat);
        const diffLng = Math.abs(currentCenter.lng - userPos.lng);
        if (diffLat > 0.000075 || diffLng > 0.000075) {
          map.setView([userPos.lat, userPos.lng], map.getZoom(), { animate: true });
        }
      } else if (currentCp) {
        map.setView([currentCp.lat, currentCp.lng], 16, { animate: true });
      }
    }
  }, [userPos, currentCp, map]);

  return null;
}

export default function StudentMap({ userPos, checkpoints, currentCp }) {
  const centre = userPos
    ? [userPos.lat, userPos.lng]
    : currentCp ? [currentCp.lat, currentCp.lng] : [40.7851, -73.9683];

  const cpIndex = checkpoints.findIndex(cp => cp.id === currentCp?.id);

  function getStatus(cp, i) {
    if (i < cpIndex) return 'completed';
    if (cp.id === currentCp?.id) return 'current';
    return 'future';
  }

  return (
    <MapContainer center={centre} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      {/* Dark Matter cyberpunk space map layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <AutoCenter userPos={userPos} currentCp={currentCp} />

      {/* User location */}
      {userPos && (
        <>
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
          <Circle
            center={[userPos.lat, userPos.lng]}
            radius={UNLOCK_DISTANCE}
            pathOptions={{ color: '#00FFD2', fillColor: '#00FFD2', fillOpacity: 0.05, weight: 1, dashArray: '4 4' }}
          />
        </>
      )}

      {/* Checkpoints */}
      {checkpoints.map((cp, i) => (
        <Marker
          key={cp.id}
          position={[cp.lat, cp.lng]}
          icon={createCpIcon(cp.order_num, cp.task_type, getStatus(cp, i), cp)}
        />
      ))}

      {/* Unlock radius around current target */}
      {currentCp && (
        <Circle
          center={[currentCp.lat, currentCp.lng]}
          radius={UNLOCK_DISTANCE}
          pathOptions={{ color: '#00FF88', fillColor: '#00FF88', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
        />
      )}
    </MapContainer>
  );
}
