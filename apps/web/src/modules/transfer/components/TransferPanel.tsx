import { message, Radio } from 'antd';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import {
  useConfirmTransfer,
  useCreateSendTransfer,
  useJoinReceiveTransfer,
} from '../hooks/use-transfer';

interface TransferPanelProps {
  meritPoints: string;
}

export function TransferPanel({ meritPoints }: TransferPanelProps) {
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [amount, setAmount] = useState('');
  const [sendAll, setSendAll] = useState(false);
  const [transactionCode, setTransactionCode] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [createdCodes, setCreatedCodes] = useState<{
    transactionCode: string;
    confirmationCode: string;
    amount: string;
  } | null>(null);

  const createSend = useCreateSendTransfer();
  const joinReceive = useJoinReceiveTransfer();
  const confirm = useConfirmTransfer();

  const handleCreateSend = async () => {
    try {
      const result = await createSend.mutateAsync(
        sendAll ? { mode: 'all' } : { amount: Number(amount) },
      );
      setCreatedCodes(result);
      message.success('Đã tạo giao dịch. Chia sẻ mã với người nhận.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Lỗi tạo giao dịch');
    }
  };

  const handleJoin = async () => {
    try {
      await joinReceive.mutateAsync(transactionCode.trim().toUpperCase());
      message.success('Đã tham gia nhận giao dịch');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tham gia được');
    }
  };

  const handleConfirm = async (role: 'sender' | 'receiver') => {
    try {
      const result = await confirm.mutateAsync({
        transactionCode: transactionCode.trim().toUpperCase(),
        confirmationCode: confirmationCode.trim(),
        role,
      });
      if (result.status === 'completed') {
        message.success('Chuyển công đức thành công');
        setCreatedCodes(null);
      } else {
        message.info('Đã xác nhận — chờ phía còn lại');
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
          onChange={(e) => setMode(e.target.value as 'send' | 'receive')}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: 'Gửi', value: 'send' },
            { label: 'Nhận', value: 'receive' },
          ]}
        />
      </Card.Section>

      {mode === 'send' ? (
        <Card.Section>
          <p>Số dư hiện tại: {meritPoints}</p>
          <Radio.Group
            value={sendAll ? 'all' : 'partial'}
            onChange={(e) => setSendAll(e.target.value === 'all')}
            options={[
              { label: 'Chuyển một phần', value: 'partial' },
              { label: 'Chuyển tất cả', value: 'all' },
            ]}
          />
          {!sendAll ? (
            <Input
              placeholder="Số công đức"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
            />
          ) : null}
          {createdCodes ? (
            <div className="rounded bg-amber-50 p-3 text-sm">
              <div>Mã giao dịch: {createdCodes.transactionCode}</div>
              <div>Mã xác nhận: {createdCodes.confirmationCode}</div>
              <div>Số lượng: {createdCodes.amount}</div>
            </div>
          ) : null}
          <Button loading={createSend.isPending} onClick={() => void handleCreateSend()}>
            <Button.Label>Tạo giao dịch gửi</Button.Label>
          </Button>
        </Card.Section>
      ) : (
        <Card.Section>
          <Input
            placeholder="Mã giao dịch (8 ký tự)"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <Button loading={joinReceive.isPending} onClick={() => void handleJoin()}>
            <Button.Label>Chọn nhận</Button.Label>
          </Button>
        </Card.Section>
      )}

      <Card.Section>
        <Input
          placeholder="Mã giao dịch"
          value={transactionCode}
          onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
          maxLength={8}
        />
        <Input
          placeholder="Mã xác nhận (6 số)"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          maxLength={6}
        />
        <Card.Footer>
          <Button loading={confirm.isPending} onClick={() => void handleConfirm('sender')}>
            <Button.Label>Người gửi xác nhận</Button.Label>
          </Button>
          <Button
            variant="secondary"
            loading={confirm.isPending}
            onClick={() => void handleConfirm('receiver')}
          >
            <Button.Label>Người nhận xác nhận</Button.Label>
          </Button>
        </Card.Footer>
      </Card.Section>
    </Card>
  );
}
