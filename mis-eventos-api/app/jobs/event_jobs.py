from datetime import datetime, timezone
import logging
from sqlmodel import select
from app.database import AsyncSessionLocal
from app.models.event import Event
from app.utils.enums import EventStatus

logger = logging.getLogger(__name__)

async def update_finished_events():
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        
        # Consulta de eventos que están publicados o en curso y han pasado su fecha de finalización
        statement = select(Event).where(
            (Event.status == EventStatus.PUBLISHED) | (Event.status == EventStatus.ONGOING),
            Event.end_date < now
        )
        
        result = await session.exec(statement)
        events_to_update = result.all()
        
        if events_to_update:
            for event in events_to_update:
                event.status = EventStatus.FINISHED
                session.add(event)
            
            await session.commit()
            logger.info(f"Se actualizaron {len(events_to_update)} eventos al estado FINISHED.")
            logger.debug(f"Eventos actualizados: {[event.id for event in events_to_update]}")
        else:
            logger.info("Ejecución del job completada: No se encontraron eventos para finalizar.")
