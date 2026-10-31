import {
  ArrowLeftOutlined,
  LockOutlined,
  LoginOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { App, Modal, Segmented, Slider, Spin, Tag } from 'antd';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '@/app/layout/AppShell';
import { PK_MODE_LABELS, formatPkTeamSize } from '@/modules/pk/constants/pk-labels';
import {
  useCreatePkRoom,
  useJoinPkByCode,
  usePkRooms,
  useQuickJoinPk,
} from '@/modules/pk/hooks/use-pk-rooms';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import type { PkMode } from '@/shared/api/types';

type LobbyModal = 'create' | 'join' | null;

const TEAM_SIZE_OPTIONS = [1, 2, 3, 4, 5] as const;
const DURATION_MARKS: Record<number, string> = {
  1: '1p',
  2: '2p',
  3: '3p',
  4: '4p',
  5: '5p',
  6: '6p',
  7: '7p',
  8: '8p',
  9: '9p',
  10: '10p',
};

const MODE_OPTIONS: { label: string; value: PkMode }[] = [
  { label: PK_MODE_LABELS.friendly, value: 'friendly' },
  { label: PK_MODE_LABELS.winner_takes_all, value: 'winner_takes_all' },
  { label: PK_MODE_LABELS.fixed_stake, value: 'fixed_stake' },
];

export function PkLobbyView() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { sessionReady } = useOutletContext<AppShellContext>();
  const { data: rooms, isLoading, refetch, isFetching } = usePkRooms(sessionReady);
  const createRoom = useCreatePkRoom();
  const joinByCode = useJoinPkByCode();
  const quickJoin = useQuickJoinPk();

  const [activeModal, setActiveModal] = useState<LobbyModal>(null);
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [mode, setMode] = useState<PkMode>('friendly');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const goRoom = (roomId: string, roomPassword?: string) =>
    navigate(`/pk/phong/${roomId}`, {
      state: roomPassword ? { roomPassword } : undefined,
    });

  const closeModal = () => setActiveModal(null);

  const handleCreate = async () => {
    try {
      const room = await createRoom.mutateAsync({
        name: createName.trim() || undefined,
        password: createPassword.trim() || undefined,
        teamSize,
        mode,
        stakeAmount: mode === 'fixed_stake' ? stakeAmount.trim() || undefined : undefined,
        durationMinutes,
      });
      closeModal();
      setCreateName('');
      setCreatePassword('');
      goRoom(room.id, createPassword.trim() || undefined);
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
      goRoom(room.id, joinPassword.trim() || undefined);
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
    <div className="pk-ui flex w-full flex-col gap-4 pb-8 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => navigate('/')}
          icon={<ArrowLeftOutlined />}
          aria-label="Trở về"
          className="max-md:min-h-9 max-md:min-w-9 max-md:px-2"
        />
        <Button
          variant="secondary"
          onClick={() => void refetch()}
          disabled={isFetching}
          icon={<ReloadOutlined spin={isFetching} />}
          aria-label="Làm mới danh sách"
          className="max-md:min-h-9 max-md:min-w-9 max-md:px-2"
        />
        <Button
          variant="secondary"
          onClick={() => void handleQuickJoin()}
          disabled={quickJoin.isPending}
          icon={<ThunderboltOutlined />}
        >
          <Button.Label>Tham gia nhanh</Button.Label>
        </Button>
        <Button variant="secondary" onClick={() => setActiveModal('join')} icon={<LoginOutlined />}>
          <Button.Label>Tham gia</Button.Label>
        </Button>
        <Button onClick={() => setActiveModal('create')} icon={<PlusOutlined />}>
          <Button.Label>Tạo phòng</Button.Label>
        </Button>
      </div>

      <Card className="border-0 bg-transparent p-4 shadow-none [&_.ant-card-body]:p-0" padded={false}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : !rooms?.length ? (
          <p className="px-1 text-sm text-white/80">Chưa có phòng PK nào. Hãy tạo phòng mới!</p>
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
                      Mã {room.roomCode} · {formatPkTeamSize(room.teamSize)} ·{' '}
                      {PK_MODE_LABELS[room.mode]} · {room.memberCount} người
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {room.hasPassword ? <LockOutlined className="text-white/70" /> : null}
                    <Tag color={room.status === 'active' ? 'green' : 'default'}>
                      {room.status === 'active' ? 'Đang PK' : 'Chờ'}
                    </Tag>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        title="Tạo phòng PK"
        open={activeModal === 'create'}
        onCancel={closeModal}
        onOk={() => void handleCreate()}
        okText="Tạo phòng"
        cancelText="Huỷ"
        confirmLoading={createRoom.isPending}
        destroyOnClose
        width={480}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <div className="mb-2 text-sm text-white/85">Chế độ</div>
            <Segmented
              block
              value={mode}
              onChange={(v) => setMode(v as PkMode)}
              options={MODE_OPTIONS}
            />
          </div>
          <div>
            <div className="mb-2 text-sm text-white/85">Số người mỗi phe</div>
            <Segmented
              block
              value={teamSize}
              onChange={(v) => setTeamSize(Number(v))}
              options={TEAM_SIZE_OPTIONS.map((n) => ({
                label: formatPkTeamSize(n),
                value: n,
              }))}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm text-white/85">Thời gian một trận</span>
              <span
                className="rounded-md bg-[#c9a227]/25 px-2.5 py-1 text-base font-bold tabular-nums text-[#f5d878]"
                aria-live="polite"
              >
                {durationMinutes} phút
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              marks={DURATION_MARKS}
              tooltip={{ formatter: (value) => `${value ?? 1} phút` }}
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
            <p className="mb-0 mt-2 text-center text-xs text-white/60">
              Trận PK sẽ kết thúc sau <strong className="text-white/85">{durationMinutes} phút</strong>
            </p>
          </div>
          {mode === 'fixed_stake' ? (
            <Input
              placeholder="Số công đức cược"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
            />
          ) : null}
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
