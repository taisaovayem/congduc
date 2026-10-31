import { UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import clsx from 'clsx';
import type { CoCultivationMemberView, CoCultivationRoomStatus } from '@/shared/api/types';
import type { RemoteMeritPop } from '../hooks/use-co-cultivation-room-socket';

interface CoCultivationPlayerGridProps {
  members: CoCultivationMemberView[];
  myAccountId: string;
  remotePops: RemoteMeritPop[];
  roomStatus: CoCultivationRoomStatus;
  isHost: boolean;
  onKickMember?: (accountId: string) => void;
}

export function CoCultivationPlayerGrid({
  members,
  myAccountId,
  remotePops,
  roomStatus,
  isHost,
  onKickMember,
}: CoCultivationPlayerGridProps) {
  const popsByAccount = remotePops.reduce<Map<string, RemoteMeritPop[]>>((map, pop) => {
    const list = map.get(pop.accountId) ?? [];
    list.push(pop);
    map.set(pop.accountId, list);
    return map;
  }, new Map());

  const canHostKick = (member: CoCultivationMemberView): boolean => {
    if (!isHost || member.accountId === myAccountId) {
      return false;
    }
    if (roomStatus === 'active') {
      return member.isParticipating;
    }
    return true;
  };

  return (
    <ul className="mx-auto grid max-w-[560px] list-none grid-cols-[repeat(auto-fill,minmax(88px,1fr))] justify-center gap-3 p-0">
      {members.map((member) => {
        const pops = popsByAccount.get(member.accountId) ?? [];
        const kickable = canHostKick(member);

        const kickMenu: MenuProps = {
          items: [
            {
              key: 'kick',
              label: 'Đuổi khỏi phòng',
              danger: true,
              onClick: () => onKickMember?.(member.accountId),
            },
          ],
        };

        const content = (
          <>
            <div className="relative">
              {pops.map((pop) => (
                <span
                  key={pop.id}
                  aria-hidden
                  className="merit-pop merit-pop--mok pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2"
                  style={{ ['--merit-drift' as string]: `${pop.driftPx * 10}px` }}
                >
                  +{pop.amount} công đức
                </span>
              ))}
              <Avatar
                size={48}
                icon={<UserOutlined />}
                className={clsx(
                  '!bg-[#6b4423]',
                  member.accountId === myAccountId && '!ring-2 !ring-[#c9a227]',
                  kickable && 'ring-2 ring-white/40',
                )}
              />
            </div>
            <span className="mt-1 max-w-[88px] truncate text-xs font-semibold text-white">
              {member.nickname}
            </span>
            {!member.isParticipating && member.isReady ? (
              <span className="text-[10px] text-white/75">Sẵn sàng</span>
            ) : null}
            {!member.isParticipating && !member.isReady ? (
              <span className="text-[10px] text-white/60">Chờ</span>
            ) : null}
          </>
        );

        return (
          <li key={member.accountId} className="flex flex-col items-center text-center">
            {kickable ? (
              <Dropdown menu={kickMenu} trigger={['click']} placement="bottom">
                <button
                  type="button"
                  className="inline-flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-inherit"
                  aria-label={`Menu ${member.nickname}`}
                >
                  {content}
                </button>
              </Dropdown>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
