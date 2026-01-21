export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  FINISHED = 'finished',
}

export enum EventType {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  NETWORKING = "networking",
  OTHER = "other"
}
export interface Event {
  id: string; // UUID
  title: string;
  description: string;
  start_date: string; // ISO Date
  end_date: string; // ISO Date
  location: string;
  max_capacity: number;
  event_type: EventType;
  status: EventStatus;
  image_desktop: string; // URL
  image_mobile: string; // URL
  organizer_id: string; // UUID
  created_at: string;
  updated_at: string;
  available_spots: number; // Campo calculado
}

export interface EventListResponse {
  total: number;
  page: number;
  size: number;
  items: Event[];
}

export interface EventCreate {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  max_capacity: number;
  event_type: EventType;
  status?: EventStatus;
}

export type EventUpdate = Partial<EventCreate>;

export interface EventFilters {
  page?: number;
  size?: number;
  status?: EventStatus;
  event_type?: EventType;
  search?: string;
  available_spots_only?: boolean;
}
