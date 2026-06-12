import type { SweepData, Match } from '../types';
import { FlagCrest } from './FlagCrest';

interface Props {
  sweep: SweepData;
  showFlags?: boolean;
}

const ROUND_LABEL: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-final',
  SF: 'Semi-final', TP: '3rd place playoff', FINAL: 'Final',
};

function roundLabel(round: string) {
  return ROUND_LABEL[round] ?? round;
}

function RoundPill({ round }: { round: string }) {
  const isGroup = round.startsWith('Group ');
  return (
    <span style={{
      display: 'inline-block', fontSize: 10.5, fontWeight: 700,
      padding: '2px 7px', borderRadius: 100, whiteSpace: 'nowrap',
      background: isGroup ? 'var(--grey-100)' : 'var(--blue-tint-hover)',
      color: isGroup ? 'var(--grey-600)' : 'var(--blue-deep-active)',
      letterSpacing: '.02em',
    }}>
      {isGroup ? round : roundLabel(round)}
    </span>
  );
}

function MatchRow({ m, sweep, showFlags }: { m: Match; sweep: SweepData; showFlags: boolean }) {
  const teamA = m.aId != null ? sweep.teams[m.aId] : null;
  const teamB = m.bId != null ? sweep.teams[m.bId] : null;
  const ownerA = teamA ? sweep.people[teamA.ownerId] : null;
  const ownerB = teamB ? sweep.people[teamB.ownerId] : null;
  const aWin = m.played && m.winnerId === m.aId;
  const bWin = m.played && m.winnerId === m.bId;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 56px 1fr',
      alignItems: 'center', padding: '9px 14px', gap: 0,
      borderBottom: '1px solid var(--fg-faint)',
    }}>
      {/* Home team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        {showFlags && teamA && <FlagCrest flag={teamA.flag} size={22} />}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: aWin ? 700 : 500,
            color: m.played && !aWin ? 'var(--grey-400)' : 'var(--fg-strong)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {teamA ? teamA.name : (m.aFrom ? `Winner · ${m.aFrom.split('-')[0]}` : 'TBD')}
          </div>
          {ownerA && (
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ownerA.name}
            </div>
          )}
        </div>
      </div>

      {/* Score / vs */}
      <div style={{ textAlign: 'center' }}>
        {m.played ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: aWin ? 'var(--fg-strong)' : 'var(--grey-400)', width: 14, textAlign: 'right' }}>{m.sa}</span>
            <span style={{ fontSize: 11, color: 'var(--grey-300)', fontWeight: 600 }}>–</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: bWin ? 'var(--fg-strong)' : 'var(--grey-400)', width: 14, textAlign: 'left' }}>{m.sb}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-400)' }}>vs</span>
        )}
        {m.played && m.pens && (
          <div style={{ fontSize: 9.5, color: 'var(--grey-400)', marginTop: 1 }}>pens</div>
        )}
      </div>

      {/* Away team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, justifyContent: 'flex-end' }}>
        <div style={{ minWidth: 0, textAlign: 'right' }}>
          <div style={{
            fontSize: 13, fontWeight: bWin ? 700 : 500,
            color: m.played && !bWin ? 'var(--grey-400)' : 'var(--fg-strong)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {teamB ? teamB.name : (m.bFrom ? `Winner · ${m.bFrom.split('-')[0]}` : 'TBD')}
          </div>
          {ownerB && (
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ownerB.name}
            </div>
          )}
        </div>
        {showFlags && teamB && <FlagCrest flag={teamB.flag} size={22} />}
      </div>
    </div>
  );
}

function MatchGroup({ round, matches, sweep, showFlags }: { round: string; matches: Match[]; sweep: SweepData; showFlags: boolean }) {
  const firstDate = matches[0]?.date;
  return (
    <div style={{ background: 'white', border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}>
        <RoundPill round={round} />
        {firstDate && (
          <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{firstDate.split(' · ')[0]}{matches.length > 1 ? ` – ${matches[matches.length - 1].date.split(' · ')[0]}` : ''}</span>
        )}
      </div>
      {matches.map(m => <MatchRow key={m.id} m={m} sweep={sweep} showFlags={showFlags} />)}
    </div>
  );
}

function groupByRound(matches: Match[]): { round: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();
  matches.forEach(m => {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  });
  return Array.from(map.entries()).map(([round, ms]) => ({ round, matches: ms }));
}

export function FixturesView({ sweep, showFlags = true }: Props) {
  const played = sweep.fixtures.filter(m => m.played);
  const upcoming = sweep.fixtures.filter(m => !m.played);

  // Most recent played first — take last 30 then reverse
  const recentGroups = groupByRound([...played].slice(-30).reverse());
  const upcomingGroups = groupByRound(upcoming);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
      <section>
        <div className="orah-h2" style={{ marginBottom: 14 }}>Recent results</div>
        {played.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentGroups.map(({ round, matches }) => (
              <MatchGroup key={round} round={round} matches={matches} sweep={sweep} showFlags={showFlags} />
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>No results yet.</div>
        )}
      </section>
      <section>
        <div className="orah-h2" style={{ marginBottom: 14 }}>Upcoming fixtures</div>
        {upcoming.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingGroups.map(({ round, matches }) => (
              <MatchGroup key={round} round={round} matches={matches} sweep={sweep} showFlags={showFlags} />
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>No upcoming fixtures.</div>
        )}
      </section>
    </div>
  );
}
