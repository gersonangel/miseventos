# Makefile para gestión del proyecto MisEventos

# Detección automática de la herramienta de composición
# Intenta detectar podman primero, luego docker
ifeq ($(OS),Windows_NT)
    # En Windows, usamos 'where' para buscar ejecutables
    # Se redirige stderr a NUL para evitar mensajes de error si no se encuentra
    CHECK_PODMAN := $(shell where podman 2>NUL)
    CHECK_DOCKER := $(shell where docker 2>NUL)
else
    # En Unix/Linux/MacOS, usamos 'command -v'
    CHECK_PODMAN := $(shell command -v podman 2>/dev/null)
    CHECK_DOCKER := $(shell command -v docker 2>/dev/null)
endif

# Lógica de selección
ifneq ($(CHECK_PODMAN),)
    COMPOSE := podman compose
    MSG := "Usando Podman Compose"
else ifneq ($(CHECK_DOCKER),)
    COMPOSE := docker compose
    MSG := "Usando Docker Compose"
else
    # Fallback por defecto si no se detecta ninguno (o si 'podman-compose' es el comando directo)
    COMPOSE := podman compose
    MSG := "No se detectó 'podman' ni 'docker' comandos base, intentando 'podman-compose'"
endif

# Colores para output
# (Deshabilitados para compatibilidad con Windows cmd.exe por defecto)

.PHONY: help up down restart build logs migrate init-data shell-backend

help: ## Muestra este mensaje de ayuda
	@echo "Comandos disponibles:"
	@python -c "import re, sys; [print(f'{m.group(1):<20} {m.group(2)}') for f in sys.argv[1:] for line in open(f, encoding='utf-8') for m in [re.match(r'^([a-zA-Z_-]+):.*?## (.*)$$', line)] if m]" $(MAKEFILE_LIST)

up: ## Levanta todo el ambiente (contenedores en segundo plano)
	$(COMPOSE) up -d

down: ## Detiene y elimina los contenedores
	$(COMPOSE) down

restart: ## Reinicia todos los contenedores
	$(COMPOSE) restart

restart-back: ## Reinicia solo el contenedor backend
	$(COMPOSE) restart backend

restart-front: ## Reinicia solo el contenedor frontend
	$(COMPOSE) restart frontend

restart-db: ## Reinicia solo el contenedor de base de datos
	$(COMPOSE) restart db

build: ## Reconstruye todas las imágenes
	$(COMPOSE) build

build-back: ## Reconstruye la imagen del backend
	$(COMPOSE) build backend

build-front: ## Reconstruye la imagen del frontend
	$(COMPOSE) build frontend

build-no-cache: ## Reconstruye todas las imágenes sin usar caché
	$(COMPOSE) build --no-cache

migrate: ## Ejecuta las migraciones de base de datos (Alembic)
	$(COMPOSE) exec backend alembic upgrade head

init-data: ## Ejecuta el script de datos iniciales (crear admin)
	@echo "${GREEN}Ejecutando script de datos iniciales...${NC}"
	$(COMPOSE) exec backend env PYTHONPATH=. python scripts/init_db.py

shell-back: ## Abre una terminal en el contenedor backend
	$(COMPOSE) exec backend /bin/bash

logs: ## Muestra los logs de todos los contenedores
	$(COMPOSE) logs -f

logs-back: ## Muestra los logs del backend
	$(COMPOSE) logs -f backend

logs-front: ## Muestra los logs del frontend
	$(COMPOSE) logs -f frontend

test-back: ## Ejecuta los tests del backend
	$(COMPOSE) exec backend python -m pytest tests/

test-back-cov: ## Ejecuta los tests del backend con cobertura
	$(COMPOSE) exec backend python -m pytest --cov=app --cov-report=term-missing tests/
