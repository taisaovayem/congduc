import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import type { CoCultivationRoomView } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import { coCultivationRoomsQueryKey } from './use-co-cultivation-rooms';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export interface RemoteMeritPop {
  id: number;
  accountId: string;
  amount: number;
  driftPx: number;
}

export function useCoCultivationRoomSocket(
  roomId: string | undefined,
  enabled: boolean,
  password?: string,
) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const intentionalLeaveRef = useRef(false);
  const popIdRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<CoCultivationRoomView | null>(null);
  const [remotePops, setRemotePops] = useState<RemoteMeritPop[]>([]);
  const [kicked, setKicked] = useState(false);

  const spawnRemotePop = useCallback((accountId: string, amount: number) => {
    const id = popIdRef.current + 1;
    popIdRef.current = id;
    const driftPx = (id % 5) - 2;
    setRemotePops((prev) => [...prev, { id, accountId, amount, driftPx }]);
    window.setTimeout(() => {
      setRemotePops((prev) => prev.filter((pop) => pop.id !== id));
    }, 1_050);
  }, []);

  const enterRoom = useCallback(
    (socket: Socket) => {
      if (!roomId) {
        return;
      }
      socket.emit('room:enter', { roomId, password });
    },
    [password, roomId],
  );

  useEffect(() => {
    intentionalLeaveRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }
    const deviceId = getStoredDeviceId();
    if (!deviceId) {
      return;
    }

    const socket = io(`${WS_BASE}/co-cultivation`, {
      auth: { deviceId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });
    socketRef.current = socket;

    socket.io.on('reconnect_attempt', () => {
      intentionalLeaveRef.current = false;
    });

    socket.on('connect', () => {
      setConnected(true);
      enterRoom(socket);
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', (payload: CoCultivationRoomView) => {
      setRoom(payload);
      queryClient.setQueryData(accountQueryKey, (prev: { meritPoints: string } | undefined) =>
        prev ? { ...prev, meritPoints: payload.myMeritPoints } : prev,
      );
    });

    socket.on('room:merit-pop', (payload: { accountId: string; amount: number }) => {
      spawnRemotePop(payload.accountId, payload.amount);
    });

    socket.on('room:team-merit', (payload: { teamMeritHits: string }) => {
      setRoom((prev) => (prev ? { ...prev, teamMeritHits: payload.teamMeritHits } : prev));
    });

    socket.on('room:member-kicked', (payload: { targetAccountId: string }) => {
      setRoom((prev) => {
        if (prev?.myAccountId === payload.targetAccountId) {
          setKicked(true);
        }
        return prev;
      });
    });

    socket.on('mok:hit:ack', (payload: { meritPoints: string }) => {
      queryClient.setQueryData(accountQueryKey, (prev: { meritPoints: string } | undefined) =>
        prev ? { ...prev, meritPoints: payload.meritPoints } : prev,
      );
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      void queryClient.invalidateQueries({ queryKey: coCultivationRoomsQueryKey });
    };
  }, [enabled, enterRoom, queryClient, roomId, spawnRemotePop]);

  const leaveRoomSocket = useCallback(() => {
    intentionalLeaveRef.current = true;
    socketRef.current?.emit('room:leave');
  }, []);

  const setReady = useCallback(
    (ready: boolean) => {
      if (!roomId) {
        return;
      }
      socketRef.current?.emit('room:set-ready', { roomId, ready });
    },
    [roomId],
  );

  const startPractice = useCallback(() => {
    if (!roomId) {
      return;
    }
    socketRef.current?.emit('room:start', { roomId });
  }, [roomId]);

  const kickMember = useCallback(
    (targetAccountId: string) => {
      if (!roomId) {
        return;
      }
      socketRef.current?.emit('room:kick', { roomId, targetAccountId });
    },
    [roomId],
  );

  const hitMok = useCallback(() => {
    if (!roomId) {
      return;
    }
    socketRef.current?.emit('mok:hit', { roomId });
  }, [roomId]);

  return {
    connected,
    room,
    remotePops,
    kicked,
    leaveRoomSocket,
    setReady,
    startPractice,
    kickMember,
    hitMok,
  };
}
