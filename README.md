# 🛡️ CrisisResponse — Real-Time Decentralized Security Platform

A real-time, event-driven crisis response system for decentralized hospitality properties. Guests trigger emergency SOS alerts via a web interface, which are instantly routed to a security dispatch dashboard using WebSockets — **zero page reloads, sub-second latency**.

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.2-38bdf8?logo=tailwindcss)
![WebSocket](https://img.shields.io/badge/WebSocket-Channels-purple)

---

## 🏗️ Architecture

```
Guest Device                    Django Backend                 Responder Dashboard
┌──────────┐    WebSocket     ┌──────────────┐    WebSocket    ┌──────────────┐
│  SOS App  │ ──────────────► │  Channels    │ ──────────────► │  Dispatch UI │
│  (React)  │   JSON Payload  │  Consumer    │   Broadcast     │  (React)     │
│           │                 │  + ML Score  │                 │  + Leaflet   │
└──────────┘                  └──────────────┘                 └──────────────┘
     │                              │                                │
     ▼                              ▼                                ▼
 Geolocation                   SQLite DB                        Zustand Store
 Accelerometer                 JWT Auth                         Audio Alerts
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🆘 **SOS Trigger** | One-tap emergency button with 10-second smart intercept countdown |
| 📡 **WebSocket Push** | Persistent bidirectional channels via Django Channels |
| 🧠 **AI Threat Scoring** | Simulated ML engine assigns threat scores (1–100) to incoming alerts |
| 🗺️ **Live Geolocation** | HTML5 GPS coordinates plotted on Leaflet/OpenStreetMap |
| 🔐 **JWT Authentication** | Secure login/register with SimpleJWT token management |
| 📊 **Dispatch Dashboard** | Real-time triage queue sorted by threat severity |
| 🔊 **Audio Notifications** | Browser audio chime on incoming alerts |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/CrisisResponse.git
cd CrisisResponse
```

### 2. Backend Setup
```bash
cd crisis_backend
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers channels daphne
python manage.py migrate
python manage.py runserver
```
The Django server starts at `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Vite dev server starts at `http://localhost:5173`

### 4. Open the App
| Page | URL |
|------|-----|
| Landing Page | `http://localhost:5173/` |
| Register | `http://localhost:5173/register` |
| Login | `http://localhost:5173/login` |
| Guest SOS | `http://localhost:5173/guest` |
| Dispatch Dashboard | `http://localhost:5173/dashboard` |

## 🧪 Demo Flow

1. Open `/guest` in one browser tab (mobile viewport recommended)
2. Open `/dashboard` in another tab (desktop viewport)
3. Register an account → Login → Access Dashboard
4. Tap **SOS** on the Guest page
5. Watch the alert appear instantly on the Dashboard with a threat score and map pin

## 📁 Project Structure

```
CrisisResponse/
├── crisis_backend/          # Django Backend
│   ├── alerts/              # Core app (models, views, consumers, routing)
│   │   ├── models.py        # Property & Alert models
│   │   ├── views.py         # REST API + RegisterView
│   │   ├── consumers.py     # WebSocket AlertConsumer + ML scoring
│   │   ├── serializers.py   # DRF serializers
│   │   ├── routing.py       # WebSocket URL routing
│   │   └── urls.py          # REST API URLs + Auth endpoints
│   ├── crisis_backend/      # Django project settings
│   │   ├── settings.py      # Channels, JWT, CORS config
│   │   ├── asgi.py          # ASGI application routing
│   │   └── urls.py          # Root URL configuration
│   └── manage.py
├── frontend/                # React Frontend (Vite + Tailwind v4)
│   ├── src/
│   │   ├── pages/           # Home, Login, Register, Guest, Dashboard
│   │   ├── components/      # ProtectedRoute
│   │   ├── store.ts         # Zustand state (alerts + auth)
│   │   ├── useWebSocket.ts  # Custom WebSocket hook
│   │   └── index.css        # Tailwind v4 theme config
│   └── package.json
├── docker-compose.yml       # Redis (optional, for production)
├── .gitignore
└── README.md
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Zustand, Leaflet |
| Backend | Django 4.2, Django REST Framework, Django Channels |
| Auth | SimpleJWT (JSON Web Tokens) |
| Real-Time | WebSockets via Django Channels |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Map | Leaflet + OpenStreetMap / CartoDB Dark Tiles |

## 📜 License

This project is built for hackathon demonstration purposes.
