import type { SweepData, Person } from '../types';
import { Card, Eyebrow, PersonCell, FlagStack, AliveTag, TeamChip, SpoonGlyph, MEDAL, ownerColors } from './Shared';
import { FlagCrest } from './FlagCrest';
import { Avatar } from './Avatar';

interface Props {
  sweep: SweepData;
  layout?: 'table' | 'cards';
  showFlags?: boolean;
}

function PrizeCard({ kind, sweep }: { kind: 'first' | 'third' | 'worst'; sweep: SweepData }) {
  const prize = sweep.prizes[kind];
  const M = MEDAL[kind === 'first' ? 'gold' : kind === 'third' ? 'bronze' : 'spoon'];
  const locked = prize.status === 'Locked';
  const focusTeamId = locked ? prize.teamId! : prize.favouriteTeamId!;
  const ft = sweep.teams[focusTeamId];
  const ownerId = locked ? prize.ownerId! : ft.ownerId;
  const owner = sweep.people[ownerId];
  const medalLabel = kind === 'first' ? '1st' : kind === 'third' ? '3rd' : null;
  const [color, tint] = ownerColors(ownerId);

  return (
    <Card pad={0} style={{ overflow: 'hidden', borderColor: M.line }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: M.bg, borderBottom: '1px solid ' + M.line }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: M.solid, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-open-sans)' }}>
            {kind === 'worst' ? <SpoonGlyph size={15} /> : medalLabel}
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: M.ink }}>{prize.title}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{prize.sub}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' as const, color: locked ? 'var(--grey-600)' : M.ink, background: locked ? 'var(--grey-100)' : 'rgba(255,255,255,.6)', padding: '3px 9px', borderRadius: 100, border: '1px solid ' + (locked ? 'var(--grey-300)' : M.line) }}>
          {prize.status}
        </span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <FlagCrest flag={ft.flag} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-strong)' }}>{ft.name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
              {locked ? `FIFA #${ft.rank} · out in Group ${ft.group}` : `Favourite · ${ft.stage}`}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--fg-faint)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow style={{ marginBottom: 4 }}>{locked ? 'Winner' : 'Currently held by'}</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar name={owner.name} size={26} color={color} tint={tint} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)' }}>{owner.name}</span>
            </div>
          </div>
          {locked && (
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--grey-100)', border: '1px solid var(--grey-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SpoonGlyph size={16} color="var(--grey-500)" />
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{prize.note}</div>
      </div>
    </Card>
  );
}

function sortedPeople(sweep: SweepData): Person[] {
  return [...sweep.people].sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.score - a.score || a.name.localeCompare(b.name));
}

function StandingsTable({ sweep, showFlags }: { sweep: SweepData; showFlags: boolean }) {
  const people = sortedPeople(sweep);
  const heads = ['#', 'Player', 'Teams', 'Alive', 'Best run', 'Status'];
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1.2fr 70px 1.1fr 96px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}>
        {heads.map((h, i) => <div key={i} className="orah-eyebrow" style={{ textAlign: i === 3 ? 'center' : 'left' }}>{h}</div>)}
      </div>
      {people.map((p, idx) => {
        const personTeams = p.teamIds.map(id => sweep.teams[id]);
        return (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '44px 1.6fr 1.2fr 70px 1.1fr 96px', alignItems: 'center',
            padding: '9px 16px', borderBottom: idx < people.length - 1 ? '1px solid var(--fg-faint)' : 'none',
            background: idx < 3 && p.alive ? 'rgba(201,162,39,0.05)' : 'white',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: idx < 3 ? '#9A7B1F' : 'var(--grey-500)' }}>{idx + 1}</div>
            <PersonCell person={p} size={30} />
            <FlagStack teams={personTeams} showFlags={showFlags} />
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: p.aliveCount ? 'var(--success)' : 'var(--grey-400)' }}>
              {p.aliveCount}/{p.teamIds.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>{p.alive ? p.bestStage : 'Eliminated'}</div>
            <div><AliveTag alive={p.alive} /></div>
          </div>
        );
      })}
    </Card>
  );
}

function PlayerCards({ sweep, showFlags }: { sweep: SweepData; showFlags: boolean }) {
  const people = sortedPeople(sweep);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {people.map((p, idx) => (
        <Card key={p.id} hover style={{ display: 'flex', flexDirection: 'column', gap: 12, borderColor: idx < 3 && p.alive ? '#E8D08A' : 'var(--grey-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: idx < 3 ? '#9A7B1F' : 'var(--grey-400)', width: 22 }}>#{idx + 1}</span>
              <PersonCell person={p} size={32} />
            </div>
            <AliveTag alive={p.alive} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.teamIds.map(id => {
              const t = sweep.teams[id];
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <TeamChip team={t} size={20} showFlags={showFlags} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.alive ? 'var(--success)' : 'var(--grey-400)', whiteSpace: 'nowrap' }}>
                    {t.alive ? t.stage : (t.exitRound === 'R32' ? 'R32' : 'Group')}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function LeaderboardView({ sweep, layout = 'table', showFlags = true }: Props) {
  const aliveCount = sweep.people.filter(p => p.alive).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <PrizeCard kind="first" sweep={sweep} />
        <PrizeCard kind="third" sweep={sweep} />
        <PrizeCard kind="worst" sweep={sweep} />
      </div>
      <div>
        <div className="orah-h2">Player standings</div>
        <div style={{ fontSize: 13, color: 'var(--fg-subtle)', marginTop: 2 }}>
          {aliveCount} of {sweep.people.length} players still alive for a prize
        </div>
      </div>
      {layout === 'cards'
        ? <PlayerCards sweep={sweep} showFlags={showFlags} />
        : <StandingsTable sweep={sweep} showFlags={showFlags} />
      }
    </div>
  );
}
