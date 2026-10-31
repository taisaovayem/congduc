import { SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import clsx from 'clsx';
import type { PkMemberView, PkRoomStatus } from '@/shared/api/types';
import type { RemoteMeritPop } from '../hooks/use-pk-room-socket';
import { Button } from '@/shared/components/ui/Button';

interface PkTeamBoardProps {
  members: PkMemberView[];
  myAccountId: string;
  remotePops: RemoteMeritPop[];
  roomStatus: PkRoomStatus;
  redTeamMerit: string;
  blueTeamMerit: string;
  isHost: boolean;
  onSwitchTeam?: () => void;
  onKickMember?: (accountId: string) => void;
}

function canHostKick(
  member: PkMemberView,
  myAccountId: string,
  isHost: boolean,
  roomStatus: PkRoomStatus,
): boolean {
  if (!isHost || member.accountId === myAccountId || member.isHost) {
    return false;
  }
  if (roomStatus === 'waiting') {
    return true;
  }
  return member.isSpectator;
}

function MemberAvatar({
  member,
  pops,
  myAccountId,
  roomStatus,
  kickable,
  onKickMember,
}: {
  member: PkMemberView;
  pops: RemoteMeritPop[];
  myAccountId: string;
  roomStatus: PkRoomStatus;
  kickable: boolean;
  onKickMember?: (accountId: string) => void;
}) {
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
    <div className="flex flex-col items-center text-center">
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
            '!bg-[#6b4423] max-md:!h-10 max-md:!w-10 max-md:!text-base',
            member.accountId === myAccountId && '!ring-2 !ring-[#c9a227]',
            kickable && 'ring-2 ring-white/40',
          )}
        />
      </div>
      <span className="mt-1 max-w-[88px] truncate text-xs font-semibold text-white">
        {member.nickname}
      </span>
      {member.isSpectator ? (
        <span className="text-[10px] text-white/60">Khán giả</span>
      ) : roomStatus === 'waiting' ? (
        member.isReady ? (
          <span className="text-[10px] text-white/75">Sẵn sàng</span>
        ) : (
          <span className="text-[10px] text-white/60">Chờ</span>
        )
      ) : null}
    </div>
  );

  if (kickable) {
    return (
      <Dropdown menu={kickMenu} trigger={['click']} placement="bottom">
        <button
          type="button"
          className="inline-flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-inherit"
          aria-label={`Menu ${member.nickname}`}
        >
          {content}
        </button>
      </Dropdown>
    );
  }

  return content;
}

function TeamColumn({
  teamLabel,
  teamMerit,
  meritClass,
  members,
  myAccountId,
  popsByAccount,
  roomStatus,
  isHost,
  showSwitchHere,
  onSwitchTeam,
  onKickMember,
}: {
  teamLabel: string;
  teamMerit: string;
  meritClass: string;
  members: PkMemberView[];
  myAccountId: string;
  popsByAccount: Map<string, RemoteMeritPop[]>;
  roomStatus: PkRoomStatus;
  isHost: boolean;
  showSwitchHere: boolean;
  onSwitchTeam?: () => void;
  onKickMember?: (accountId: string) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/85">{teamLabel}</div>
        <div className={clsx('text-xl font-extrabold md:text-2xl', meritClass)}>{teamMerit}</div>
      </div>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0">
        {members.map((member) => (
          <li key={member.accountId}>
            <MemberAvatar
              member={member}
              myAccountId={myAccountId}
              roomStatus={roomStatus}
              pops={popsByAccount.get(member.accountId) ?? []}
              kickable={canHostKick(member, myAccountId, isHost, roomStatus)}
              onKickMember={onKickMember}
            />
          </li>
        ))}
      </ul>
      {showSwitchHere && onSwitchTeam ? (
        <Button block variant="secondary" onClick={onSwitchTeam} className="mt-auto max-md:min-h-8" icon={<SwapOutlined />}>
          <Button.Label>Đổi sang phe này</Button.Label>
        </Button>
      ) : null}
    </div>
  );
}

export function PkTeamBoard({
  members,
  myAccountId,
  remotePops,
  roomStatus,
  redTeamMerit,
  blueTeamMerit,
  isHost,
  onSwitchTeam,
  onKickMember,
}: PkTeamBoardProps) {
  const me = members.find((m) => m.accountId === myAccountId);
  const fighters = members.filter((m) => !m.isSpectator && m.team);
  const spectators = members.filter((m) => m.isSpectator);
  const red = fighters.filter((m) => m.team === 'red');
  const blue = fighters.filter((m) => m.team === 'blue');

  const popsByAccount = remotePops.reduce<Map<string, RemoteMeritPop[]>>((map, pop) => {
    const list = map.get(pop.accountId) ?? [];
    list.push(pop);
    map.set(pop.accountId, list);
    return map;
  }, new Map());

  const showSwitchOnRed = roomStatus === 'waiting' && me && !me.isSpectator && me.team === 'blue';
  const showSwitchOnBlue = roomStatus === 'waiting' && me && !me.isSpectator && me.team === 'red';

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="mx-auto flex w-full max-w-[720px] items-stretch gap-3 max-md:gap-2">
        <TeamColumn
          teamLabel="Đội đỏ"
          teamMerit={redTeamMerit}
          meritClass="pk-team-merit pk-team-merit--red"
          members={red}
          myAccountId={myAccountId}
          popsByAccount={popsByAccount}
          roomStatus={roomStatus}
          isHost={isHost}
          showSwitchHere={Boolean(showSwitchOnRed)}
          onSwitchTeam={onSwitchTeam}
          onKickMember={onKickMember}
        />
        <div className="w-px shrink-0 self-stretch bg-white/20" aria-hidden />
        <TeamColumn
          teamLabel="Đội xanh"
          teamMerit={blueTeamMerit}
          meritClass="pk-team-merit pk-team-merit--blue"
          members={blue}
          myAccountId={myAccountId}
          popsByAccount={popsByAccount}
          roomStatus={roomStatus}
          isHost={isHost}
          showSwitchHere={Boolean(showSwitchOnBlue)}
          onSwitchTeam={onSwitchTeam}
          onKickMember={onKickMember}
        />
      </div>
      {spectators.length > 0 ? (
        <div className="border-t border-white/15 pt-2">
          <div className="mb-2 text-center text-xs uppercase text-white/55">Khán giả</div>
          <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0">
            {spectators.map((member) => (
              <li key={member.accountId}>
                <MemberAvatar
                  member={member}
                  myAccountId={myAccountId}
                  roomStatus={roomStatus}
                  pops={popsByAccount.get(member.accountId) ?? []}
                  kickable={canHostKick(member, myAccountId, isHost, roomStatus)}
                  onKickMember={onKickMember}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
