import {
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  LogoutOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { App, Input, Modal, Spin, Tag } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const initialRoomPassword = (location.state as { roomPassword?: string } | null)?.roomPassword;
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
  } = useCoCultivationRoomSocket(
    roomId,
    sessionReady && !joining && !passwordModalOpen,
    roomPassword ?? initialRoomPassword,
  );

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
        const pwd = initialRoomPassword;
        await joinCoCultivationById(deviceId, roomId, pwd);
        if (!cancelled) {
          if (pwd) {
            setRoomPassword(pwd);
          }
          setJoining(false);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setJoining(false);
          setPasswordModalOpen(true);
          return;
        }
        message.error(err instanceof ApiError ? err.message : 'Không vào được phòng');
        navigate('/song-tu');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, sessionReady, initialRoomPassword, message, navigate]);

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

  const showJoinSpinner = joining && !room && !passwordModalOpen;

  return (
    <div className="song-tu-ui song-tu-room flex h-full min-h-0 flex-1 flex-col text-white">
      {showJoinSpinner ? (
        <div className="flex flex-1 justify-center py-16">
          <Spin size="large" tip="Đang vào phòng…" />
        </div>
      ) : null}

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

      {!showJoinSpinner && room ? (
        <>
          <header className="shrink-0 space-y-1 max-md:space-y-0.5 md:space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="m-0 flex items-center gap-1.5 truncate text-base font-bold md:text-lg">
                  {room.name}
                  {room.hasPassword ? (
                    <LockOutlined className="shrink-0 text-xs text-white/70 md:text-sm" />
                  ) : null}
                </h1>
                <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-white/85 md:text-sm">
                  <span>
                    Mã <strong className="text-white">{room.roomCode}</strong>
                  </span>
                  <Tag
                    className="!m-0 !text-[10px] !leading-tight md:!text-xs"
                    color={room.status === 'active' ? 'green' : 'default'}
                  >
                    {room.status === 'active' ? 'Đang song tu' : 'Chờ'}
                  </Tag>
                </p>
              </div>
              <div className="flex shrink-0 gap-1 md:gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void handleCopyLink()}
                  icon={<ShareAltOutlined />}
                  aria-label="Chia sẻ"
                  className="max-md:min-h-9 max-md:min-w-9 max-md:px-2"
                >
                  <span className="hidden md:inline">
                    <Button.Label>Chia sẻ</Button.Label>
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleLeave()}
                  icon={<LogoutOutlined />}
                  aria-label="Rời phòng"
                  className="max-md:min-h-9 max-md:min-w-9 max-md:px-2"
                >
                  <span className="hidden md:inline">
                    <Button.Label>Rời phòng</Button.Label>
                  </span>
                </Button>
              </div>
            </div>

            <div className="py-0.5 text-center md:py-2">
              <div className="song-tu-team-merit text-2xl font-extrabold tracking-wide md:text-3xl">
                {room.teamMeritHits}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 md:flex md:flex-col md:justify-center md:py-2">
            <CoCultivationPlayerGrid
              members={room.members}
              myAccountId={room.myAccountId}
              remotePops={remotePops}
              roomStatus={room.status}
              isHost={isHost}
              onKickMember={kickMember}
            />
          </div>

          <footer className="shrink-0 space-y-2 pt-1 max-md:space-y-1.5 md:pt-2">
            {room.status === 'waiting' && isHost ? (
              <Button block onClick={() => startPractice()} className="max-md:min-h-9">
                <Button.Label>Bắt đầu song tu</Button.Label>
              </Button>
            ) : null}

            {room.status === 'waiting' && !isHost ? (
              <Button
                block
                onClick={() => setReady(!me?.isReady)}
                variant={me?.isReady ? 'secondary' : 'primary'}
                className="max-md:min-h-9"
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

            <div
              className={clsx(
                'mx-auto w-fit max-md:-mb-1',
                '[&_img]:max-md:!w-[112px]',
              )}
            >
              <SongTuMokPanel
                socketConnected={connected}
                practiceActive={practiceActive}
                onHit={hitMok}
              />
            </div>
          </footer>
        </>
      ) : !showJoinSpinner && !passwordModalOpen ? (
        <div className="flex flex-1 justify-center py-12">
          <Spin tip="Đang đồng bộ phòng…" />
        </div>
      ) : null}
    </div>
  );
}
