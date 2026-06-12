export type FlagKind = 'v' | 'v2' | 'h' | 'h2' | 'solid' | 'cross' | 'disc' | 'canton' | 'diag';

export interface Flag {
  kind: FlagKind;
  colors: string[];
}

export interface GroupStats {
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  pos: number;
}

export interface NextGame {
  opponentId: number;
  round: string;
  date: string;
}

export type ExitRound = 'Group' | 'R32' | 'R16' | 'QF' | 'SF' | null;

export interface Team {
  id: number;
  name: string;
  code: string;
  rank: number;
  flag: Flag;
  group: string;
  groupStats: GroupStats;
  alive: boolean;
  exitRound: ExitRound;
  stage: string;
  ownerId: number;
  nextGame: NextGame | null;
}

export interface Person {
  id: number;
  name: string;
  teamIds: number[];
  alive: boolean;
  aliveCount: number;
  bestStage: string;
  score: number;
}

export interface Group {
  letter: string;
  teamIds: number[];
}

export interface Match {
  id: string;
  round: string;
  aId: number | null;
  bId: number | null;
  aFrom?: string;
  bFrom?: string;
  sa: number | null;
  sb: number | null;
  winnerId: number | null;
  played: boolean;
  pens?: string | null;
  date: string;
  label?: string;
}

export interface Knockout {
  R32: Match[];
  R16: Match[];
  QF: Match[];
  SF: Match[];
  TP: Match[];
  FINAL: Match[];
}

export interface PrizeRace {
  title: string;
  sub: string;
  status: 'Open' | 'Locked';
  note: string;
  favouriteTeamId?: number;
  teamId?: number;
  ownerId?: number;
}

export interface Prizes {
  first: PrizeRace;
  third: PrizeRace;
  worst: PrizeRace;
}

export interface SweepMeta {
  name: string;
  today: string;
  hostLine: string;
  stageNow: string;
  potText: string;
  payoutText: string;
  phase: 'group' | 'knockout';
}

export interface Highlights {
  underdogTeamId: number | null;
  championTeamId: number | null;
  thirdTeamId: number | null;
}

export interface SweepData {
  meta: SweepMeta;
  teams: Team[];
  people: Person[];
  groups: Group[];
  knockout: Knockout;
  fixtures: Match[];
  prizes: Prizes;
  highlights: Highlights;
}

export interface Participant {
  id: number;
  name: string;
  teams: string[];
}
