import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import type { PkMatchEndedPayload, PkRoomView } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import { pkRoomsQueryKey } from './use-pk-rooms';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

/** Trong trận, tổng phe chỉ tăng — tránh room:state cũ ghi đè số vừa nhận qua room:team-merit. */
function mergePkRoomState(prev: PkRoomView | null, payload: PkRoomView): PkRoomView {
  if (!prev || prev.status !== 'active' || payload.status !== 'active') {
    return payload;
  }
  const prevRed = BigInt(prev.redTeamMerit);
  const prevBlue = BigInt(prev.blueTeamMerit);
  const nextRed = BigInt(payload.redTeamMerit);
  const nextBlue = BigInt(payload.blueTeamMerit);
  return {
    ...payload,
    redTeamMerit: (nextRed > prevRed ? nextRed : prevRed).toString(),
    blueTeamMerit: (nextBlue > prevBlue ? nextBlue : prevBlue).toString(),
  };
}

export interface RemoteMeritPop {
  id: number;
  accountId: string;
  amount: number;
  driftPx: number;
}

type SocketAck<T> = (response: T | { error: string }) => void;

function ackError(response: unknown): string | null {
  if (response && typeof response === 'object' && 'error' in response) {
    const message = (response as { error: string }).error;
    return typeof message === 'string' && message.length > 0 ? message : 'Không thực hiện được';
  }
  return null;
}

export function usePkRoomSocket(
  roomId: string | undefined,
  enabled: boolean,
  password?: string,
) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const intentionalLeaveRef = useRef(false);
  const popIdRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<PkRoomView | null>(null);
  const [remotePops, setRemotePops] = useState<RemoteMeritPop[]>([]);
  const [matchEnded, setMatchEnded] = useState<PkMatchEndedPayload | null>(null);
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

    const socket = io(`${WS_BASE}/pk`, {
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

    socket.on('room:state', (payload: PkRoomView) => {
      setRoom((prev) => mergePkRoomState(prev, payload));
      queryClient.setQueryData(accountQueryKey, (prev: { meritPoints: string } | undefined) =>
        prev ? { ...prev, meritPoints: payload.myMeritPoints } : prev,
      );
    });

    socket.on('room:merit-pop', (payload: { accountId: string; amount: number }) => {
      spawnRemotePop(payload.accountId, payload.amount);
    });

    socket.on('room:team-merit', (payload: { redTeamMerit: string; blueTeamMerit: string }) => {
      setRoom((prev) =>
        prev
          ? { ...prev, redTeamMerit: payload.redTeamMerit, blueTeamMerit: payload.blueTeamMerit }
          : prev,
      );
    });

    socket.on('room:match-ended', (payload: PkMatchEndedPayload) => {
      setMatchEnded(payload);
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
    });

    socket.on('room:member-kicked', (payload: { targetAccountId: string }) => {
      setRoom((prev) => {
        if (prev?.myAccountId === payload.targetAccountId) {
          setKicked(true);
        }
        return prev;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      void queryClient.invalidateQueries({ queryKey: pkRoomsQueryKey });
    };
  }, [enabled, enterRoom, queryClient, roomId, spawnRemotePop]);

  const leaveRoomSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        reject(new Error('Chưa kết nối phòng'));
        return;
      }
      intentionalLeaveRef.current = true;
      socket.emit('room:leave', {}, ((response: unknown) => {
        const err = ackError(response);
        if (err) {
          intentionalLeaveRef.current = false;
          reject(new Error(err));
          return;
        }
        resolve();
      }) as SocketAck<{ dissolved: boolean }>);
    });
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

  const switchTeam = useCallback(() => {
    if (!roomId) {
      return;
    }
    socketRef.current?.emit('room:switch-team', { roomId });
  }, [roomId]);

  const startMatch = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !roomId) {
        reject(new Error('Chưa kết nối phòng'));
        return;
      }
      socket.emit('room:start', { roomId }, ((response: unknown) => {
        const err = ackError(response);
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve();
      }) as SocketAck<unknown>);
    });
  }, [roomId]);

  const hitMok = useCallback(() => {
    if (!roomId) {
      return;
    }
    socketRef.current?.emit('mok:hit', { roomId });
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

  const clearMatchEnded = useCallback(() => setMatchEnded(null), []);

  return {
    connected,
    room,
    remotePops,
    matchEnded,
    kicked,
    clearMatchEnded,
    leaveRoomSocket,
    setReady,
    switchTeam,
    startMatch,
    kickMember,
    hitMok,
  };
}
