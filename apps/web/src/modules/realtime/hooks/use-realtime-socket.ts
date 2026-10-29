import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import { activeIncenseQueryKey } from '@/modules/incense/hooks/use-incense';
import type { IncenseRealtimeState } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export function useRealtimeSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const deviceId = getStoredDeviceId();
    if (!deviceId) {
      return;
    }

    const socket = io(`${WS_BASE}/realtime`, {
      auth: { deviceId },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('mok:hit:ack', (payload: { meritPoints: string }) => {
      queryClient.setQueryData(accountQueryKey, (prev: { meritPoints: string } | undefined) =>
        prev ? { ...prev, meritPoints: payload.meritPoints } : prev,
      );
    });

    socket.on('mok:hit:broadcast', (payload: { meritPoints: string; deviceId: string }) => {
      setLastBroadcast(`${payload.deviceId.slice(0, 8)}… → ${payload.meritPoints} công đức`);
    });

    socket.on('incense:update', (payload: IncenseRealtimeState) => {
      queryClient.setQueryData(activeIncenseQueryKey, payload);
      queryClient.setQueryData(accountQueryKey, (prev: { meritPoints: string } | undefined) =>
        prev ? { ...prev, meritPoints: payload.meritPoints } : prev,
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);

  const hitMok = useCallback(() => {
    socketRef.current?.emit('mok:hit', {});
  }, []);

  const syncIncense = useCallback(() => {
    socketRef.current?.emit('incense:sync', {});
  }, []);

  return { connected, hitMok, syncIncense, lastBroadcast };
}
