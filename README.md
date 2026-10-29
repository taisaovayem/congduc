# congduc

Web thắp hương, gõ mõ và công đức — monorepo NestJS + React (Vite).

## Chạy local (không Docker)

```bash
npm install
cp .env.example .env
# Chỉnh VITE_API_URL / VITE_WS_URL trỏ tới API (mặc định localhost:3000)
npm run migration:run
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2
```

Mở `http://localhost:5173`. PostgreSQL chạy trên máy hoặc container riêng; `.env` dùng `DATABASE_HOST=localhost`.

## Docker — local / kiểm thử stack

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Web Vite: `http://localhost:5173` (hoặc `WEB_PORT` trong `.env`)
- API: `http://127.0.0.1:3000`
- Postgres: `127.0.0.1:5432`, data tại `./docker/postgres-data`

API tự chạy migration khi khở động.

## Docker — production trên server (cùng network với nginx)

Stack gồm **postgres + api + web** (nginx phục vụ file tĩnh và proxy `/api`, `/socket.io` tới `api:3000`). Chỉ container **web** tham gia network ngoài `web_network` để `nginx-proxy` (hoặc nginx chung) reverse proxy theo tên miền.

Network phải tạo sẵn trên server (nếu chưa có):

```bash
docker network create web_network
```

Trên server, copy `.env.example` → `.env`, đặt mật khẩu DB mạnh và **để trống** `VITE_API_URL` / `VITE_WS_URL` (build web dùng cùng origin qua nginx):

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build
```

Kiểm tra:

```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml ps
docker compose -f docker-compose.yml -f docker-compose.server.yml logs -f web api
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

(`WEB_PORT` mặc định `8080` — chỉ bind loopback để debug; traffic công khai đi qua nginx.)

### Chạy đúng proxy

Sau khi đã có `postgres` và `api`, hoặc vừa sửa `docker-compose.server.yml` / image web — chỉ bật lại **web** kèm override server (để container vào `web_network` với alias `congduc-web`), rồi reload nginx ngoài:

```sh
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d web
docker restart nginx-proxy
docker logs --tail 30 nginx-proxy
```

Lần deploy đầu hoặc đổi API/DB vẫn dùng `up -d --build` cả stack (lệnh ở trên). Chỉ cần ba lệnh trên khi chỉnh web hoặc nginx không thấy upstream.

### Ghi chú Dockerfile

| File | Mục đích |
|------|----------|
| `apps/api/Dockerfile` | Target **`production`**: build NestJS, `node dist/main.js`. Target **`development`**: `nest start --watch` (dùng với `docker-compose.dev.yml`). |
| `apps/web/Dockerfile` | Target **`production`**: `vite build` + **nginx:alpine**, cấu hình `apps/web/nginx.conf`. Target **`development`**: Vite dev server `:5173`. |
| `apps/web/nginx.conf` | SPA + `proxy_pass` tới `http://api:3000` cho `/api/` và WebSocket `/socket.io/`. |

Build args web (production): `VITE_API_URL`, `VITE_WS_URL` — trên server nên để rỗng để client gọi relative URL.

### Khối nginx (container `nginx-proxy` trên `web_network`)

Thêm `server` trỏ upstream **`congduc-web:80`** (alias trong `docker-compose.server.yml`):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name congduc.example.com;

    location / {
        proxy_pass http://congduc-web:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_connect_timeout 60s;
        proxy_read_timeout 86400s;
    }
}
```

Đổi `congduc.example.com` thành tên miền thật. **Không** gắn `api` hay `postgres` vào `web_network` — chỉ `web` được expose qua proxy; API và DB chỉ trong network nội bộ của compose.

HTTPS: cấu hình TLS tại Cloudflare hoặc thêm listener `443` trên nginx-proxy (giống các app khác trên cùng server).

### Biến môi trường

| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_*` | Postgres (trong compose: `DATABASE_HOST=postgres`) |
| `API_PORT` / `WEB_PORT` | Port bind **127.0.0.1** trên host (debug) |
| `VITE_API_URL` / `VITE_WS_URL` | Build frontend; production Docker: để trống |
| `WEB_NETWORK` | Tên network ngoài (mặc định `web_network`) |

Dữ liệu Postgres: `./docker/postgres-data` — backup thư mục này trước khi nâng cấp.

## Lệnh hữu ích

```bash
npm run build
npm run migration:run
docker compose down
docker compose -f docker-compose.yml -f docker-compose.server.yml down
```
