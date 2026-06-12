import type { SweepData, Team } from '../types';
import { FlagCrest } from './FlagCrest';
import { Avatar, } from './Avatar';
import { ownerColors } from './Shared';

interface Props {
  sweep: SweepData;
  showFlags?: boolean;
}

function PosBadge({ pos, advanced }: { pos: number; advanced: boolean }) {
  let bg = 'var(--grey-200)', col = 'var(--grey-600)';
  if (pos <= 2) { bg = 'var(--success-bg)'; col = 'var(--success)'; }
  else if (pos === 3) {
    if (advanced) { bg = 'var(--success-bg)'; col = 'var(--success)'; }
    else { bg = 'var(--warning-bg)'; col = 'var(--warning)'; }
  }
  return (
    <span style={{ width: 22, height: 22, borderRadius: 6, background: bg, color: col, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {pos}
    </span>
  );
}

const COLS = '26px minmax(0,1fr) 30px 40px 34px';

function GroupCard({ g, sweep, showFlags }: { g: { letter: string; teamIds: number[] }; sweep: SweepData; showFlags: boolean }) {
  const ids = g.teamIds;
  const groupComplete = ids.some(id => sweep.teams[id].groupStats.p > 0);
  const advanced = (t: Team) => t.exitRound !== 'Group';
  const lastAdv = ids.map(id => advanced(sweep.teams[id])).lastIndexOf(true);

  const rows: React.ReactNode[] = [];
  ids.forEach((id, idx) => {
    const t = sweep.teams[id];
    const s = t.groupStats;
    const owner = sweep.people[t.ownerId];
    const pos = idx + 1;
    const adv = advanced(t);
    const [color, tint] = ownerColors(t.ownerId);

    rows.push(
      <div key={id} style={{
        display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
        padding: '9px 14px', gap: 0,
        borderBottom: idx < ids.length - 1 && idx !== lastAdv ? '1px solid var(--fg-faint)' : 'none',
        background: adv ? 'white' : 'var(--grey-50)',
        opacity: groupComplete && !adv ? 0.72 : 1,
      }}>
        <PosBadge pos={pos} advanced={adv} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, paddingLeft: 6, overflow: 'hidden' }}>
          {showFlags && <FlagCrest flag={t.flag} size={22} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
            {t.name}
          </span>
          <span style={{ width: 1, height: 11, background: 'var(--grey-300)', flexShrink: 0, marginLeft: 1, marginRight: 1 }} />
          <Avatar name={owner.name} size={14} color={color} tint={tint} />
          <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 2 }}>{owner.name}</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>{s.p}</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>{s.gd > 0 ? '+' + s.gd : s.gd}</div>
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--fg-strong)' }}>{s.pts}</div>
      </div>
    );

    // Qualification cut line after last advanced team
    if (idx === lastAdv && idx < ids.length - 1) {
      rows.push(<div key="cut" style={{ borderTop: '2px solid var(--success)' }} />);
    }
  });

  return (
    <div style={{ background: 'white', border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--grey-200)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-strong)' }}>Group {g.letter}</div>
        <div className="orah-eyebrow">{groupComplete ? 'Final standings' : 'Standings'}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '6px 14px', borderBottom: '1px solid var(--fg-faint)', background: 'var(--grey-50)' }}>
        {['', 'Team', 'Pld', 'GD', 'Pts'].map((h, i) => (
          <div key={i} className="orah-eyebrow" style={{ textAlign: i >= 2 ? 'center' : 'left', fontSize: 10 }}>{h}</div>
        ))}
      </div>
      {rows}
    </div>
  );
}

export function GroupsView({ sweep, showFlags = true }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--fg-subtle)' }}>
        <span>Top 2 of each group advance, plus the 8 best third-placed teams.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 2, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
          Qualification line
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--warning-bg)', boxShadow: 'inset 0 0 0 1px var(--warning)', flexShrink: 0 }} />
          3rd · may be eliminated
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {sweep.groups.map(g => <GroupCard key={g.letter} g={g} sweep={sweep} showFlags={showFlags} />)}
      </div>
    </div>
  );
}
