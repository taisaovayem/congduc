import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import {
  cancelTransfer,
  confirmTransfer,
  createSendTransfer,
  fetchTransferStatus,
  joinReceiveTransfer,
} from '../api/transfer-api';

export const transferStatusQueryKey = (transactionCode: string) =>
  ['transfer', 'status', transactionCode] as const;

export function useCreateSendTransfer() {
  return useMutation({
    mutationFn: (input: { mode?: 'all'; amount?: number }) =>
      createSendTransfer(getStoredDeviceId()!, input),
  });
}

export function useJoinReceiveTransfer() {
  return useMutation({
    mutationFn: (transactionCode: string) =>
      joinReceiveTransfer(getStoredDeviceId()!, transactionCode),
  });
}

export function useConfirmTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      transactionCode: string;
      confirmationCode: string;
      role: 'sender' | 'receiver';
    }) => confirmTransfer(getStoredDeviceId()!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
    },
  });
}

export function useCancelTransfer() {
  return useMutation({
    mutationFn: (input: { transactionCode: string; confirmationCode: string }) =>
      cancelTransfer(getStoredDeviceId()!, input),
  });
}

export function useTransferStatus(transactionCode: string, enabled: boolean) {
  const deviceId = getStoredDeviceId();
  return useQuery({
    queryKey: transferStatusQueryKey(transactionCode),
    queryFn: () => fetchTransferStatus(deviceId!, transactionCode),
    enabled: enabled && Boolean(deviceId) && transactionCode.length === 8,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 2_000 : false,
  });
}
