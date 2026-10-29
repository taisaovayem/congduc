import { SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';

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
        <div className="min-w-[220px] rounded-[10px] bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0/12%)]">
          <dl className="mb-3">
            <dt className="mb-0.5 text-xs text-neutral-500">Công đức:</dt>
            <dd className="m-0 text-[22px] font-bold text-temple-ink">{meritPoints}</dd>
          </dl>
          <Button variant="secondary" block onClick={handleOpenTransfer}>
            <Button.Label>
              <SwapOutlined /> Chuyển công đức
            </Button.Label>
          </Button>
        </div>
      )}
    >
      <button
        type="button"
        className="inline-flex cursor-pointer border-0 bg-transparent p-0 leading-none"
        aria-label="Menu cá nhân"
      >
        <Avatar size={40} icon={<UserOutlined />} className="!bg-[#6b4423]" />
      </button>
    </Dropdown>
  );
}
