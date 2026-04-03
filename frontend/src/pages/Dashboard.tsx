import { useEffect, useState } from 'react';
import { useWebSocket } from '../useWebSocket';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAlertStore } from '../store';
import type { AlertData } from '../store';
import { AlertCircle, MapPin, Activity, Check, Shield, LogOut, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WS_URL = 'ws://127.0.0.1:8000/ws/alerts/';

function getThreatColor(score: number) {
  if (score >= 80) return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' };
  if (score >= 50) return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' };
  return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' };
}

function timeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export const Dashboard = () => {
  const { alerts, addAlert, removeAlert, setAlerts, token, logout } = useAlertStore();
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/alerts/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data.filter((a: AlertData) => a.status === 'active'));
        }
      })
      .catch(err => console.error(err));
  }, [setAlerts, token]);

  useWebSocket(WS_URL, {
    onMessage: (messageEvent) => {
      const data = JSON.parse(messageEvent.data);
      if (data.type === 'new_alert') {
        addAlert(data.alert);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
    },
    shouldReconnect: () => true,
  });

  const resolveAlert = async (id: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/alerts/${id}/resolve/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      removeAlert(id);
      if (selectedAlert?.id === id) setSelectedAlert(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0b0f1a] overflow-hidden">
      
      {/* ─── Sidebar ─── */}
      <div className="w-[380px] bg-[#0f1420] border-r border-white/[0.06] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">Dispatch</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs text-[#64748b] uppercase tracking-wider font-medium">
              {alerts.length} Active {alerts.length === 1 ? 'Incident' : 'Incidents'}
            </span>
          </div>
        </div>

        {/* Alert Queue */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#334155] px-6">
              <Check className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs mt-1">No active incidents</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {alerts.map(alert => {
                const colors = getThreatColor(alert.threat_score);
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? 'border-indigo-500/40 bg-indigo-500/[0.06]' 
                        : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-white">SOS Alert #{alert.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#475569]">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px]">{timeAgo(alert.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.border} ${colors.text} border`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        Threat: {alert.threat_score}
                      </div>
                      {alert.lat && (
                        <div className="flex items-center gap-1 text-[11px] text-[#475569]">
                          <MapPin className="w-3 h-3" />
                          {alert.lat.toFixed(2)}, {alert.lng.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Panel ─── */}
      <div className="flex-1 flex flex-col relative">
        {selectedAlert ? (
          <>
            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={[selectedAlert.lat || 34.05, selectedAlert.lng || -118.24]}
                zoom={14}
                key={`map-${selectedAlert.id}`}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ borderRadius: 0 }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[selectedAlert.lat || 34.05, selectedAlert.lng || -118.24]}>
                  <Popup>SOS Origin — {selectedAlert.lat?.toFixed(4)}, {selectedAlert.lng?.toFixed(4)}</Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Detail Bar */}
            <div className="h-auto bg-[#0f1420] border-t border-white/[0.06] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xl font-bold text-white">Incident #{selectedAlert.id}</h2>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getThreatColor(selectedAlert.threat_score).bg} ${getThreatColor(selectedAlert.threat_score).border} ${getThreatColor(selectedAlert.threat_score).text} border`}>
                      <Activity className="w-3 h-3" /> Score: {selectedAlert.threat_score}/100
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#64748b]">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {selectedAlert.lat?.toFixed(6)}, {selectedAlert.lng?.toFixed(6)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {new Date(selectedAlert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2.5 text-sm text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resolveAlert(selectedAlert.id)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Check className="w-4 h-4" /> Resolve
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#1e293b]">
            <Shield className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium text-[#334155]">Select an incident to view details</p>
            <p className="text-sm text-[#1e293b] mt-1">Alerts will appear in real-time on the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
};
