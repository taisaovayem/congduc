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

- Web Vite: `http://127.0.0.1:5173` (override `docker-compose.dev.yml` publish loopback)
- API / Postgres: loopback qua dev override — tránh trùng port thì chỉnh `API_PORT`, `DATABASE_PORT` trong `.env`
- Data Postgres tại `./docker/postgres-data`

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

Production **không publish port ra host** — `postgres`, `api`, `web` chỉ giao tiếp trên network Docker; `web` thêm `web_network` để `nginx-proxy` truy cập `http://congduc-web:80`. Không đụng `3000` / `8080` / `5432` trên máy host.

Mọi service dùng `restart: unless-stopped` — container tự chạy lại khi process lỗi hoặc sau khi Docker daemon / máy reboot (trừ khi bạn đã `docker compose stop` / `down`).

Kiểm tra:

```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml ps
docker compose -f docker-compose.yml -f docker-compose.server.yml logs -f web api
docker compose -f docker-compose.yml -f docker-compose.server.yml exec web wget -qO- http://127.0.0.1/ | head
```

### Chạy đúng proxy

**Luôn** kèm `docker-compose.server.yml` — container web tên cố định **`congduc-web`** trên `web_network` (giống `tmthan`, `packing-record-web`).

```sh
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build
docker exec nginx-proxy getent hosts congduc-web   # phải ra IP
docker restart nginx-proxy
```

Chỉ rebuild web:

```sh
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build web
docker exec nginx-proxy getent hosts congduc-web
docker restart nginx-proxy
```

**Không** `restart nginx-proxy` khi `getent hosts congduc-web` báo lỗi — nginx resolve upstream lúc khởi động, thiếu tên → **cả proxy sập** (mọi site).

Nếu nginx đang loop: tạm **comment** block `server_name` congduc trong `nginx.conf`, `docker restart nginx-proxy`, bật lại stack congduc, rồi bật block và restart.

### Ghi chú Dockerfile

| File | Mục đích |
|------|----------|
| `apps/api/Dockerfile` | Target **`production`**: build NestJS, `node dist/main.js`. Target **`development`**: `nest start --watch` (dùng với `docker-compose.dev.yml`). |
| `apps/web/Dockerfile` | Target **`production`**: `vite build` + **nginx:alpine**, cấu hình `apps/web/nginx.conf`. Target **`development`**: Vite dev server `:5173`. |
| `apps/web/nginx.conf` | SPA + `proxy_pass` tới `http://api:3000` cho `/api/` và WebSocket `/socket.io/`. |

Build args web (production): `VITE_API_URL`, `VITE_WS_URL` — trên server nên để rỗng để client gọi relative URL.

### Khối nginx (container `nginx-proxy` trên `web_network`)

Trong `http { }` (một lần), thêm resolver Docker — tránh nginx **emerg** khi congduc chưa chạy lúc restart:

```nginx
    resolver 127.0.0.11 valid=10s ipv6=off;
```

Block `server` (upstream **`congduc-web:80`**, tên container từ `docker-compose.server.yml`):

```nginx
    server {
        listen 80;
        server_name congduc.example.com;

        location / {
            set $congduc_upstream congduc-web;
            proxy_pass http://$congduc_upstream:80;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_connect_timeout 300s;
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
| `API_PORT` / `WEB_PORT` / `DATABASE_PORT` | Chỉ với **`docker-compose.dev.yml`** (publish loopback) |
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
