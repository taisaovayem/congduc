import { EditOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateNickname } from '@/modules/account/hooks/use-account-session';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface PersonalMenuProps {
  nickname: string;
  meritPoints: string;
}

export function PersonalMenu({ nickname, meritPoints }: PersonalMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [draftNickname, setDraftNickname] = useState(nickname);
  const updateNickname = useUpdateNickname();

  useEffect(() => {
    if (!editingNickname) {
      setDraftNickname(nickname);
    }
  }, [nickname, editingNickname]);

  const handleOpenTransfer = () => {
    setOpen(false);
    navigate('/chuyen-cong-duc');
  };

  const handleStartEditNickname = () => {
    setDraftNickname(nickname);
    setEditingNickname(true);
  };

  const handleCancelEditNickname = () => {
    setDraftNickname(nickname);
    setEditingNickname(false);
  };

  const handleSaveNickname = () => {
    const trimmed = draftNickname.trim();
    if (trimmed.length === 0 || trimmed === nickname) {
      handleCancelEditNickname();
      return;
    }
    updateNickname.mutate(trimmed, {
      onSuccess: () => setEditingNickname(false),
    });
  };

  const handleNicknameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveNickname();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditNickname();
    }
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setEditingNickname(false);
          setDraftNickname(nickname);
        }
      }}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={() => (
        <div className="min-w-[220px] rounded-[10px] bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0/12%)]">
          <div className="mb-3">
            {editingNickname ? (
              <Input
                value={draftNickname}
                onChange={(event) => setDraftNickname(event.target.value)}
                onBlur={handleSaveNickname}
                onKeyDown={handleNicknameKeyDown}
                maxLength={32}
                autoFocus
                disabled={updateNickname.isPending}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-base font-bold text-temple-ink">
                  {nickname}
                </span>
                <button
                  type="button"
                  className="inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0 text-neutral-500 hover:text-temple-ink"
                  aria-label="Sửa biệt danh"
                  onClick={handleStartEditNickname}
                >
                  <EditOutlined />
                </button>
              </div>
            )}
          </div>
          <dl className="mb-3">
            <dt className="mb-0.5 text-xs text-neutral-500">Công đức:</dt>
            <dd className="m-0 text-[22px] font-bold text-temple-ink">{meritPoints}</dd>
          </dl>
          <Button variant="secondary" block onClick={handleOpenTransfer} icon={<SwapOutlined />}>
            <Button.Label>
              Chuyển công đức
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
