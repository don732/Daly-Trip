export type TeamKey = 'pine' | 'sand'

export type RoundMode = 'indiv' | 'teams'

export type RoundFormat =
  | 'stroke'
  | 'stableford'
  | 'fourball'
  | 'bestball'
  | 'scramble'
  | 'shamble'
  | 'chapman'
  | 'alternate'
  | 'match'
  | 'nassau'

export interface Hole {
  n: number
  par: number
  yds: number
  hcp: number
}

export interface Course {
  name: string
  sub?: string
  location?: string
  par: number
  slope?: number
  rating?: number
  weather?: string
  par9?: number[]
  holes: Hole[]
}

export interface GameStake {
  on: boolean
  amount: number
  per: 'player' | 'team'
  basis: 'hole' | 'round'
  carry: boolean
  counts: 'best' | 'both' | 'best2' | 'all'
}

export interface SideBet {
  on: boolean
  stake: number
  carry?: boolean
}

export interface RoundSides {
  skins: SideBet
  snake: SideBet
  ctp: SideBet
  nassau: SideBet
}

export interface TeamSlot {
  name: string
  color: string
  ids: string[]
}

export interface RoundTeams {
  pine: { ids: string[] }
  sand: { ids: string[] }
}

export interface EngineGame {
  id: string
  type: 'stake' | 'skins' | 'snake' | 'junk' | 'nassau' | 'wolf' | 'press'
  label: string
  stake: number
  carry?: boolean
  meta?: Record<string, unknown>
}

export interface Round {
  id: string
  name: string
  date: string
  tee: string
  course: Course
  mode: RoundMode
  size: 2 | 4 | null
  format: RoundFormat
  gameStake: GameStake
  sides: RoundSides
  teams: RoundTeams
  scores: Record<string, (number | null)[]>
  putts: Record<string, (number | null)[]>
  games: EngineGame[]
}

export interface Player {
  id: string
  name: string
  nick: string
  hcp: number
  team: TeamKey
  avatar?: string
  venmo?: string
  club?: string
  strength?: string
  weakness?: string
  record?: string
  winnings?: number
  badges?: string[]
  rival?: string
  choke?: string
}

export interface FeedPost {
  id: string
  authorId: string
  authorNick: string
  body: string
  ts: number
  reactions: Record<string, string[]>
}

export interface BetEntry {
  id: string
  from: string
  to: string
  amount: number
  note: string
  ts: number
  settled?: boolean
}

export interface TripTeams {
  pine: TeamSlot
  sand: TeamSlot
}

export interface Trip {
  id: string
  code: string
  name: string
  location: string
  start: string
  end: string
  seed: boolean
  paid: boolean
  price: number
  players: Player[]
  teams: TripTeams
  sameTeams: boolean
  rounds: Round[]
  course: Course
  games: EngineGame[]
  scores: Record<string, (number | null)[]>
  putts: Record<string, (number | null)[]>
  feed: FeedPost[]
  bets: BetEntry[]
  activeRoundIndex: number
}

export interface TripFormInput {
  name: string
  location: string
  start: string
  end: string
  players: Array<{ nick: string; hcp: number; team: TeamKey; venmo?: string }>
  paid: boolean
  mode: RoundMode
  gameFormat: RoundFormat
  stake: number
  skins: boolean
  rounds: Array<{ course: string; name?: string }>
}

export interface LeaderRow {
  id: string
  nick: string
  team: TeamKey
  hcp: number
  gross: number
  net: number
  toPar: number
  toParNet: number
  thru: number
}

export interface SkinsState {
  pot: number
  carry: number
  winners: Record<number, string | null>
}

export interface AppState {
  trips: Record<string, Trip>
  activeTripId: string | null
  merit: Array<{ nick: string; points: number; trips: number }>
}

export interface TripBuilderForm {
  name: string
  location: string
  start: string
  end: string
  headcount: number
  players: Array<{ nick: string; hcp: number; team: TeamKey; venmo: string }>
  rounds: Array<{ name: string; courseName: string }>
  mode: RoundMode
  format: RoundFormat
  stake: number
  skinsOn: boolean
  skinsStake: number
}

declare global {
  interface Window {
    __DT_START__?: 'welcome' | 'plan'
  }
}

export {}
