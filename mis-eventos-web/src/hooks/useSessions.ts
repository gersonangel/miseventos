import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import { SessionCreate, SessionUpdate } from '../types/session';

export const useEventSessions = (eventId: string) => {
  return useQuery({
    queryKey: ['sessions', 'event', eventId],
    queryFn: () => sessionService.getEventSessions(eventId),
    enabled: !!eventId,
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionService.getSession(id),
    enabled: !!id,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, session }: { eventId: string; session: SessionCreate }) => 
      sessionService.createSession(eventId, session),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'event', variables.eventId] });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, session }: { id: string; session: SessionUpdate }) => 
      sessionService.updateSession(id, session),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'event', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['sessions', data.id] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => sessionService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useAssignSpeakers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, speakerIds }: { id: string; speakerIds: string[] }) => 
      sessionService.assignSpeakers(id, speakerIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.id] });
      // Invalidate event sessions list as well since it contains speaker info
      queryClient.invalidateQueries({ queryKey: ['sessions', 'event'] });
    },
  });
};

export const useJoinSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => sessionService.joinSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
    },
  });
};
