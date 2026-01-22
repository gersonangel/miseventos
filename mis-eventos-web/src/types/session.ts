export interface Speaker {
  id: string;
  full_name: string;
  email: string;
  profile_picture?: string;
  biography?: string;
  organization?: string;
  position?: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  speakers?: Speaker[];
  event_id: string;
}

export interface SessionCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
}

export interface SessionUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  capacity?: number;
}

export interface SessionSpeakerUpdate {
  speaker_ids: string[];
}
