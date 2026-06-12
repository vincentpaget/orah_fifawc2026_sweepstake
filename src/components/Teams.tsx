import { useState } from 'react';
import type { SweepData, Team } from '../types';
import { Card, PersonCell, AliveTag, NextGame } from './Shared';
import { FlagCrest } from './FlagCrest';

interface Props {
  sweep: SweepData;
  showFlags?: boolean;
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      height: 30, padding: '0 12px', borderRadius: 6, cursor: 'pointer',
      fontFamily: 'var(--font-open-sans)', fontSize: 13, fontWeight: 600,
      border: '1px solid ' + (active ? 'var(--surface-primary)' : 'var(--grey-300)'),
      background: active ? 'var(--blue-tint-hover)' : 'white',
      color: active ? 'var(--blue-deep-active)' : 'var(--grey-700)',
      display: 'inline-flex', alignItems: 'center',
    }}>
      {label}
    </button>
  );
}

function statusInfo(t: Team) {
  if (t.alive) return { alive: true, label: t.stage };
  if (t.exitRound === 'R32') return { alive: false, label: 'Out · Round of 32' };
  return { alive: false, label: 'Out · Group ' + t.group };
}

export function TeamsView({ sweep, showFlags = true }: Props) {
  const [filter, setFilter] = useState('all');
  const groups = sweep.groups.map(g => g.letter);

  let rows = [...sweep.teams];
  if (filter === 'alive') rows = rows.filter(t => t.alive);
  else if (filter === 'out') rows = rows.filter(t => !t.alive);
  else if (filter.startsWith('g:')) rows = rows.filter(t => t.group === filter.slice(2));
  rows.sort((a, b) => a.group.localeCompare(b.group) || a.groupStats.pos - b.groupStats.pos);

  const aliveN = sweep.teams.filter(t => t.alive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <FilterChip label="All teams" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label={`Alive · ${aliveN}`} active={filter === 'alive'} onClick={() => setFilter('alive')} />
        <FilterChip label={`Out · ${sweep.teams.length - aliveN}`} active={filter === 'out'} onClick={() => setFilter('out')} />
        <span style={{ width: 1, height: 22, background: 'var(--grey-300)', margin: '0 4px' }} />
        {groups.map(L => (
          <FilterChip key={L} label={L} active={filter === 'g:' + L} onClick={() => setFilter('g:' + L)} />
        ))}
      </div>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 64px 1.4fr 150px 1.7fr', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}>
          {['Team', 'Group', 'Owner', 'Status', 'Next game'].map((h, i) => (
            <div key={i} className="orah-eyebrow">{h}</div>
          ))}
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--grey-500)', fontSize: 14 }}>No teams</div>
        )}
        {rows.map((t, idx) => {
          const si = statusInfo(t);
          const owner = sweep.people[t.ownerId];
          return (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '1.5fr 64px 1.4fr 150px 1.7fr', alignItems: 'center',
              padding: '10px 16px', borderBottom: idx < rows.length - 1 ? '1px solid var(--fg-faint)' : 'none',
              background: si.alive ? 'white' : 'var(--grey-50)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, opacity: si.alive ? 1 : 0.7 }}>
                {showFlags && <FlagCrest flag={t.flag} size={26} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>FIFA #{t.rank}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grey-600)' }}>{t.group}</div>
              {owner && <PersonCell person={owner} size={26} />}
              <div><AliveTag alive={si.alive} label={si.alive ? t.stage : (t.exitRound === 'R32' ? 'Round of 32' : 'Group')} /></div>
              <NextGame team={t} sweep={sweep} showFlags={showFlags} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
