import { ArrowLeftOutlined } from '@ant-design/icons';
import { TransferPanel } from '@/modules/transfer/components/TransferPanel';
import { Button } from '@/shared/components/ui/Button';
import styles from './TransferView.module.scss';

interface TransferViewProps {
  meritPoints: string;
  onBack: () => void;
}

export function TransferView({ meritPoints, onBack }: TransferViewProps) {
  return (
    <div className={styles.wrap}>
      <Button variant="ghost" onClick={onBack} className={styles.back}>
        <Button.Label>
          <ArrowLeftOutlined /> Quay lại
        </Button.Label>
      </Button>
      <TransferPanel meritPoints={meritPoints} />
    </div>
  );
}
