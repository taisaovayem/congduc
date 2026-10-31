import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import {
  createCoCultivationRoom,
  fetchCoCultivationRooms,
  joinCoCultivationByCode,
  quickJoinCoCultivation,
} from '../api/co-cultivation-api';

export const coCultivationRoomsQueryKey = ['co-cultivation', 'rooms'] as const;

export function useCoCultivationRooms(enabled: boolean) {
  return useQuery({
    queryKey: coCultivationRoomsQueryKey,
    queryFn: () => fetchCoCultivationRooms(),
    enabled,
    refetchInterval: 4000,
  });
}

export function useCreateCoCultivationRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; password?: string }) => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return createCoCultivationRoom(deviceId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coCultivationRoomsQueryKey });
    },
  });
}

export function useJoinCoCultivationByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { roomCode: string; password?: string }) => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return joinCoCultivationByCode(deviceId, input.roomCode, input.password);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coCultivationRoomsQueryKey });
    },
  });
}

export function useQuickJoinCoCultivation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return quickJoinCoCultivation(deviceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coCultivationRoomsQueryKey });
    },
  });
}
