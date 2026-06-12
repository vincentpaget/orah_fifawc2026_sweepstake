import type { CSSProperties, ReactNode } from 'react';
import type { SweepData, Team, Person } from '../types';
import { Avatar } from './Avatar';
import { FlagCrest } from './FlagCrest';

const OWNER_TINTS: [string, string][] = [
  ['#0073E6', '#BBDEFB'], ['#5B7FE0', '#D7E0F7'], ['#2E7D32', '#C8E6C9'],
  ['#8255B1', '#E2D5F0'], ['#0097A7', '#B2EBF2'], ['#5C6BC0', '#D6DAF5'],
];
export function ownerColors(id: number): [string, string] {
  return OWNER_TINTS[id % OWNER_TINTS.length];
}

export const MEDAL = {
  gold:   { ink: '#9A7B1F', bg: '#FBF3DA', line: '#E8D08A', solid: '#C9A227' },
  bronze: { ink: '#8A5A33', bg: '#F6EADF', line: '#E0C2A4', solid: '#B07B4F' },
  spoon:  { ink: 'var(--grey-700)', bg: 'var(--grey-100)', line: 'var(--grey-300)', solid: 'var(--grey-500)' },
};

// ---- PersonCell ----
interface PersonCellProps {
  person: Person;
  size?: number;
  bold?: boolean;
  sub?: string | null;
}
export function PersonCell({ person, size = 28, bold = true, sub = null }: PersonCellProps) {
  const [color, tint] = ownerColors(person.id);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
      <Avatar name={person.name} size={size} color={color} tint={tint} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: bold ? 600 : 400, color: 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.name}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ---- TeamChip ----
interface TeamChipProps {
  team: Team;
  size?: number;
  showName?: boolean;
  dim?: boolean;
  showFlags?: boolean;
}
export function TeamChip({ team, size = 22, showName = true, dim = false, showFlags = true }: TeamChipProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: dim ? 0.5 : 1 }}>
      {showFlags && <FlagCrest flag={team.flag} size={size} />}
      {showName
        ? <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</span>
        : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-subtle)', letterSpacing: '.02em' }}>{team.code}</span>
      }
    </div>
  );
}

// ---- FlagStack ----
interface FlagStackProps {
  teams: Team[];
  size?: number;
  max?: number;
  showFlags?: boolean;
}
export function FlagStack({ teams, size = 22, max = 4, showFlags = true }: FlagStackProps) {
  const shown = teams.slice(0, max);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((t, i) => (
        <span key={t.id} style={{ marginLeft: i ? -6 : 0, zIndex: max - i, opacity: t.alive ? 1 : 0.4, filter: t.alive ? 'none' : 'grayscale(0.6)' }}>
          {showFlags
            ? <FlagCrest flag={t.flag} size={size} />
            : <span style={{ display: 'inline-flex', width: size, height: size, borderRadius: '50%', background: 'var(--grey-200)', fontSize: 9, fontWeight: 700, color: 'var(--grey-600)', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }}>{t.code}</span>
          }
        </span>
      ))}
      {teams.length > max && <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--fg-subtle)' }}>+{teams.length - max}</span>}
    </div>
  );
}

// ---- AliveTag ----
interface AliveTagProps {
  alive: boolean;
  label?: string;
}
export function AliveTag({ alive, label }: AliveTagProps) {
  const txt = label ?? (alive ? 'Alive' : 'Out');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 600, lineHeight: '16px',
      background: alive ? 'var(--success-bg)' : 'var(--grey-100)',
      color: alive ? 'var(--success)' : 'var(--grey-600)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: alive ? 'var(--success)' : 'var(--grey-400)' }} />
      {txt}
    </span>
  );
}

// ---- Card ----
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  hover?: boolean;
}
export function Card({ children, style, pad = 16, hover = false }: CardProps) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--grey-200)', borderRadius: 10,
      padding: pad, boxShadow: hover ? 'var(--shadow-card-hover)' : 'none', ...style,
    }}>
      {children}
    </div>
  );
}

// ---- Eyebrow ----
interface EyebrowProps { children: ReactNode; style?: CSSProperties; }
export function Eyebrow({ children, style }: EyebrowProps) {
  return <div className="orah-eyebrow" style={style}>{children}</div>;
}

// ---- NextGame ----
interface NextGameProps {
  team: Team;
  sweep: SweepData;
  showFlags?: boolean;
}
export function NextGame({ team, sweep, showFlags = true }: NextGameProps) {
  if (!team.alive || !team.nextGame) {
    return <span style={{ fontSize: 13, color: 'var(--grey-400)' }}>—</span>;
  }
  const opp = sweep.teams[team.nextGame.opponentId];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>vs</span>
      {showFlags && <FlagCrest flag={opp.flag} size={18} />}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-strong)' }}>{opp.name}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-subtle)', whiteSpace: 'nowrap' }}>· {team.nextGame.date}</span>
    </div>
  );
}

// ---- SpoonGlyph ----
export function SpoonGlyph({ color = 'white', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx={12} cy={6.5} rx={4} ry={5} fill={color} />
      <rect x={10.8} y={10} width={2.4} height={11} rx={1.2} fill={color} />
    </svg>
  );
}
