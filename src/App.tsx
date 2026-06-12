import { useState, useEffect, useRef } from 'react';
import { useSweepData } from './hooks/useSweepData';
import { GroupsView } from './components/Groups';
import { BracketView } from './components/Bracket';
import { FixturesView } from './components/Fixtures';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, useTweaks, TWEAK_DEFAULTS } from './components/TweaksPanel';

type View = 'groups' | 'fixtures' | 'bracket';

const NAV: { key: View; label: string }[] = [
  { key: 'groups',   label: 'Group Stage' },
  { key: 'fixtures', label: 'Fixtures' },
  { key: 'bracket',  label: 'Bracket' },
];

const TITLES: Record<View, [string, string]> = {
  groups:   ['Group stage',         'Final group standings — and who owns each team'],
  fixtures: ['Fixtures & results',  'Recent results and upcoming matches'],
  bracket:  ['Knockout bracket',    'The road to the final — and who survives'],
};

function GroupsIcon({ active }: { active: boolean }) {
  const c = active ? '#003F7F' : '#434343';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x={4} y={4} width={6} height={6} rx={1} stroke={c} strokeWidth={1.8} />
      <rect x={14} y={4} width={6} height={6} rx={1} stroke={c} strokeWidth={1.8} />
      <rect x={4} y={14} width={6} height={6} rx={1} stroke={c} strokeWidth={1.8} />
      <rect x={14} y={14} width={6} height={6} rx={1} stroke={c} strokeWidth={1.8} />
    </svg>
  );
}

function FixturesIcon({ active }: { active: boolean }) {
  const c = active ? '#003F7F' : '#434343';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x={3} y={4} width={18} height={16} rx={2} stroke={c} strokeWidth={1.8} />
      <path d="M3 9h18" stroke={c} strokeWidth={1.8} />
      <path d="M8 4V6M16 4V6" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M7 13h4M7 16.5h7" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function BracketIcon({ active }: { active: boolean }) {
  const c = active ? '#003F7F' : '#434343';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path d="M4 5h4v4H4M4 15h4v4H4M8 7h4v5h3M8 17h4v-5M15 10h5v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIcon({ kind, active }: { kind: View; active: boolean }) {
  if (kind === 'groups') return <GroupsIcon active={active} />;
  if (kind === 'fixtures') return <FixturesIcon active={active} />;
  return <BracketIcon active={active} />;
}

function TrophyMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" fill="#FFCE5C" />
      <path d="M5 5H3a2.5 2.5 0 0 0 2.6 2.6M19 5h2a2.5 2.5 0 0 1-2.6 2.6" stroke="#FFCE5C" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M11 12.8h2V16h2.2v2.2H8.8V16H11z" fill="#FFCE5C" />
    </svg>
  );
}

function TopBar({ tone, sweep }: { tone: 'navy' | 'blue'; sweep: { meta: { hostLine: string; stageNow: string; today: string } } }) {
  const navy = tone === 'navy';
  return (
    <div style={{
      height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', color: 'white', fontFamily: 'var(--font-open-sans)',
      background: navy ? 'var(--orah-navy)' : 'var(--surface-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <TrophyMark />
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 16, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
            World Cup 2026 Sweepstake
          </div>
        </div>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.18)', margin: '0 6px' }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap' }}>{sweep.meta.hostLine}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,.12)', padding: '5px 12px', borderRadius: 100 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#5FE08A' }} />
          {sweep.meta.stageNow}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap' }}>{sweep.meta.today}</span>
      </div>
    </div>
  );
}

function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <nav style={{ width: 200, flexShrink: 0, background: 'white', boxShadow: 'inset -1px 0 0 0 rgba(0,0,0,0.09)', padding: '14px 10px', display: 'flex', flexDirection: 'column' }}>
      {NAV.map(item => {
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={'nav-btn' + (active ? ' active' : '')}
            style={{
              width: '100%', border: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 12px', borderRadius: 6, marginBottom: 3,
              color: active ? 'var(--blue-deep-active)' : 'var(--grey-700)',
              fontWeight: active ? 600 : 400, fontFamily: 'var(--font-sans)', fontSize: 14, letterSpacing: '.2px',
              transition: 'background var(--duration-fast) var(--ease-standard)',
            }}
          >
            <NavIcon kind={item.key} active={active} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const { sweep, loading, error, usingLiveData } = useSweepData();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem('sweep.view') as View | null;
    return (saved === 'groups' || saved === 'fixtures' || saved === 'bracket') ? saved : 'groups';
  });
  const phaseDefaultSet = useRef(false);
  useEffect(() => {
    if (sweep && !phaseDefaultSet.current && !localStorage.getItem('sweep.view')) {
      phaseDefaultSet.current = true;
      setView(sweep.meta.phase === 'knockout' ? 'bracket' : 'groups');
    }
  }, [sweep]);

  const handleSetView = (v: View) => {
    setView(v);
    localStorage.setItem('sweep.view', v);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-open-sans)', color: 'var(--grey-500)' }}>
        Loading…
      </div>
    );
  }

  if (!sweep) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-open-sans)', color: 'var(--error)' }}>
        Failed to load data: {error}
      </div>
    );
  }

  const [title, sub] = TITLES[view];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--grey-50)' }}>
      <TopBar tone={t.topBar} sweep={sweep} />
      {error && (
        <div style={{ background: '#FFF8E1', borderBottom: '1px solid #FFE082', padding: '8px 20px', fontSize: 13, color: '#7A5800', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-open-sans)' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <strong>Live data unavailable</strong> — showing sample data. {error}
        </div>
      )}
      {!error && usingLiveData && (
        <div style={{ background: '#E8F5E9', borderBottom: '1px solid #C8E6C9', padding: '6px 20px', fontSize: 12, color: '#2E7D32', fontFamily: 'var(--font-open-sans)' }}>
          ● Live data — worldcup26.ir
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar view={view} setView={handleSetView} />
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: view === 'bracket' ? 'none' : 1400, margin: '0 auto', padding: '28px 32px 48px' }}>
            <div style={{ marginBottom: 22 }}>
              <div className="orah-h1">{title}</div>
              <div style={{ fontSize: 14, color: 'var(--fg-subtle)', marginTop: 4 }}>{sub}</div>
            </div>
            {view === 'groups'   && <GroupsView   sweep={sweep} showFlags={t.showFlags} />}
            {view === 'fixtures' && <FixturesView sweep={sweep} showFlags={t.showFlags} />}
            {view === 'bracket'  && <BracketView  sweep={sweep} showFlags={t.showFlags} />}
          </div>
        </main>
      </div>
      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakRadio label="Top bar" value={t.topBar} options={['navy', 'blue']} onChange={v => setTweak('topBar', v as 'navy' | 'blue')} />
        <TweakToggle label="Country flags" value={t.showFlags} onChange={v => setTweak('showFlags', v)} />
      </TweaksPanel>
    </div>
  );
}
