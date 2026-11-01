export interface IncenseRealtimePayload {
  active: boolean;
  remainingSeconds: number;
  meritPoints: string;
  startedAt?: string;
  endsAt?: string;
  /** Công đức vừa ghi sổ từ nhang (chỉ gửi khi > 0). */
  meritCredited?: number;
}
