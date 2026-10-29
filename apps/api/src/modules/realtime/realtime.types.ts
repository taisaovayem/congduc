export interface IncenseRealtimePayload {
  active: boolean;
  remainingSeconds: number;
  meritPoints: string;
  startedAt?: string;
  endsAt?: string;
}
