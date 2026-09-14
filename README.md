# 🛒 Registro de Compras

Sistema fullstack sencillo con login, roles (admin/cliente) y registro de compras.
**Stack:** Node.js + Express + MongoDB (Mongoose) + frontend vanilla servido por el mismo servidor.

## Estructura
```
├── server.js          # Punto de entrada (Express)
├── seed.js            # Datos de prueba
├── models/            # User.js, Purchase.js
├── routes/            # auth, purchases, admin
├── middleware/        # auth.js (JWT + roles)
├── public/index.html  # Login + Dashboard (SPA)
└── .env               # Variables de entorno
```

## Ejecutar en local
```bash
npm install
cp .env.example .env      # completa MONGODB_URI y JWT_SECRET
npm run seed              # crea usuarios de prueba + compras de ejemplo
npm start                 # http://localhost:3000
```

## Usuarios de prueba
| Rol     | Email             | Contraseña   |
|---------|-------------------|--------------|
| Admin   | admin@demo.com    | admin123     |
| Cliente | cliente@demo.com  | cliente123   |

## Despliegue en Render (gratis)

### 1. Base de datos (MongoDB Atlas — gratis)
1. Crea cuenta en https://cloud.mongodb.com → **Build a Database → M0 FREE**.
2. En **Database Access** crea un usuario con contraseña.
3. En **Network Access** agrega `0.0.0.0/0` (acceso desde cualquier IP).
4. En **Databases → Connect → Drivers → Node.js** copia la URI:
   `mongodb+srv://USUARIO:PASSWORD@cluster0.xxx.mongodb.net/registro_compras`

### 2. Subir el código
```bash
git init && git add . && git commit -m "app"
# crea un repo en GitHub y súbelo:
git remote add origin https://github.com/TU_USUARIO/registro-compras.git
git push -u origin main
```

### 3. Crear el Web Service en Render
1. https://dashboard.render.com → **New → Web Service** → conecta tu repo.
2. Configuración:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. En **Environment Variables** agrega:
   - `MONGODB_URI` = tu URI de Atlas
   - `JWT_SECRET` = una clave larga aleatoria
4. **Deploy**. Render te da una URL `https://tu-app.onrender.com`.

### 4. Poblar la base de datos (una sola vez)
En tu máquina local, apuntando el `.env` a la URI de Atlas:
```bash
npm run seed
```

## Alternativas a Render
| Plataforma | Nota |
|---|---|
| **Railway** | Muy parecida a Render, despliegue aún más rápido (conectas repo y listo). Plan gratis con límites de uso. |
| **Vercel / Netlify** | Geniales para frontend, pero necesitas separar backend y MongoDB Atlas; con Render llevas todo en un solo servicio, más simple. |

> ⚠️ Los planes gratis de Render "duermen" el servicio tras ~15 min sin uso y tarda ~50 s en despertar. Railway tiene el mismo comportamiento.
