export interface Session {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_name?: string;
  event_id: number;
}

export interface SessionCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_name?: string;
}

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  registration_date: string;
}
