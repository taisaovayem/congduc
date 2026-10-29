import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
interface MokPanelProps {
  connected: boolean;
  hitMok: () => void;
  lastBroadcast: string | null;
}

export function MokPanel({ connected, hitMok, lastBroadcast }: MokPanelProps) {

  return (
    <Card title="Gõ mõ">
      <Card.Section>
        <p>Gõ thoải mái — hiển thị realtime qua socket; server gom ghi sổ mỗi giây.</p>
        <p>Socket: {connected ? 'đã kết nối' : 'đang kết nối…'}</p>
        {lastBroadcast ? <p className="text-sm opacity-70">{lastBroadcast}</p> : null}
      </Card.Section>
      <Card.Footer>
        <Button variant="secondary" size="large" onClick={hitMok} disabled={!connected}>
          <Button.Label>Gõ mõ</Button.Label>
        </Button>
      </Card.Footer>
    </Card>
  );
}
