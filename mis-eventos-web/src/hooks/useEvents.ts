import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import { EventCreate } from '../types/event';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
  });
};

export const useEvent = (id: number) => {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getEvent(id),
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newEvent: EventCreate) => eventService.createEvent(newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
