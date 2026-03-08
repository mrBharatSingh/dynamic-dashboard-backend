# API Examples – Dashboard Backup & Sharing

Base URL: `http://localhost:5000/api/dashboard`

---

## Swagger UI (Interactive Docs)

Open in browser:

```
http://localhost:5000/api/docs
```

## Swagger JSON (OpenAPI 3.0 Spec)

```
GET http://localhost:5000/swagger.json
```

Use this URL with openapi-generator, NSwag, or any OpenAPI-compatible tool to
auto-generate TypeScript interfaces and API clients for the Angular frontend.

---

## 1. Backup (Create) a Dashboard

### curl

```sh
curl -X POST http://localhost:5000/api/dashboard/backup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "dashboardName": "AI Tools",
    "widgets": [
      {
        "id": "1",
        "x": 0,
        "y": 0,
        "w": 2,
        "h": 2,
        "name": "Google",
        "url": "https://www.google.com",
        "backgroundColor": "3B82F6"
      }
    ]
  }'
```

### fetch

```js
const res = await fetch("http://localhost:5000/api/dashboard/backup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    dashboardName: "AI Tools",
    widgets: [{ id: "1", x: 0, y: 0, w: 2, h: 2, name: "Google", url: "https://www.google.com", backgroundColor: "3B82F6" }],
  }),
});
const data = await res.json();
console.log(data);
```

---

## 2. Get All Dashboards for a User

### curl

```sh
curl http://localhost:5000/api/dashboard/user/user@example.com
```

### fetch

```js
const res = await fetch("http://localhost:5000/api/dashboard/user/user@example.com");
const data = await res.json();
console.log(data);
```

---

## 3. Get Single Dashboard

**GET** `/api/dashboard/single/:dashboardId`

### curl

```sh
curl http://localhost:5000/api/dashboard/single/<dashboardId>
```

### fetch

```js
const res = await fetch(`http://localhost:5000/api/dashboard/single/${dashboardId}`);
const data = await res.json();
```

---

## 4. Update Dashboard

### curl

```sh
curl -X PUT http://localhost:5000/api/dashboard/<dashboardId> \
  -H "Content-Type: application/json" \
  -d '{
    "dashboardName": "Updated Name",
    "widgets": []
  }'
```

### fetch

```js
const res = await fetch(`http://localhost:5000/api/dashboard/${dashboardId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ dashboardName: "Updated Name", widgets: [] }),
});
const data = await res.json();
```

---

## 5. Delete Dashboard

### curl

```sh
curl -X DELETE http://localhost:5000/api/dashboard/<dashboardId>
```

### fetch

```js
const res = await fetch(`http://localhost:5000/api/dashboard/${dashboardId}`, { method: "DELETE" });
const data = await res.json();
```

---

## 6. Share Dashboard

### curl

```sh
curl -X POST http://localhost:5000/api/dashboard/share/<dashboardId>
```

### fetch

```js
const res = await fetch(`http://localhost:5000/api/dashboard/share/${dashboardId}`, { method: "POST" });
const data = await res.json();
// data.shareUrl  → "/dashboard/shared/<dashboardId>"
// data.fullUrl   → "http://localhost:4200/dashboard/shared/<dashboardId>"
```

---

## 7. Get Shared Dashboard (Public)

### curl

```sh
curl http://localhost:5000/api/dashboard/shared/<dashboardId>
```

### fetch

```js
const res = await fetch(`http://localhost:5000/api/dashboard/shared/${dashboardId}`);
const data = await res.json();
```

---

## Health Check

```sh
curl http://localhost:5000/health
```
