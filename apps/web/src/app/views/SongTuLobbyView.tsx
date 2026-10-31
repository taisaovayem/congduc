import { ArrowLeftOutlined, LockOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { App, Modal, Spin, Tag } from 'antd';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '@/app/layout/AppShell';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import {
  useCoCultivationRooms,
  useCreateCoCultivationRoom,
  useJoinCoCultivationByCode,
  useQuickJoinCoCultivation,
} from '@/modules/co-cultivation/hooks/use-co-cultivation-rooms';

type LobbyModal = 'create' | 'join' | null;

export function SongTuLobbyView() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { sessionReady } = useOutletContext<AppShellContext>();
  const { data: rooms, isLoading } = useCoCultivationRooms(sessionReady);
  const createRoom = useCreateCoCultivationRoom();
  const joinByCode = useJoinCoCultivationByCode();
  const quickJoin = useQuickJoinCoCultivation();

  const [activeModal, setActiveModal] = useState<LobbyModal>(null);
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const goRoom = (roomId: string) => navigate(`/song-tu/phong/${roomId}`);

  const closeModal = () => setActiveModal(null);

  const handleCreate = async () => {
    try {
      const room = await createRoom.mutateAsync({
        name: createName.trim() || undefined,
        password: createPassword.trim() || undefined,
      });
      closeModal();
      setCreateName('');
      setCreatePassword('');
      goRoom(room.id);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không tạo được phòng');
    }
  };

  const handleJoinCode = async () => {
    try {
      const room = await joinByCode.mutateAsync({
        roomCode: joinCode.trim().toUpperCase(),
        password: joinPassword.trim() || undefined,
      });
      closeModal();
      setJoinCode('');
      setJoinPassword('');
      goRoom(room.id);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không tham gia được phòng');
    }
  };

  const handleQuickJoin = async () => {
    try {
      const room = await quickJoin.mutateAsync();
      goRoom(room.id);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không có phòng phù hợp');
    }
  };

  return (
    <div className="song-tu-ui flex w-full flex-col gap-4 pb-8 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => navigate('/')} icon={<ArrowLeftOutlined />}>
          <Button.Label>
            Trở về
          </Button.Label>
        </Button>
        <Button
          variant="secondary"
          onClick={() => void handleQuickJoin()}
          disabled={quickJoin.isPending}
          icon={<ThunderboltOutlined />}
        >
          <Button.Label>Tham gia nhanh</Button.Label>
        </Button>
        <Button variant="secondary" onClick={() => setActiveModal('join')}>
          <Button.Label>Tham gia</Button.Label>
        </Button>
        <Button onClick={() => setActiveModal('create')} icon={<PlusOutlined />}>
          <Button.Label>
            Tạo phòng
          </Button.Label>
        </Button>
      </div>

      <Card className="border-0 bg-transparent p-4 shadow-none [&_.ant-card-body]:p-0" padded={false}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : !rooms?.length ? (
          <p className="px-1 text-sm text-white/80">Chưa có phòng nào. Hãy tạo phòng mới!</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/25 bg-transparent px-3 py-2 text-left text-white hover:bg-white/10"
                  onClick={() => goRoom(room.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{room.name}</div>
                    <div className="text-xs text-white/75">
                      Mã {room.roomCode} · {room.memberCount} người
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {room.hasPassword ? <LockOutlined className="text-white/70" /> : null}
                    <Tag color={room.status === 'active' ? 'green' : 'default'}>
                      {room.status === 'active' ? 'Đang tu' : 'Chờ'}
                    </Tag>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        title="Tạo phòng"
        open={activeModal === 'create'}
        onCancel={closeModal}
        onOk={() => void handleCreate()}
        okText="Tạo phòng"
        cancelText="Huỷ"
        confirmLoading={createRoom.isPending}
        destroyOnClose
      >
        <div className="flex flex-col gap-3 pt-2">
          <Input
            placeholder="Tên phòng (để trống = tên ngẫu nhiên)"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            maxLength={64}
          />
          <Input.Password
            placeholder="Mật khẩu (tuỳ chọn)"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Tham gia phòng"
        open={activeModal === 'join'}
        onCancel={closeModal}
        onOk={() => void handleJoinCode()}
        okText="Tham gia"
        cancelText="Huỷ"
        confirmLoading={joinByCode.isPending}
        destroyOnClose
      >
        <div className="flex flex-col gap-3 pt-2">
          <Input
            placeholder="Mã phòng"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={16}
          />
          <Input.Password
            placeholder="Mật khẩu phòng (nếu có)"
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
          />
        </div>
      </Modal>

    </div>
  );
}
