# 🌿 Ce-Kalan - Fullstack App
> Herramienta agrícola de gestión de plaguicidas

---

## 📁 Estructura del Proyecto

```
App/
├── database/
│   └── cekalan.sql          ← Script SQL para XAMPP
├── backend/                 ← API Node.js + Express
│   ├── config/
│   │   ├── database.js      ← Conexión MySQL (mysql2)
│   │   └── multer.js        ← Subida de imágenes
│   ├── controllers/         ← Lógica de negocio
│   ├── middleware/
│   │   └── auth.js          ← JWT middleware
│   ├── routes/              ← Rutas de la API
│   ├── uploads/             ← Imágenes (se crea automáticamente)
│   ├── .env.example         ← Plantilla de variables de entorno
│   ├── seed.js              ← Script para poblar la DB con datos de prueba
│   └── server.js            ← Punto de entrada
└── frontend/                ← App React Native + Expo
    ├── assets/              ← Íconos y splash screen
    ├── src/
    │   ├── config/
    │   │   └── api.js       ← ⚠️ EDITAR IP AQUÍ
    │   ├── context/         ← Auth + Language contexts
    │   ├── constants/       ← Theme + Translations
    │   ├── navigation/      ← Stack + Tab Navigator
    │   └── screens/         ← Pantallas de la app
    └── App.js               ← Punto de entrada Expo
```

---

## 🚀 Configuración Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/ce-kalan.git
cd ce-kalan
```

### 2. Base de Datos (XAMPP)

1. Abre **XAMPP** y activa **Apache** y **MySQL**
2. Abre **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Ve a la pestaña **SQL** y pega el contenido de `database/cekalan.sql`
4. Haz clic en **Continuar / Go**

### 3. Backend (Node.js)

```bash
cd backend

# Crear el archivo .env desde la plantilla
copy .env.example .env
# (Edita .env si tu MySQL tiene contraseña)

npm install
npm run dev
```

Poblar la base de datos con datos de prueba:
```bash
node seed.js
```

✅ Deberías ver: `✅ Servidor corriendo en http://localhost:3001`

### 4. ⚠️ IMPORTANTE: Configurar IP para Expo Go

Para que el celular (Expo Go) se conecte al servidor:

1. Abre CMD en Windows:
   ```
   ipconfig
   ```
2. Busca tu **Dirección IPv4** (ej: `192.168.0.5`)
3. Edita `frontend/src/config/api.js` línea 14:
   ```js
   const API_IP = '192.168.0.5'; // ← Tu IP aquí
   ```

### 5. Frontend (Expo)

```bash
cd frontend
npm install
npx expo start
```

Escanea el QR con **Expo Go** en tu celular.

---

## 🔑 Credenciales de prueba

Después de ejecutar `node seed.js`:

| Rol | Correo | Contraseña |
|-----|--------|------------|
| 👨‍💼 Admin | `admin@cekalan.com` | `Admin123!` |
| 👨‍🌾 Usuario | `juan@cekalan.com` | `Juan123!` |

---

## 🔗 API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/registro` | Registro de usuario | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/perfil` | Perfil del usuario | ✅ |
| GET | `/api/plaguicidas` | Listar plaguicidas | ✅ |
| POST | `/api/plaguicidas` | Crear plaguicida (con imagen) | ✅ Admin |
| PUT | `/api/plaguicidas/:id` | Editar plaguicida | ✅ Admin |
| DELETE | `/api/plaguicidas/:id` | Eliminar plaguicida | ✅ Admin |
| GET | `/api/calculos` | Mi historial de cálculos | ✅ |
| POST | `/api/calculos` | Guardar cálculo | ✅ |
| DELETE | `/api/calculos/:id` | Eliminar cálculo | ✅ |
| GET | `/api/eventos` | Mis eventos | ✅ |
| POST | `/api/eventos` | Crear evento | ✅ |
| PUT | `/api/eventos/:id` | Editar evento | ✅ |
| DELETE | `/api/eventos/:id` | Eliminar evento | ✅ |

---

## 📐 Fórmula del Calculador

```
Resultado (L) = (Ancho × Largo × Dosis) / 10,000
```
- Ancho y Largo en metros
- Dosis en L/hectárea (1 ha = 10,000 m²)

---

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Verde Esmeralda | `#2E7D32` | Color primario |
| Verde Oscuro | `#1B5E20` | Headers/fondos |
| Ámbar | `#FFA000` | Acento/botones secundarios |
| Fondo | `#F1F8E9` | Fondo de pantallas |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo SDK 54 |
| Backend | Node.js + Express |
| Base de datos | MySQL (XAMPP) |
| Autenticación | JWT + bcrypt |
| Imágenes | Multer (subida local) |
| Calendario | react-native-calendars |
