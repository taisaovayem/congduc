import { CopyOutlined } from '@ant-design/icons';
import { message, Radio } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { MeritBadge } from '@/modules/account/components/MeritBadge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import {
  useCancelTransfer,
  useConfirmTransfer,
  useCreateSendTransfer,
  useJoinReceiveTransfer,
  useTransferStatus,
} from '../hooks/use-transfer';

interface SendShareCodes {
  transactionCode: string;
  confirmationCode: string;
  amount: string;
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    message.success(successMessage);
  } catch {
    message.error('Không sao chép được — hãy chọn và copy thủ công');
  }
}

function ShareCodeRow({
  label,
  value,
  copyAriaLabel,
}: {
  label: string;
  value: string;
  copyAriaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>
        {label}: <strong className="font-semibold tracking-wide">{value}</strong>
      </span>
      <button
        type="button"
        className="inline-flex shrink-0 cursor-pointer rounded border-0 bg-transparent p-1 text-base text-stone-600 transition-colors hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
        aria-label={copyAriaLabel}
        onClick={() => void copyToClipboard(value, `Đã sao chép ${label.toLowerCase()}`)}
      >
        <CopyOutlined />
      </button>
    </div>
  );
}

function ReceiveAmountInfo({ amount }: { amount: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">Công đức bạn sẽ nhận</span>
      <div className="inline-flex flex-col gap-0.5 self-start rounded-lg bg-temple-ink px-3 py-2 text-[#f5e6c8]">
        <span className="text-xs opacity-85">Số lượng</span>
        <strong className="text-[22px] leading-tight">{amount}</strong>
      </div>
    </div>
  );
}

function SendShareInfo({ codes }: { codes: SendShareCodes }) {
  return (
    <div className="rounded-lg bg-amber-50/95 p-3 text-sm text-stone-900">
      <p className="mb-2 font-medium">Gửi cho người nhận:</p>
      <div className="flex flex-col gap-2">
        <ShareCodeRow
          label="Mã giao dịch"
          value={codes.transactionCode}
          copyAriaLabel="Sao chép mã giao dịch"
        />
        <ShareCodeRow
          label="Mã xác nhận"
          value={codes.confirmationCode}
          copyAriaLabel="Sao chép mã xác nhận"
        />
        <div>Số lượng: {codes.amount}</div>
      </div>
    </div>
  );
}

interface TransferPanelProps {
  meritPoints: string;
  onDone: () => void;
}

type SendStep = 'form' | 'share' | 'waiting';
type ReceiveStep = 'codes' | 'confirm' | 'waiting';

export function TransferPanel({ meritPoints, onDone }: TransferPanelProps) {
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [sendStep, setSendStep] = useState<SendStep>('form');
  const [receiveStep, setReceiveStep] = useState<ReceiveStep>('codes');
  const [amount, setAmount] = useState('');
  const [sendAll, setSendAll] = useState(false);
  const [transactionCode, setTransactionCode] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);
  const [createdCodes, setCreatedCodes] = useState<SendShareCodes | null>(null);

  const createSend = useCreateSendTransfer();
  const joinReceive = useJoinReceiveTransfer();
  const confirm = useConfirmTransfer();
  const cancel = useCancelTransfer();

  const balance = useMemo(() => {
    try {
      return BigInt(meritPoints || '0');
    } catch {
      return 0n;
    }
  }, [meritPoints]);

  const activeTxCode = createdCodes?.transactionCode ?? transactionCode.trim().toUpperCase();
  const pollStatus =
    activeTxCode.length === 8 &&
    (sendStep === 'waiting' || receiveStep === 'waiting' || receiveStep === 'confirm');
  const { data: transferStatus } = useTransferStatus(activeTxCode, pollStatus);

  const receiveDisplayAmount = pendingAmount ?? transferStatus?.amount ?? null;

  useEffect(() => {
    if (!pollStatus || !transferStatus) {
      return;
    }
    if (transferStatus.status === 'completed') {
      message.success(mode === 'send' ? 'Chuyển công đức thành công' : 'Nhận công đức thành công');
      onDone();
    } else if (transferStatus.status === 'cancelled') {
      message.error('Giao dịch thất bại');
      onDone();
    }
  }, [pollStatus, transferStatus, onDone, mode]);

  const resetSendFlow = () => {
    setSendStep('form');
    setCreatedCodes(null);
    setAmount('');
    setSendAll(false);
  };

  const resetReceiveFlow = () => {
    setReceiveStep('codes');
    setPendingAmount(null);
    setTransactionCode('');
    setConfirmationCode('');
  };

  const handleCancelReceive = async () => {
    const tx = transactionCode.trim().toUpperCase();
    const code = confirmationCode.trim();
    if (tx.length === 8 && code.length === 6) {
      try {
        await cancel.mutateAsync({ transactionCode: tx, confirmationCode: code });
        message.success('Đã hủy giao dịch');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Không hủy được giao dịch');
        return;
      }
    }
    resetReceiveFlow();
  };

  const handleCancelSend = async () => {
    if (!createdCodes) {
      resetSendFlow();
      return;
    }
    try {
      await cancel.mutateAsync({
        transactionCode: createdCodes.transactionCode,
        confirmationCode: createdCodes.confirmationCode,
      });
      message.success('Đã hủy giao dịch');
      resetSendFlow();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không hủy được giao dịch');
    }
  };

  const resetMode = (next: 'send' | 'receive') => {
    setMode(next);
    setSendStep('form');
    setReceiveStep('codes');
    setCreatedCodes(null);
    setPendingAmount(null);
    setTransactionCode('');
    setConfirmationCode('');
    setAmount('');
    setSendAll(false);
  };

  const handleCreateSend = async () => {
    if (balance <= 0n) {
      message.warning('Bạn chưa có công đức để chuyển');
      return;
    }
    if (!sendAll) {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        message.warning('Nhập số công đức hợp lệ (số nguyên dương)');
        return;
      }
      if (BigInt(parsed) > balance) {
        message.warning(`Chỉ có ${meritPoints} công đức — nhập trong phạm vi số dư`);
        return;
      }
    }
    try {
      const result = await createSend.mutateAsync(
        sendAll ? { mode: 'all' } : { amount: Number(amount) },
      );
      setCreatedCodes(result);
      setSendStep('share');
      message.success('Chia sẻ hai mã bên dưới với người nhận');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Lỗi tạo giao dịch');
    }
  };

  const handleSenderConfirm = async () => {
    if (!createdCodes) {
      return;
    }
    try {
      const result = await confirm.mutateAsync({
        transactionCode: createdCodes.transactionCode,
        confirmationCode: createdCodes.confirmationCode,
        role: 'sender',
      });
      if (result.status === 'completed') {
        message.success('Chuyển công đức thành công');
        onDone();
      } else {
        setSendStep('waiting');
        message.info('Đã xác nhận gửi — chờ người nhận xác nhận');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Xác nhận thất bại');
    }
  };

  const handleReceiveJoin = async () => {
    const tx = transactionCode.trim().toUpperCase();
    const confirmCode = confirmationCode.trim();
    if (tx.length !== 8) {
      message.warning('Mã giao dịch gồm 8 ký tự');
      return;
    }
    if (confirmCode.length !== 6) {
      message.warning('Mã xác nhận gồm 6 số');
      return;
    }
    try {
      const result = await joinReceive.mutateAsync(tx);
      setPendingAmount(result.amount);
      setReceiveStep('confirm');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không nhận được giao dịch');
    }
  };

  const handleReceiverConfirm = async () => {
    try {
      const result = await confirm.mutateAsync({
        transactionCode: transactionCode.trim().toUpperCase(),
        confirmationCode: confirmationCode.trim(),
        role: 'receiver',
      });
      if (result.status === 'completed') {
        message.success('Nhận công đức thành công');
        onDone();
      } else {
        setReceiveStep('waiting');
        message.info('Đã xác nhận nhận — chờ người gửi xác nhận');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Xác nhận thất bại');
    }
  };

  return (
    <Card title="Chuyển công đức">
      <Card.Section>
        <Radio.Group
          value={mode}
          onChange={(e) => resetMode(e.target.value as 'send' | 'receive')}
          optionType="button"
          buttonStyle="solid"
          disabled={sendStep !== 'form' || receiveStep !== 'codes'}
          options={[
            { label: 'Gửi', value: 'send' },
            { label: 'Nhận', value: 'receive' },
          ]}
        />
      </Card.Section>

      {mode === 'send' ? (
        <>
          {sendStep === 'form' ? (
            <Card.Section className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Công đức bạn đang có</span>
                <div className="self-start">
                  <MeritBadge meritPoints={meritPoints} />
                </div>
              </div>
              <Radio.Group
                value={sendAll ? 'all' : 'partial'}
                onChange={(e) => setSendAll(e.target.value === 'all')}
                options={[
                  { label: 'Chuyển một phần', value: 'partial' },
                  { label: `Chuyển tất cả (${meritPoints})`, value: 'all' },
                ]}
              />
              {!sendAll ? (
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder="Số công đức muốn chuyển"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                  />
                  <p className="text-xs text-stone-500">
                    Tối đa {meritPoints} công đức (theo số dư hiện tại)
                  </p>
                </div>
              ) : null}
              <Button loading={createSend.isPending} onClick={() => void handleCreateSend()}>
                <Button.Label>Tiếp tục</Button.Label>
              </Button>
            </Card.Section>
          ) : null}

          {(sendStep === 'share' || sendStep === 'waiting') && createdCodes ? (
            <Card.Section className="flex flex-col gap-3">
              <SendShareInfo codes={createdCodes} />
              {sendStep === 'waiting' ? (
                <p className="text-center text-sm text-stone-600">
                  Bạn đã xác nhận gửi. Đang chờ người nhận xác nhận…
                </p>
              ) : null}
              {sendStep === 'share' ? (
                <Button loading={confirm.isPending} onClick={() => void handleSenderConfirm()}>
                  <Button.Label>Xác nhận gửi</Button.Label>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                loading={cancel.isPending}
                onClick={() => void handleCancelSend()}
              >
                <Button.Label>Hủy giao dịch</Button.Label>
              </Button>
            </Card.Section>
          ) : null}
        </>
      ) : (
        <>
          {receiveStep === 'codes' ? (
            <Card.Section className="flex flex-col gap-3">
              <Input
                placeholder="Mã giao dịch (8 ký tự)"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <Input
                placeholder="Mã xác nhận (6 số)"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                inputMode="numeric"
              />
              <Button loading={joinReceive.isPending} onClick={() => void handleReceiveJoin()}>
                <Button.Label>Nhận</Button.Label>
              </Button>
            </Card.Section>
          ) : null}

          {(receiveStep === 'confirm' || receiveStep === 'waiting') && receiveDisplayAmount ? (
            <Card.Section className="flex flex-col gap-3">
              <ReceiveAmountInfo amount={receiveDisplayAmount} />
              {receiveStep === 'waiting' ? (
                <p className="text-center text-sm text-stone-600">
                  Bạn đã xác nhận nhận. Đang chờ người gửi xác nhận…
                </p>
              ) : null}
              {receiveStep === 'confirm' ? (
                <Button loading={confirm.isPending} onClick={() => void handleReceiverConfirm()}>
                  <Button.Label>Xác nhận nhận</Button.Label>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                loading={cancel.isPending}
                onClick={() => void handleCancelReceive()}
              >
                <Button.Label>Hủy giao dịch</Button.Label>
              </Button>
            </Card.Section>
          ) : null}
        </>
      )}
    </Card>
  );
}
