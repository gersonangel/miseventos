# Mis Eventos - Frontend

Este proyecto es la interfaz de usuario web para la plataforma de gestión de eventos "Mis Eventos". Está construido con tecnologías modernas para ofrecer una experiencia rápida, reactiva y fácil de mantener.

## 🚀 Tecnologías Principales

-   **Core**: [React](https://react.dev/) (v20), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
-   **Estado & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Enrutamiento**: [React Router](https://reactrouter.com/)
-   **Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Validación)
-   **Cliente HTTP**: [Axios](https://axios-http.com/)
-   **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)

## 📋 Requisitos Previos

-   Node.js (v20 recomendado)
-   npm

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio** (si aún no lo has hecho):
    ```bash
    git clone <url-del-repo>
    cd miseventos/mis-eventos-web
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Copia el archivo de ejemplo y ajústalo según tu entorno local (por defecto apunta al backend local).
    ```bash
    cp .env.example .env
    ```
    
    Variables clave:
    - `VITE_API_URL`: URL base de la API del backend (ej. `http://localhost:8000/api/v1`)

## ▶️ Ejecución

### Desarrollo
Para iniciar el servidor de desarrollo con recarga en caliente (HMR):
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Producción
Para generar los archivos estáticos optimizados para producción:
```bash
npm run build
```
Los archivos se generarán en la carpeta `dist`.

Para previsualizar la build de producción localmente:
```bash
npm run preview
```

## 🧪 Testing

Este proyecto utiliza Vitest para las pruebas unitarias y de integración.

-   **Ejecutar todos los tests**:
    ```bash
    npm test
    ```
-   **Modo UI (Interfaz gráfica para tests)**:
    ```bash
    npm run test:ui
    ```
-   **Ver cobertura de código (Coverage)**:
    ```bash
    npm run test:coverage
    ```
-   **Modo Watch (Re-ejecutar al guardar cambios)**:
    ```bash
    npm run test:watch
    ```

## 🔍 Linting y Formato

Para verificar la calidad del código y buscar errores:
```bash
npm run lint
```
Para intentar corregir automáticamente problemas de linting:
```bash
npm run lint:fix
```

## 🐳 Docker

### Producción (Multi-stage build)
El proyecto incluye un `Dockerfile.prod` optimizado que utiliza Nginx para servir la aplicación estática.

1.  **Construir la imagen**:
    ```bash
    docker build -f Dockerfile.prod -t mis-eventos-web:prod .
    ```
2.  **Correr el contenedor**:
    ```bash
    docker run -p 80:80 mis-eventos-web:prod
    ```

## 📂 Estructura del Proyecto

```
src/
├── assets/        # Imágenes y recursos estáticos
├── components/    # Componentes reutilizables
│   └── ui/        # Componentes base de UI (Botones, Inputs, Modales)
├── constants/     # Constantes globales
├── context/       # Contextos de React (ej. AuthContext)
├── hooks/         # Custom Hooks (Lógica reutilizable)
├── pages/         # Componentes de página (Vistas)
├── services/      # Lógica de comunicación con la API
├── test/          # Configuración de tests
├── types/         # Definiciones de tipos TypeScript
└── utils/         # Funciones de utilidad
```
