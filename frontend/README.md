# Frontend

Frontend aplikasi berbasis **Next.js**, **React**, dan **TypeScript**. UI menggunakan komponen **shadcn/ui**; request API menggunakan **Axios**, sedangkan **TanStack Query** menangani state dan cache server.

## Menjalankan

Butuh Node.js dan pnpm. Dari folder `frontend`, jalankan:

```bash
pnpm install
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Jalankan frontend di http://localhost:3000

```bash
pnpm dev
```

Script lain yang tersedia:

```bash
pnpm build
pnpm start
pnpm lint
```
