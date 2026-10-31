import { Modal } from 'antd';
import clsx from 'clsx';
import type { PkMatchEndedParticipant, PkMatchEndedPayload } from '@/shared/api/types';
import { PK_MODE_LABELS } from '@/modules/pk/constants/pk-labels';

interface PkMatchResultModalProps {
  result: PkMatchEndedPayload | null;
  onClose: () => void;
}

function formatSettlement(delta: string): string | null {
  const value = BigInt(delta);
  if (value === 0n) {
    return null;
  }
  if (value > 0n) {
    return `+${value.toString()} công đức`;
  }
  return `${value.toString()} công đức`;
}

function rankWithinTeam(participants: PkMatchEndedParticipant[], team: 'red' | 'blue') {
  return participants
    .filter((row) => row.team === team)
    .sort((a, b) => {
      const diff = BigInt(b.matchMeritHits) - BigInt(a.matchMeritHits);
      if (diff > 0n) {
        return 1;
      }
      if (diff < 0n) {
        return -1;
      }
      return a.nickname.localeCompare(b.nickname, 'vi');
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function TeamRankingList({
  title,
  accentClass,
  rows,
}: {
  title: string;
  accentClass: string;
  rows: PkMatchEndedParticipant[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className={clsx('m-0 mb-2 text-center text-xs font-bold uppercase tracking-wide', accentClass)}>
        {title}
      </p>
      <ol className="m-0 max-h-[min(45vh,280px)] list-none space-y-2 overflow-y-auto p-0">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-neutral-200 px-2 py-3 text-center text-xs text-neutral-500">
            Không có thành viên
          </li>
        ) : (
          rows.map((row) => {
            const ledger = formatSettlement(row.settlementDelta);
            return (
              <li
                key={row.accountId}
                className="flex items-start justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-xs font-bold tabular-nums text-neutral-800">
                      #{row.rank}
                    </span>
                    <span className="truncate text-sm font-medium text-black">{row.nickname}</span>
                  </div>
                  {ledger ? <div className="mt-0.5 text-xs text-neutral-600">{ledger}</div> : null}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-amber-700">
                  {row.matchMeritHits}
                </span>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}

export function PkMatchResultModal({ result, onClose }: PkMatchResultModalProps) {
  const winnerLabel =
    result?.winnerTeam === 'red'
      ? 'Đội đỏ thắng'
      : result?.winnerTeam === 'blue'
        ? 'Đội xanh thắng'
        : 'Hòa';

  const redRows = result ? rankWithinTeam(result.participants, 'red') : [];
  const blueRows = result ? rankWithinTeam(result.participants, 'blue') : [];

  return (
    <Modal
      title="Kết thúc trận PK"
      open={Boolean(result)}
      onOk={onClose}
      onCancel={onClose}
      okText="Đóng"
      cancelButtonProps={{ style: { display: 'none' } }}
      maskClosable={false}
      width={520}
      className="pk-match-result-modal"
    >
      {result ? (
        <div className="space-y-3 pt-1 text-sm text-black">
          <div>
            <p className="m-0 font-semibold text-black">{winnerLabel}</p>
            <p className="m-0 mt-1 text-neutral-800">
              Tổng trận — Đỏ {result.redTeamMerit} · Xanh {result.blueTeamMerit}
            </p>
            <p className="m-0 text-neutral-600">Chế độ: {PK_MODE_LABELS[result.mode]}</p>
          </div>
          <div>
            <div className="flex gap-3">
              <TeamRankingList title="Đội đỏ" accentClass="text-red-600" rows={redRows} />
              <div className="w-px shrink-0 bg-neutral-200" aria-hidden />
              <TeamRankingList title="Đội xanh" accentClass="text-blue-600" rows={blueRows} />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
