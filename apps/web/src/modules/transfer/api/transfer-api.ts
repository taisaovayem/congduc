import { apiFetch } from '@/shared/api/http-client';
import type { ConfirmTransferResponse, CreateTransferResponse } from '@/shared/api/types';

export function createSendTransfer(deviceId: string, payload: { mode?: 'all'; amount?: number }) {
  return apiFetch<CreateTransferResponse>('/transfers/send', {
    method: 'POST',
    deviceId,
    body: JSON.stringify(payload),
  });
}

export function joinReceiveTransfer(deviceId: string, transactionCode: string) {
  return apiFetch<{ transferId: string }>('/transfers/receive/join', {
    method: 'POST',
    deviceId,
    body: JSON.stringify({ transactionCode }),
  });
}

export function confirmTransfer(
  deviceId: string,
  payload: {
    transactionCode: string;
    confirmationCode: string;
    role: 'sender' | 'receiver';
  },
) {
  return apiFetch<ConfirmTransferResponse>('/transfers/confirm', {
    method: 'POST',
    deviceId,
    body: JSON.stringify(payload),
  });
}
