import type { SweepData, Match, Highlights } from '../types';
import { FlagCrest } from './FlagCrest';

interface Props {
  sweep: SweepData;
  showFlags?: boolean;
}

const PRETTY: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-finals',
  SF: 'Semi-finals', TP: 'Third place', FINAL: 'Final',
};
const SRC_PRETTY: Record<string, string> = { R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF' };

const MEDAL = {
  gold:   { bg: '#FFF8E1', ink: '#9A7B1F', solid: '#F5C842' },
  bronze: { bg: '#FBF0E8', ink: '#8A5A33', solid: '#CD8B5B' },
};

function highlightFor(teamId: number | null, hl: Highlights) {
  if (teamId == null) return null;
  if (teamId === hl.championTeamId) return { label: 'Champion', bg: MEDAL.gold.bg, color: MEDAL.gold.ink, ring: MEDAL.gold.solid };
  if (teamId === hl.thirdTeamId)    return { label: '3rd place', bg: MEDAL.bronze.bg, color: MEDAL.bronze.ink, ring: MEDAL.bronze.solid };
  if (teamId === hl.underdogTeamId) return { label: 'Underdog', bg: 'var(--blue-tint-hover)', color: 'var(--blue-deep-active)', ring: 'var(--surface-primary)' };
  return null;
}

function LegendChip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color, background: bg, padding: '3px 9px', borderRadius: 100, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function roundOf(fromId?: string) { return fromId ? fromId.split('-')[0] : ''; }

interface SlotProps {
  teamId: number | null;
  fromId?: string;
  score: number | null;
  isWinner: boolean;
  played: boolean;
  showFlags: boolean;
  top: boolean;
  sweep: SweepData;
  ownerInitials?: string;
}
function Slot({ teamId, fromId, score, isWinner, played, showFlags, top, sweep, ownerInitials }: SlotProps) {
  const team = teamId != null ? sweep.teams[teamId] : null;
  const dim = played && !isWinner;
  const hl = highlightFor(teamId, sweep.highlights);
  const defaultBg = played && isWinner ? 'var(--blue-tint-hover)' : 'transparent';
  const bg = hl && hl.label !== 'Underdog' ? hl.bg : defaultBg;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
      borderBottom: top ? '1px solid var(--fg-faint)' : 'none',
      background: bg,
      borderRadius: top ? '8px 8px 0 0' : '0 0 8px 8px',
      boxShadow: hl ? `inset 3px 0 0 0 ${hl.ring}` : 'none',
    }}>
      {team ? (
        <>
          {showFlags && <FlagCrest flag={team.flag} size={18} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: isWinner && played ? 700 : 600, color: dim ? 'var(--grey-400)' : 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</span>
              {hl && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: hl.color, background: hl.bg, padding: '2px 6px', borderRadius: 100, flexShrink: 0, whiteSpace: 'nowrap' }}>{hl.label}</span>}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--grey-400)', flexShrink: 0 }}>{ownerInitials}</span>
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--grey-400)', fontStyle: 'italic', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fromId && SRC_PRETTY[roundOf(fromId)]
            ? `Winner · ${SRC_PRETTY[roundOf(fromId)]}`
            : (fromId ?? 'TBD')}
        </span>
      )}
      {played && (
        <span style={{ fontSize: 13, fontWeight: 800, color: dim ? 'var(--grey-400)' : 'var(--orah-navy)', width: 14, textAlign: 'center', flexShrink: 0 }}>{score}</span>
      )}
    </div>
  );
}

function MatchCard({ m, showFlags, sweep }: { m: Match; showFlags: boolean; sweep: SweepData }) {
  const aWin = m.played && m.winnerId === m.aId;
  const bWin = m.played && m.winnerId === m.bId;
  const initials = (id: number | null) => {
    if (id == null) return '';
    const t = sweep.teams[id];
    return sweep.people[t.ownerId].name.split(' ').map(s => s[0]).join('');
  };
  return (
    <div style={{ width: 230, border: '1px solid var(--grey-200)', borderRadius: 10, background: 'white', boxShadow: 'var(--shadow-card-hover)' }}>
      <Slot teamId={m.aId} fromId={m.aFrom} score={m.sa} isWinner={aWin} played={m.played} showFlags={showFlags} top sweep={sweep} ownerInitials={initials(m.aId)} />
      <Slot teamId={m.bId} fromId={m.bFrom} score={m.sb} isWinner={bWin} played={m.played} showFlags={showFlags} top={false} sweep={sweep} ownerInitials={initials(m.bId)} />
      <div style={{ padding: '4px 8px', borderTop: '1px solid var(--fg-faint)', fontSize: 10.5, color: 'var(--fg-subtle)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{m.played ? (m.pens ? 'Full time (pens)' : 'Full time') : 'Upcoming'}</span>
        <span>{m.date}</span>
      </div>
    </div>
  );
}

function Column({ title, matches, showFlags, H, accent, sweep }: { title: string; matches: Match[]; showFlags: boolean; H: number; accent?: boolean; sweep: SweepData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div className="orah-eyebrow" style={{ color: accent ? 'var(--surface-primary)' : 'var(--grey-500)' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: H, gap: 10 }}>
        {matches.map(m => <MatchCard key={m.id} m={m} showFlags={showFlags} sweep={sweep} />)}
      </div>
    </div>
  );
}

function BracketLegend({ hl }: { hl: Highlights }) {
  const hasAny = hl.championTeamId != null || hl.thirdTeamId != null || hl.underdogTeamId != null;
  if (!hasAny) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--fg-subtle)', marginRight: 4 }}>Highlights:</span>
      {hl.championTeamId != null && <LegendChip label="Champion" bg={MEDAL.gold.bg} color={MEDAL.gold.ink} />}
      {hl.thirdTeamId != null && <LegendChip label="3rd place" bg={MEDAL.bronze.bg} color={MEDAL.bronze.ink} />}
      {hl.underdogTeamId != null && <LegendChip label="Underdog" bg="var(--blue-tint-hover)" color="var(--blue-deep-active)" />}
    </div>
  );
}

export function BracketView({ sweep, showFlags = true }: Props) {
  const k = sweep.knockout;
  const H = 16 * 72;
  const anyPlayed = k.R32.some(m => m.played) || k.R16.some(m => m.played);
  const statusLine = anyPlayed
    ? 'Results updating live as matches complete.'
    : 'Knockout bracket — matches begin after the group stage.';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BracketLegend hl={sweep.highlights} />
        <div style={{ fontSize: 12.5, color: 'var(--fg-subtle)' }}>{statusLine}</div>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 28, minWidth: 'min-content', alignItems: 'flex-start' }}>
          <Column title={PRETTY.R32} matches={k.R32} showFlags={showFlags} H={H} sweep={sweep} />
          <Column title={PRETTY.R16} matches={k.R16} showFlags={showFlags} H={H} accent sweep={sweep} />
          <Column title={PRETTY.QF} matches={k.QF} showFlags={showFlags} H={H} sweep={sweep} />
          <Column title={PRETTY.SF} matches={k.SF} showFlags={showFlags} H={H} sweep={sweep} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: H, gap: 36, flexShrink: 0 }}>
            <div>
              <div className="orah-eyebrow" style={{ textAlign: 'center', marginBottom: 10, color: MEDAL.gold.ink }}>Final</div>
              <MatchCard m={k.FINAL[0]} showFlags={showFlags} sweep={sweep} />
            </div>
            <div>
              <div className="orah-eyebrow" style={{ textAlign: 'center', marginBottom: 10, color: MEDAL.bronze.ink }}>Third-place playoff</div>
              <MatchCard m={k.TP[0]} showFlags={showFlags} sweep={sweep} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
