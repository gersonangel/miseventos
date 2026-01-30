import asyncio
import logging
import sys
import os

# Asegurar que el directorio raíz del proyecto está en el PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.jobs.event_jobs import update_finished_events

# Configurar logging básico para este script de prueba
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(name)s: %(message)s'
)

async def main():
    print("--- Iniciando prueba manual del job ---")
    await update_finished_events()
    print("--- Prueba finalizada ---")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Error ejecutando el script: {e}")
