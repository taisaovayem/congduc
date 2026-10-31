import {
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  LogoutOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { App, Input, Modal, Spin, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { AppShellContext } from '@/app/layout/AppShell';
import { CoCultivationPlayerGrid } from '@/modules/co-cultivation/components/CoCultivationPlayerGrid';
import { useCoCultivationRoomSocket } from '@/modules/co-cultivation/hooks/use-co-cultivation-room-socket';
import { joinCoCultivationById, leaveCoCultivationRoom } from '@/modules/co-cultivation/api/co-cultivation-api';
import { SongTuMokPanel } from '@/modules/co-cultivation/components/SongTuMokPanel';
import { Button } from '@/shared/components/ui/Button';
import { ApiError } from '@/shared/api/http-client';
import { getStoredDeviceId } from '@/shared/storage/device-session';

export function SongTuRoomView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { sessionReady } = useOutletContext<AppShellContext>();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [joining, setJoining] = useState(true);
  const [roomPassword, setRoomPassword] = useState<string | undefined>();

  const {
    connected,
    room,
    remotePops,
    kicked,
    setReady,
    startPractice,
    leaveRoomSocket,
    kickMember,
    hitMok,
  } = useCoCultivationRoomSocket(roomId, sessionReady && !joining, roomPassword);

  useEffect(() => {
    if (!sessionReady || !roomId) {
      return;
    }
    const deviceId = getStoredDeviceId();
    if (!deviceId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await joinCoCultivationById(deviceId, roomId);
        if (!cancelled) {
          setJoining(false);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setPasswordModalOpen(true);
          return;
        }
        message.error(
          err instanceof ApiError ? err.message : 'Không vào được phòng',
        );
        navigate('/song-tu');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, sessionReady]);

  useEffect(() => {
    if (kicked) {
      message.warning('Bạn đã bị đuổi khỏi phòng');
      navigate('/song-tu');
    }
  }, [kicked, message, navigate]);

  const me = useMemo(
    () => room?.members.find((m) => m.accountId === room.myAccountId),
    [room],
  );

  const shareUrl = useMemo(() => {
    if (!roomId) {
      return '';
    }
    return `${window.location.origin}/song-tu/phong/${roomId}`;
  }, [roomId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('Đã copy link phòng');
    } catch {
      message.error('Không copy được link');
    }
  };

  const handleLeave = async () => {
    leaveRoomSocket();
    const deviceId = getStoredDeviceId();
    if (deviceId && roomId) {
      try {
        await leaveCoCultivationRoom(deviceId, roomId);
      } catch {
        /* socket disconnect cũng xử lý rời phòng */
      }
    }
    navigate('/song-tu');
  };

  const handlePasswordJoin = async () => {
    const deviceId = getStoredDeviceId();
    if (!deviceId || !roomId) {
      return;
    }
    try {
      const pwd = joinPassword.trim() || undefined;
      await joinCoCultivationById(deviceId, roomId, pwd);
      setRoomPassword(pwd);
      setPasswordModalOpen(false);
      setJoining(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Mật khẩu không đúng');
    }
  };

  const practiceActive = room?.status === 'active';
  const isHost = room?.hostAccountId === room?.myAccountId;

  if (joining && !room) {
    return (
      <div className="song-tu-ui flex justify-center py-16 text-white">
        <Spin size="large" tip="Đang vào phòng…" />
      </div>
    );
  }

  return (
    <div className="song-tu-ui flex min-h-0 flex-1 flex-col gap-4 pb-6 text-white">
      <Modal
        title="Phòng có mật khẩu"
        open={passwordModalOpen}
        onOk={() => void handlePasswordJoin()}
        onCancel={() => navigate('/song-tu')}
        okText="Vào phòng"
        cancelText="Quay lại"
      >
        <Input.Password
          placeholder="Nhập mật khẩu phòng"
          value={joinPassword}
          onChange={(e) => setJoinPassword(e.target.value)}
        />
      </Modal>

      {room ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="m-0 flex items-center gap-2 text-lg font-bold text-white">
                {room.name}
                {room.hasPassword ? <LockOutlined className="text-sm text-white/70" /> : null}
              </h1>
              <p className="m-0 mt-1 text-sm text-white/90">
                Mã phòng <strong className="text-white">{room.roomCode}</strong>
                <Tag className="ml-2" color={room.status === 'active' ? 'green' : 'default'}>
                  {room.status === 'active' ? 'Đang song tu' : 'Đang chờ'}
                </Tag>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void handleCopyLink()} icon={<ShareAltOutlined />}>
                <Button.Label>
                  Chia sẻ
                </Button.Label>
              </Button>
              <Button variant="secondary" onClick={() => void handleLeave()} icon={<LogoutOutlined />}>
                <Button.Label>
                  Rời phòng
                </Button.Label>
              </Button>
            </div>
          </div>

          <div className="py-2 text-center">
            <div className="song-tu-team-merit text-3xl font-extrabold tracking-wide">
              {room.teamMeritHits}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-2">
            <CoCultivationPlayerGrid
              members={room.members}
              myAccountId={room.myAccountId}
              remotePops={remotePops}
              roomStatus={room.status}
              isHost={isHost}
              onKickMember={kickMember}
            />
          </div>

          {room.status === 'waiting' && isHost ? (
            <Button block onClick={() => startPractice()}>
              <Button.Label>Bắt đầu song tu</Button.Label>
            </Button>
          ) : null}

          {room.status === 'waiting' && !isHost ? (
            <Button
              block
              onClick={() => setReady(!me?.isReady)}
              variant={me?.isReady ? 'secondary' : 'primary'}
            >
              <Button.Label>
                {me?.isReady ? (
                  <>
                    <CloseOutlined /> Bỏ sẵn sàng
                  </>
                ) : (
                  <>
                    <CheckOutlined /> Sẵn sàng
                  </>
                )}
              </Button.Label>
            </Button>
          ) : null}

          <div className="mt-auto translate-y-2 md:translate-y-0">
            <SongTuMokPanel
              socketConnected={connected}
              practiceActive={practiceActive}
              onHit={hitMok}
            />
          </div>
        </>
      ) : (
        <div className="flex justify-center py-12 text-white">
          <Spin tip="Đang đồng bộ phòng…" />
        </div>
      )}
    </div>
  );
}
