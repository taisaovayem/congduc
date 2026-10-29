import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import { confirmTransfer, createSendTransfer, joinReceiveTransfer } from '../api/transfer-api';

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
