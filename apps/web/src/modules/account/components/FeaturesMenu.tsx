import { DownOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FeaturesMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={() => (
        <div className="flex flex-col gap-1 bg-transparent p-2">
          <button
            type="button"
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-0 bg-transparent -mx-4 py-2 text-white"
            onClick={() => {
              setOpen(false);
              navigate('/song-tu');
            }}
          >
            <TeamOutlined className="text-lg" />
            <span className="text-sm font-medium leading-tight">Song tu</span>
          </button>
          <button
            type="button"
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-0 bg-transparent -mx-4 py-2 text-white"
            onClick={() => {
              setOpen(false);
              navigate('/pk');
            }}
          >
            <ThunderboltOutlined className="text-lg" />
            <span className="text-sm font-medium leading-tight">PK</span>
          </button>
        </div>
      )}
    >
      <button
        type="button"
        className="inline-flex h-6 w-10 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-white"
        aria-label="Mở menu tính năng"
        aria-expanded={open}
      >
        <DownOutlined
          className={clsx('text-xs transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
    </Dropdown>
  );
}
