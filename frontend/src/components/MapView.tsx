import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { AlertData } from '../store';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Severity-coded custom markers using divIcon
function createMarkerIcon(severity: string) {
  const markerClass = severity === 'critical' ? 'marker-critical'
    : severity === 'medium' ? 'marker-warning'
    : 'marker-safe';

  return L.divIcon({
    className: '',
    html: `<div class="${markerClass}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Component to fly to selected alert
function FlyToAlert({ alert }: { alert: AlertData | null }) {
  const map = useMap();

  useEffect(() => {
    if (alert && alert.lat && alert.lng) {
      map.flyTo([alert.lat, alert.lng], 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [alert, map]);

  return null;
}

interface MapViewProps {
  alerts: AlertData[];
  selectedAlert: AlertData | null;
  onAlertSelect: (alert: AlertData) => void;
}

export const MapView = ({ alerts, selectedAlert, onAlertSelect }: MapViewProps) => {
  const center = useMemo<[number, number]>(() => {
    if (selectedAlert?.lat && selectedAlert?.lng) {
      return [selectedAlert.lat, selectedAlert.lng];
    }
    if (alerts.length > 0) {
      const a = alerts[0];
      return [a.lat || 28.61, a.lng || 77.21];
    }
    return [28.6139, 77.2090];
  }, []);

  const TYPE_LABELS: Record<string, string> = {
    fire: '🔥 Fire',
    flood: '🌊 Flood',
    medical: '🏥 Medical',
    security: '🔒 Security',
    routine: '📋 Routine',
  };

  return (
    <div className="w-full h-full relative">
      {/* Map gradient overlay at edges */}
      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(6,10,19,0.3) 0%, transparent 5%, transparent 95%, rgba(6,10,19,0.3) 100%),
            linear-gradient(to bottom, rgba(6,10,19,0.4) 0%, transparent 8%, transparent 92%, rgba(6,10,19,0.4) 100%)
          `
        }}
      />

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ borderRadius: 0, background: '#060a13' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FlyToAlert alert={selectedAlert} />

        {alerts.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat || 28.61, a.lng || 77.21]}
            icon={createMarkerIcon(a.severity)}
            eventHandlers={{
              click: () => onAlertSelect(a),
            }}
          >
            <Popup>
              <div className="min-w-[180px] p-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">#{a.id}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    a.severity === 'critical' ? 'bg-[#ff2d55]/20 text-[#ff2d55]' :
                    a.severity === 'medium' ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                    'bg-[#30d158]/20 text-[#30d158]'
                  }`}>
                    {a.severity}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-[#8892b0]">
                  <div>{TYPE_LABELS[a.emergency_type] || a.emergency_type}</div>
                  {a.room_number && <div>📍 Room {a.room_number}</div>}
                  <div>⚡ Threat: {a.threat_score}/100</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Alert count overlay */}
      <div className="absolute top-4 left-4 z-30 glass-panel rounded-xl px-3 py-2 flex items-center gap-2">
        <div className={`live-dot ${alerts.some(a => a.severity === 'critical') ? 'live-dot-critical' : 'live-dot-safe'}`} />
        <span className="text-[11px] font-mono text-[#8892b0]">
          {alerts.length} Active
        </span>
      </div>
    </div>
  );
};
