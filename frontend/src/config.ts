/**
 * Environment-aware configuration for API and WebSocket URLs.
 *
 * Development: Uses localhost:8000
 * Production (same origin, Docker/VPS): Uses relative URLs via nginx proxy
 * Production (split deploy, Render): Uses VITE_API_URL env var
 */

const isProd = import.meta.env.PROD;

// If VITE_API_URL is set, we're on a split deploy (frontend and backend on different domains)
// If empty/unset, we're on same origin (Docker/VPS) and nginx proxies everything
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

// Backend HTTP API base URL (no trailing slash)
export const API_BASE = isProd ? BACKEND_URL : 'http://127.0.0.1:8000';

// Full API path
export const API = `${API_BASE}/api`;

// WebSocket URL
export const WS_URL = isProd
  ? BACKEND_URL
    // Split deploy: derive ws:// from the backend URL
    ? `${BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/alerts/`
    // Same origin: use current page host
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/alerts/`
  : 'ws://127.0.0.1:8000/ws/alerts/';
