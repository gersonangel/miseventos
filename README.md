# Mis Eventos

Aplicación web Full Stack para la gestión de eventos.

## Estructura

- `backend/`: API RESTful con FastAPI, SQLModel y PostgreSQL.
- `frontend/`: Interfaz de usuario con React y TypeScript.
- `docker-compose.yml`: Orquestación de contenedores.
- `Makefile`: Scripts para automatizar tareas.

## Requerimientos

- Docker & Docker Compose o Podman & Podman Compose **(En mi caso usaré Podman)**
- Node.js (para desarrollo local frontend)
- Python 3.12 (para desarrollo local backend)

## Configuración

1. Crea el archivo de variables de entorno general copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajusta las variables en el archivo `.env` según tus necesidades.

