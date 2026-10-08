# Backend API

REST API berbasis **Express.js**, **TypeScript**, dan **TypeORM** dengan database SQLite. Struktur code memisahkan route, controller, service, dan entity. Untuk unit testing menggunakan **Vitest**.

## Menjalankan

Butuh Node.js dan pnpm. Dari folder `backend`, jalankan:

```bash
pnpm install
```

Buat file `.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET_KEY=kudukuats
JWT_EXPIRES_IN=15m
```

Jalankan server development atau build production:

```bash
pnpm dev
```

```bash
pnpm build
pnpm start
```

```bash
pnpm test

Database `database.sqlite` dibuat otomatis oleh TypeORM di folder backend.

## Endpoint

Semua endpoint menggunakan prefix `/api`.

| Method           | Endpoint              | Keterangan                                                  |
| ---------------- | --------------------- | ----------------------------------------------------------- |
| POST             | `/auth/create`        | Membuat akun                                                |
| POST             | `/auth/login`         | Login dan menerima access token serta refresh cookie        |
| POST             | `/auth/refresh-token` | Memperbarui token                                           |
| POST             | `/auth/logout`        | Logout                                                      |
| GET              | `/users`              | Melihat semua user (perlu autentikasi)                      |
| GET, PUT, DELETE | `/users/:id`          | Membaca, mengubah, dan menghapus user (perlu autentikasi)   |
| GET, POST        | `/products`           | Membaca dan membuat produk (perlu autentikasi)              |
| GET, PUT, DELETE | `/products/:id`       | Membaca, mengubah, dan menghapus produk (perlu autentikasi) |

Endpoint yang memerlukan autentikasi menerima access token melalui header `Authorization: Bearer <token>`.
```
