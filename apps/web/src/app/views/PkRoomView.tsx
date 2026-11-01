import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  LockOutlined,
  LogoutOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { App, Input, Modal, Spin, Tag } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { AppShellContext } from '@/app/layout/AppShell';
import { PkMatchResultModal } from '@/modules/pk/components/PkMatchResultModal';
import { PkTeamBoard } from '@/modules/pk/components/PkTeamBoard';
import { PK_MODE_LABELS, formatPkTeamSize } from '@/modules/pk/constants/pk-labels';
import { formatMatchTimer, usePkMatchTimer } from '@/modules/pk/hooks/use-pk-match-timer';
import { usePkStartCountdown } from '@/modules/pk/hooks/use-pk-start-countdown';
import { usePkRoomSocket } from '@/modules/pk/hooks/use-pk-room-socket';
import { joinPkById } from '@/modules/pk/api/pk-api';
import { SongTuMokPanel } from '@/modules/co-cultivation/components/SongTuMokPanel';
import { Button } from '@/shared/components/ui/Button';
import { ApiError } from '@/shared/api/http-client';
import { getStoredDeviceId } from '@/shared/storage/device-session';

export function PkRoomView() {
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
    matchEnded,
    kicked,
    clearMatchEnded,
    setReady,
    startMatch,
    leaveRoomSocket,
    switchTeam,
    kickMember,
    hitMok,
  } = usePkRoomSocket(
    roomId,
    sessionReady && !joining && !passwordModalOpen,
    roomPassword ?? initialRoomPassword,
  );

  const matchActive = room?.status === 'active';
  const { inCountdown, countdownSeconds } = usePkStartCountdown(room?.matchStartedAt, matchActive);
  const fightStarted = matchActive && !inCountdown;
  const remainingSeconds = usePkMatchTimer(room?.matchEndsAt, fightStarted);

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
        await joinPkById(deviceId, roomId, pwd);
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
        navigate('/pk');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, sessionReady, initialRoomPassword, message, navigate]);

  useEffect(() => {
    if (kicked) {
      message.warning('Bạn đã bị đuổi khỏi phòng');
      navigate('/pk');
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
    return `${window.location.origin}/pk/phong/${roomId}`;
  }, [roomId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('Đã copy link phòng');
    } catch {
      message.error('Không copy được link');
    }
  };

  const handleCopyRoomCode = async () => {
    if (!room?.roomCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(room.roomCode);
      message.success('Đã copy mã phòng');
    } catch {
      message.error('Không copy được mã phòng');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRoomSocket();
      navigate('/pk');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không rời được phòng');
    }
  };

  const handleStart = async () => {
    try {
      await startMatch();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không bắt đầu được trận PK');
    }
  };

  const handlePasswordJoin = async () => {
    const deviceId = getStoredDeviceId();
    if (!deviceId || !roomId) {
      return;
    }
    try {
      const pwd = joinPassword.trim() || undefined;
      await joinPkById(deviceId, roomId, pwd);
      setRoomPassword(pwd);
      setPasswordModalOpen(false);
      setJoining(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Mật khẩu không đúng');
    }
  };

  const isHost = room?.hostAccountId === room?.myAccountId;
  const canHit = Boolean(me?.isFighter && !me.isSpectator && fightStarted);
  const showJoinSpinner = joining && !room && !passwordModalOpen;

  return (
    <div className="pk-ui pk-room flex h-full min-h-0 flex-1 flex-col text-white">
      {showJoinSpinner ? (
        <div className="flex flex-1 justify-center py-16">
          <Spin size="large" tip="Đang vào phòng…" />
        </div>
      ) : null}

      <Modal
        title="Phòng có mật khẩu"
        open={passwordModalOpen}
        onOk={() => void handlePasswordJoin()}
        onCancel={() => navigate('/pk')}
        okText="Vào phòng"
        cancelText="Quay lại"
      >
        <Input.Password
          placeholder="Nhập mật khẩu phòng"
          value={joinPassword}
          onChange={(e) => setJoinPassword(e.target.value)}
        />
      </Modal>

      <PkMatchResultModal result={matchEnded} onClose={clearMatchEnded} />

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
                  <span className="inline-flex items-center gap-1">
                    Mã <strong className="text-white">{room.roomCode}</strong>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0 text-white/75 hover:text-white"
                      aria-label="Copy mã phòng"
                      onClick={() => void handleCopyRoomCode()}
                    >
                      <CopyOutlined className="text-xs md:text-sm" />
                    </button>
                  </span>
                  <span>{formatPkTeamSize(room.teamSize)}</span>
                  <span>{PK_MODE_LABELS[room.mode]}</span>
                  {room.mode === 'fixed_stake' && room.stakeAmount ? (
                    <span>Cược {room.stakeAmount}</span>
                  ) : null}
                  <Tag
                    className="!m-0 !text-[10px] !leading-tight md:!text-xs"
                    color={fightStarted ? 'green' : inCountdown ? 'gold' : 'default'}
                  >
                    {fightStarted ? 'Đang PK' : inCountdown ? 'Chuẩn bị' : 'Chờ'}
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

            {inCountdown ? (
              <div className="py-0.5 text-center">
                <p className="m-0 text-xs text-white/75 md:text-sm">Chuẩn bị…</p>
                <p className="m-0 text-3xl font-bold tabular-nums md:text-4xl">{countdownSeconds}</p>
              </div>
            ) : fightStarted ? (
              <div className="py-0.5 text-center text-lg font-bold tabular-nums md:text-xl">
                {formatMatchTimer(remainingSeconds)}
              </div>
            ) : null}
          </header>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 md:flex md:flex-col md:justify-center md:py-2">
            {inCountdown ? (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/45"
                aria-live="polite"
                aria-label={`Bắt đầu sau ${countdownSeconds} giây`}
              >
                <span className="text-sm font-medium text-white/90 md:text-base">Bắt đầu PK</span>
                <span className="text-6xl font-bold tabular-nums md:text-7xl">{countdownSeconds}</span>
              </div>
            ) : null}
            <PkTeamBoard
              members={room.members}
              myAccountId={room.myAccountId}
              remotePops={remotePops}
              roomStatus={room.status}
              redTeamMerit={room.redTeamMerit}
              blueTeamMerit={room.blueTeamMerit}
              isHost={isHost}
              onSwitchTeam={room.status === 'waiting' ? switchTeam : undefined}
              onKickMember={isHost ? kickMember : undefined}
            />
          </div>

          <footer className="shrink-0 space-y-2 pt-1 max-md:space-y-1.5 md:pt-2">
            {room.status === 'waiting' && isHost ? (
              <Button block onClick={() => void handleStart()} className="max-md:min-h-9">
                <Button.Label>Bắt đầu PK</Button.Label>
              </Button>
            ) : null}

            {room.status === 'waiting' && me && !me.isSpectator && !isHost ? (
              <Button
                block
                onClick={() => setReady(!me.isReady)}
                variant={me.isReady ? 'secondary' : 'primary'}
                className="max-md:min-h-9"
              >
                <Button.Label>
                  {me.isReady ? (
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

            {me?.isSpectator && matchActive ? (
              <p className="m-0 text-center text-xs text-white/75">Bạn đang xem — không gõ được mõ</p>
            ) : null}

            <div
              className={clsx(
                'mx-auto w-fit max-md:-mb-1',
                '[&_img]:max-md:!w-[112px]',
                !canHit && 'opacity-50',
              )}
            >
              <SongTuMokPanel
                socketConnected={connected}
                practiceActive={canHit}
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
