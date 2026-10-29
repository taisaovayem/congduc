import { SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import styles from './PersonalMenu.module.scss';

interface PersonalMenuProps {
  meritPoints: string;
  onOpenTransfer: () => void;
}

export function PersonalMenu({ meritPoints, onOpenTransfer }: PersonalMenuProps) {
  const [open, setOpen] = useState(false);

  const handleOpenTransfer = () => {
    setOpen(false);
    onOpenTransfer();
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={() => (
        <div className={styles.panel}>
          <div className={styles.heading}>Cá nhân</div>
          <dl className={styles.stats}>
            <dt>Công đức</dt>
            <dd>{meritPoints}</dd>
          </dl>
          <Button variant="secondary" block onClick={handleOpenTransfer}>
            <Button.Label>
              <SwapOutlined /> Chuyển công đức
            </Button.Label>
          </Button>
        </div>
      )}
    >
      <button type="button" className={styles.trigger} aria-label="Menu cá nhân">
        <Avatar size={40} icon={<UserOutlined />} className={styles.avatar} />
      </button>
    </Dropdown>
  );
}
