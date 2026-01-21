export interface Event {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  capacity: number;
  status: 'draft' | 'published' | 'cancelled';
  owner_id: number;
}

export interface EventCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  capacity: number;
  status?: 'draft' | 'published' | 'cancelled';
}
