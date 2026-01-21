import { EventStatus, EventType } from '../types/event';

export const STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.PUBLISHED]: 'PUBLICADO',
  [EventStatus.DRAFT]: 'BORRADOR',
  [EventStatus.CANCELLED]: 'CANCELADO',
  [EventStatus.FINISHED]: 'FINALIZADO',
};

export const TYPE_LABELS: Record<EventType, string> = {
  [EventType.CONFERENCE]: 'CONFERENCIA',
  [EventType.WORKSHOP]: 'TALLER',
  [EventType.SEMINAR]: 'SEMINARIO',
  [EventType.NETWORKING]: 'NETWORKING',
  [EventType.OTHER]: 'OTRO',
};
