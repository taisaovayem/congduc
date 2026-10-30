import { ArrowLeftOutlined } from '@ant-design/icons';
import { TransferPanel } from '@/modules/transfer/components/TransferPanel';
import { Button } from '@/shared/components/ui/Button';

interface TransferViewProps {
  meritPoints: string;
  onBack: () => void;
}

export function TransferView({ meritPoints, onBack }: TransferViewProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button variant="ghost" onClick={onBack} className="self-start">
        <Button.Label>
          <ArrowLeftOutlined /> Quay lại
        </Button.Label>
      </Button>
      <TransferPanel meritPoints={meritPoints} onDone={onBack} />
    </div>
  );
}
