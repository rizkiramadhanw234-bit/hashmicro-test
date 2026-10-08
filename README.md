# Web Application

Hashmicro test project dengan frontend **Next.js, React, TypeScript**, dan backend **Express.js, TypeScript, TypeORM** menggunakan SQLite. Frontend memakai **Axios** untuk request API, **TanStack Query** untuk pengelolaan data server, dan **shadcn/ui** untuk komponen antarmuka. Backend disusun dengan pemisahan route, controller, service, dan entity.

## Struktur

```text
backend/   Express REST API, autentikasi, dan pengelolaan data
frontend/  Next.js web application
```

## Menjalankan Secara Lokal

Butuh Node.js dan pnpm. Jalankan backend dan frontend di terminal terpisah.

### 1. Backend

```bash
cd backend
pnpm install
```

Buat file `backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET_KEY=buat-secret-acak-yang-kuat
JWT_EXPIRES_IN=15m
NODE_ENV=development
```

Lalu jalankan:

```bash
pnpm dev
```

API tersedia di `http://localhost:5000/api`. Database SQLite `database.sqlite` dibuat otomatis di folder backend.

### 2. Frontend

Di terminal lain:

```bash
cd frontend
pnpm install
```

Buat file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Jalankan frontend di `http://localhost:3000`:

```bash
pnpm dev
```

## Perintah

Di folder `backend`: `pnpm build`, `pnpm start`, `pnpm test`.

Di folder `frontend`: `pnpm build`, `pnpm start`, `pnpm lint`.

Detail endpoint dan konfigurasi tersedia di [backend/README.md](backend/README.md) dan [frontend/README.md](frontend/README.md).
