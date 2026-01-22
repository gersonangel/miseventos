# Mis Eventos

Aplicación web Full Stack para la gestión de eventos.

## Estructura

- `mis-eventos-api/`: API RESTful con FastAPI, SQLModel y PostgreSQL.
- `mis-eventos-web/`: Interfaz de usuario con React y TypeScript.
- `docker-compose.yml`: Orquestación de contenedores.
- `Makefile`: Scripts para automatizar tareas.

## Requerimientos

- Docker & Docker Compose o Podman & Podman Compose **(En mi caso usaré Podman)**
- Node.js 20+ (para desarrollo local frontend)
- Python 3.12 (para desarrollo local backend)

## Configuración docker-compose

1. En la raíz del proyecto, crea el archivo de variables de entorno general copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajusta las variables en el archivo `.env` según tus necesidades.

## Configuración backend

1. En la carpeta `mis-eventos-api/`, crea el archivo de variables de entorno copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```
2. Ajusta las variables en el archivo `.env` según tus necesidades.

## Configuración frontend

1. En la carpeta `mis-eventos-web/`, crea el archivo de variables de entorno copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```
2. Ajusta las variables en el archivo `.env` según tus necesidades.

## Levantar el ambiente

1. En la raíz del proyecto, ejecuta:

   ```bash
   make up
   ```

## Comandos Make

- `make help`: Muestra mensaje de ayuda con los comandos disponibles
- `up`: Levanta todo el ambiente (contenedores en segundo plano)
- `restart`: Reinicia todos los contenedores
- `down`: Detiene y elimina los contenedores
- `build`: Reconstruye todas las imágenes
- `build-no-cache`: Reconstruye todas las imágenes sin usar caché
- `restart-back`: Reinicia solo el contenedor backend
- `restart-front`: Reinicia solo el contenedor frontend
- `restart-db`: Reinicia solo el contenedor de base de datos
- `build-back`: Reconstruye la imagen del backend
- `build-front`: Reconstruye la imagen del frontend
- `build-front-prod`: Construye la imagen de producción del frontend (Nginx)
- `run-front-prod`: Ejecuta el contenedor de producción del frontend en puerto 8080
- `stop-front-prod`: Detiene el contenedor de producción del frontend
- `build-back-prod`: Construye la imagen de producción del backend
- `run-back-prod`: Ejecuta el contenedor de producción del backend en puerto 8000
- `stop-back-prod`: Detiene y elimina el contenedor de producción del backend
- `makemigrations`: Crea una nueva migración (Alembic). Uso: make makemigrations msg="mensaje"
- `migrate`: Ejecuta las migraciones de base de datos (Alembic)
- `init-data`: Ejecuta el script de datos iniciales (crear admin)
- `shell-back`: Abre una terminal en el contenedor backend
- `logs`: Muestra los logs de todos los contenedores
- `logs-back`: Muestra los logs del backend
- `logs-front`: Muestra los logs del frontend
- `test-back`: Ejecuta los tests del backend
- `test-back-cov`: Ejecuta los tests del backend con cobertura

