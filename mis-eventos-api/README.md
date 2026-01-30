# Mis Eventos - API Backend

Este proyecto es el backend para la plataforma "Mis Eventos", construido con **FastAPI**. Proporciona una API RESTful robusta y asíncrona para la gestión de usuarios, eventos, sesiones y registros.

## 🚀 Tecnologías Principales

-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
-   **Lenguaje**: Python 3.12+
-   **ORM / Base de Datos**: [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic)
-   **Driver DB**: [AsyncPG](https://magicstack.github.io/asyncpg/) (PostgreSQL asíncrono)
-   **Migraciones**: [Alembic](https://alembic.sqlalchemy.org/)
-   **Validación**: [Pydantic v2](https://docs.pydantic.dev/)
-   **Autenticación**: JWT (JSON Web Tokens) + Argon2/Bcrypt (hashing)
-   **Gestión de Dependencias**: [Poetry](https://python-poetry.org/)
-   **Cache**: Redis (opcional para optimización)
-   **Testing**: [Pytest](https://docs.pytest.org/)

## 📋 Requisitos Previos

-   Python 3.12 o superior
-   PostgreSQL
-   Redis (opcional)
-   [Poetry](https://python-poetry.org/docs/#installation) instalado

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio** (si aún no lo has hecho):
    ```bash
    git clone <url-del-repo>
    cd miseventos/mis-eventos-api
    ```

2.  **Si vas a correr el Back en tu máquina local - Instalar dependencias con Poetry**:
    ```bash
    poetry install
    ```
    Esto creará un entorno virtual y descargará todas las librerías necesarias.

3.  **Configurar variables de entorno**:
    Copia el archivo de ejemplo y configura tu conexión a base de datos y secretos.
    ```bash
    cp .env.example .env
    ```
    
    Asegúrate de configurar correctamente `DATABASE_URL` apuntando a tu instancia de PostgreSQL.

4.  **Levantar el ambiente de desarrollo orquestado con doccker o podman**:
    ```bash
    make up
    ```
    Esto levantará todo el ambiente (contenedores en segundo plano) DB, Redis, Backend y Frontend

5. **Base de Datos y Migraciones**:
    Aplica las migraciones para crear las tablas en la base de datos:
    ```bash
    make migrate
    ```

6. Crear usuario admin por defecto
   Este comando crea el usuario admin con el **Email**: `admin@miseventos.com`
    - **Contraseña**: `Deberarás digitarla`
    ```bash
    make init-admin
    ```

## ▶️ Ejecución

### Desarrollo
Para iniciar el servidor de desarrollo con recarga automática:
```bash
make up
```
La API estará disponible en `http://localhost:8000`.

### Documentación
Una vez corriendo, puedes acceder a la documentación interactiva:
-   **Swagger UI**: `http://localhost:8000/docs`
-   **ReDoc**: `http://localhost:8000/redoc`

## 🧪 Testing

El proyecto utiliza Pytest para pruebas unitarias y de integración.

-   **Ejecutar todos los tests**:
    ```bash
    make test-back
    ```
-   **Ver cobertura (Coverage)**:
    ```bash
    make test-back-cov
    ```

## 🐳 Docker

### Producción
El proyecto incluye un `Dockerfile.prod` optimizado (multi-stage build).

1.  **Construir la imagen**:
    ```bash
    make build-back-prod
    ```

2.  **Ejecutar el contenedor**:
    ```bash
    make run-back-prod
    ```
    Esto levantará el contenedor en segundo plano (detached) en el puerto 8000.

    Para detenerlo:
    ```bash
    make stop-back-prod
    ```

## 📂 Estructura del Proyecto

```
app/
├── api/            # Endpoints de la API (v1)
├── models/         # Modelos de base de datos (SQLModel)
├── schemas/        # Esquemas Pydantic (Request/Response)
├── services/       # Lógica de negocio
├── repositories/   # Capa de acceso a datos
├── utils/          # Utilidades (seguridad, hashing)
├── config.py       # Configuración global (pydantic-settings)
├── database.py     # Configuración de conexión DB
└── main.py         # Punto de entrada de la aplicación
alembic/            # Scripts de migración de base de datos
tests/              # Tests unitarios y de integración
```
