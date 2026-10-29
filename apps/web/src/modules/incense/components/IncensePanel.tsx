import { useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useIncenseCountdown } from '../hooks/use-incense-countdown';
import { useIncenseState, useStartIncense } from '../hooks/use-incense';

interface IncensePanelProps {
  sessionReady: boolean;
  syncIncense: () => void;
}

export function IncensePanel({ sessionReady, syncIncense }: IncensePanelProps) {
  const { data: incenseState } = useIncenseState(sessionReady);
  const startIncense = useStartIncense();

  const onBurnedOut = useCallback(() => {
    syncIncense();
  }, [syncIncense]);

  const { burning, remainingSeconds: remaining } = useIncenseCountdown(incenseState, onBurnedOut);

  const active = burning;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Card title="Thắp hương">
      <Card.Section>
        <p>Mỗi nén nhang cháy 10 phút. Mỗi giây 1 điểm; server ghi sổ mỗi phút (cập nhật qua socket).</p>
        {active ? (
          <p>
            Đang cháy — còn lại: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        ) : (
          <p>Chưa có nén nhang đang cháy.</p>
        )}
      </Card.Section>
      <Card.Footer>
        <Button
          variant="primary"
          loading={startIncense.isPending}
          disabled={Boolean(active)}
          onClick={() => startIncense.mutate()}
        >
          <Button.Label>{active ? 'Đang thắp hương' : 'Thắp nén nhang mới'}</Button.Label>
        </Button>
      </Card.Footer>
    </Card>
  );
}
