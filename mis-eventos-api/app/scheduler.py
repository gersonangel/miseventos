from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.jobs.event_jobs import update_finished_events
import logging

logger = logging.getLogger(__name__)

# Initialize the scheduler
scheduler = AsyncIOScheduler()

def start_scheduler():
    """
    Starts the scheduler and adds background jobs.
    """
    time_interval = 5

    try:
        if not scheduler.running:
            # Run the job every 1 hour
            scheduler.add_job(update_finished_events, 'interval', minutes=time_interval, id='update_finished_events', replace_existing=True)
            scheduler.start()
            logger.info(f"Scheduler iniciado correctamente con el job 'update_finished_events' cada {time_interval} minutos.")
        else:
             logger.info("El scheduler ya se encuentra en ejecución.")
    except Exception as e:
        logger.error(f"Error al iniciar el scheduler: {e}")

def stop_scheduler():
    """
    Shuts down the scheduler.
    """
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("Scheduler detenido correctamente.")
    except Exception as e:
        logger.error(f"Error al detener el scheduler: {e}")
