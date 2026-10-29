import { Card } from '@/shared/components/ui/Card';
import moImage from '@/assets/images/mo.png';
import { useMokSound } from '../hooks/use-mok-sound';
import styles from './MokPanel.module.scss';

interface MokPanelProps {
  connected: boolean;
  hitMok: () => void;
  lastBroadcast: string | null;
}

export function MokPanel({ connected, hitMok, lastBroadcast }: MokPanelProps) {
  const playMoSound = useMokSound();

  const handleHit = () => {
    playMoSound();
    hitMok();
  };

  return (
    <Card title="Gõ mõ">
      <Card.Section>
        <p>Gõ thoải mái — hiển thị realtime qua socket; server gom ghi sổ mỗi giây.</p>
        <p>Socket: {connected ? 'đã kết nối' : 'đang kết nối…'}</p>
        {lastBroadcast ? <p className="text-sm opacity-70">{lastBroadcast}</p> : null}
      </Card.Section>
      <Card.Footer>
        <button
          type="button"
          className={styles.hitButton}
          onClick={handleHit}
          disabled={!connected}
          aria-label="Gõ mõ"
        >
          <img src={moImage} alt="" className={styles.hitImage} draggable={false} />
        </button>
      </Card.Footer>
    </Card>
  );
}
