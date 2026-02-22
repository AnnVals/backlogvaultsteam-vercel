# 🎮 BacklogVault

> Importa tus juegos de Steam automáticamente y lleva un orden de tus juegos.

---

## ✅ Features

- Filtro por estado en tiempo real
- Import automático desde Steam (con Steam ID)
- Añadir juegos manualmente desde el explorador (RAWG)
- Vista lista y grid de tu biblioteca
- Ordenación alfabética
- Puntuación por estrellas (1-5)
- Cambio de estado por juego (jugando, completado, pendiente, abandonado, deseado)
- Acciones en masa (cambiar estado, eliminar)
- Estadísticas: juegos sin clasificar, últimos añadidos, distribución por estado

---

## ⚠️ Sobre el Import de Nintendo Switch

Nintendo **no tiene API oficial pública**. La comunidad ha reverse-engineered la API de Nintendo Switch Online, lo que técnicamente viola los TOS de Nintendo. **No será implementado.**

---

## 🏗️ Stack

### Frontend
| Librería | Uso |
|----------|-----|
| **React 18** + **TypeScript 5** | Framework principal |
| **Vite 5** | Build tool |
| **React Router v6** | Routing |
| **TanStack Query v5** | Server state & cache |
| **Zustand 4** | Client state (auth) |
| **Framer Motion 11** | Animaciones |
| **Recharts 2** | Gráficas de estadísticas |
| **Axios** | HTTP con interceptores JWT |
| **Lucide React** | Iconos |

### Backend
| Librería | Uso |
|----------|-----|
| **Node.js 22** + **Express 4** | Runtime + HTTP |
| **TypeScript 5** | Tipado estático |
| **PostgreSQL 16** + **pg** | Base de datos |
| **JWT** + **bcryptjs** | Auth |
| **Helmet** + **express-rate-limit** | Seguridad |
| **axios** | Llamadas a APIs externas |

### APIs Externas
| API | Gratuita | Uso |
|-----|----------|-----|
| **Steam Web API** | ✅ Sí | Import biblioteca personal |
| **RAWG.io** | ✅ Sí (40k req/mes) | Metadatos, portadas, búsqueda |

---

## 📁 Estructura

```
backlogvault/
├── frontend/src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── LibraryPage.tsx         ← Vista principal con filtros, lista/grid, estrellas
│   │   ├── ExplorePage.tsx         ← Buscar y añadir juegos via RAWG
│   │   ├── ImportPage.tsx          ← Import Steam
│   │   └── StatsPage.tsx           ← Estadísticas
│   ├── components/layout/
│   │   └── Layout.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── hooks/
│   │   └── useBacklogVault.ts
│   └── services/
│       └── api.ts
│
├── backend/src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── libraryController.ts
│   │   ├── gamesController.ts
│   │   └── importController.ts
│   ├── services/
│   │   └── steam/
│   │       └── steamService.ts
│   ├── database/
│   │   └── migrate.ts
│   └── routes/index.ts
│
└── docker-compose.yml
```

---

## 🚀 Setup

### 1. Prerrequisitos
```
node >= 20
Docker (para PostgreSQL)
API Keys:
  - RAWG: https://rawg.io/apidocs (gratis)
  - Steam: https://steamcommunity.com/dev/apikey (gratis)
```

### 2. Instalar
```bash
git clone <repo>
cd backlogvault
npm run install:all
cp backend/.env.example backend/.env
# Editar .env con tus keys
```

### 3. Base de datos
```bash
docker-compose up postgres -d
npm run db:migrate
```

### 4. Desarrollo
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me          [JWT]
```

### Library
```
GET    /api/library              [JWT]  ?platform=&status=
POST   /api/library              [JWT]
PUT    /api/library/:id          [JWT]
DELETE /api/library/:id          [JWT]
DELETE /api/library              [JWT]  (vaciar todo)
```

### Games (RAWG)
```
GET /api/games/search?q=
GET /api/games/popular
```

### Import
```
GET  /api/import/steam/preview/:steamId
POST /api/import/steam           [JWT]
POST /api/import/csv             [JWT]
```

### Stats
```
GET /api/stats                   [JWT]
```

---

## 📊 Schema PostgreSQL

```sql
users (id, username, email, password_hash, steam_id, created_at, updated_at)

games (id, rawg_id, steam_appid, title, cover_url, background_url,
       release_date, genres[], platforms[], created_at)

user_library (id, user_id, game_id, platform, status, source,
              hours_played, rating, notes, external_id, added_at, updated_at)

import_logs (id, user_id, service, games_found, games_imported, games_skipped, error, created_at)
```

`status` = `playing` | `completed` | `wishlist` | `dropped` | `backlog` | `null`

`rating` = 1–10 internamente (se muestra como 1–5 estrellas en la UI)

---

## 🎮 Flujo Import Steam

```
Usuario introduce Steam ID
        ↓
GET /api/import/steam/preview/:steamId
        ↓
Backend llama Steam Web API → GetOwnedGames
        ↓
Preview con juegos (puede deseleccionar)
        ↓
POST /api/import/steam → upsert en games + user_library
```

> El perfil de Steam debe estar en **público** (Steam > Privacidad > Datos de juego: Público)