import type { Trip } from '@/types/trip'
import { makePlayer } from '@/engine/courses'
import { makeRound, switchActiveRound } from '@/engine/tripFactory'
import { uid } from '@/styles'

export const DEMO_TRIP_ID = 'seed-demo-boys26'
export const DEMO_TRIP_CODE = 'BOYS26'

const demoScoresR1: Record<string, number[]> = {
  mort: [4, 5, 3, 5, 4, 5, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  bank: [5, 4, 4, 6, 5, 4, 4, 6, 5, 5, 5, 4, 6, 5, 5, 4, 6, 5],
  tony: [5, 5, 4, 6, 5, 5, 4, 6, 5, 5, 5, 4, 6, 5, 5, 4, 6, 5],
  sand: [5, 4, 4, 5, 5, 5, 4, 5, 5, 5, 4, 4, 5, 5, 5, 4, 5, 5],
  chip: [6, 5, 4, 6, 5, 5, 4, 6, 5, 5, 5, 4, 6, 5, 5, 4, 6, 5],
  hawk: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  fade: [5, 5, 4, 6, 5, 5, 4, 6, 5, 5, 5, 4, 6, 5, 5, 4, 6, 5],
  putt: [5, 4, 4, 5, 5, 5, 4, 5, 5, 5, 4, 4, 5, 5, 5, 4, 5, 5]
}

export function createDemoTrip(): Trip {
  const players = [
    makePlayer({ id: 'mort', name: 'Dev Patel', nick: 'The Mortician', team: 'pine', hcp: 4, venmo: '@dev-patel', club: 'Oakridge CC', strength: 'Ice-cold under pressure', weakness: 'Driver goes sideways when smiling', record: '18–6', winnings: 1240, badges: ['💀 Closer', '🏆 2x Champ'], rival: 'The Bank', choke: 'Triple on 18 to force a playoff' }),
    makePlayer({ id: 'bank', name: 'Marcus Cole', nick: 'The Bank', team: 'sand', hcp: 8, venmo: '@marcus-cole', club: 'Merion GC', strength: 'Never misses a putt inside 6 feet', weakness: 'Talks too much on the tee', record: '14–10', winnings: 890, rival: 'The Mortician' }),
    makePlayer({ id: 'tony', name: 'Tony Russo', nick: 'Two-Card Tony', team: 'pine', hcp: 19, venmo: '@tony-r', club: 'Public Links', strength: 'Clutch scrambler', weakness: 'Handicap is a suggestion', record: '9–15', rival: 'Dr. Sandbag' }),
    makePlayer({ id: 'sand', name: 'Alan Wright', nick: 'Dr. Sandbag', team: 'sand', hcp: 12, venmo: '@alan-w', club: 'Country Club', strength: 'Course management', weakness: 'Questionable math on net scores', record: '11–13' }),
    makePlayer({ id: 'chip', name: 'Chris Bell', nick: 'The Chip Artist', team: 'pine', hcp: 15, venmo: '@chris-b', club: 'Muni King', strength: 'Short game wizard', weakness: 'Fairway optional' }),
    makePlayer({ id: 'hawk', name: 'Jordan Lee', nick: 'Hawk Eye', team: 'sand', hcp: 6, venmo: '@jordan-l', club: 'Pine Valley', strength: 'Pure ball striker', weakness: 'Gets bored on par 5s' }),
    makePlayer({ id: 'fade', name: 'Mike Torres', nick: 'Power Fade', team: 'pine', hcp: 11, venmo: '@mike-t', club: 'Desert Dunes', strength: 'Bombs it 300+', weakness: 'Left rough is home' }),
    makePlayer({ id: 'putt', name: 'Sam Nguyen', nick: 'Silk Touch', team: 'sand', hcp: 14, venmo: '@sam-n', club: 'Bay Hill', strength: 'Lag putts die in the hole', weakness: 'Yips on 3-footers' })
  ]
  const teamIds = {
    pine: players.filter(p => p.team === 'pine').map(p => p.id),
    sand: players.filter(p => p.team === 'sand').map(p => p.id)
  }
  const playerIds = players.map(p => p.id)
  const round1 = makeRound({
    name: 'Round 1',
    courseName: 'Black Cypress National',
    mode: 'teams',
    format: 'bestball',
    playerIds,
    stake: 5,
    skins: true,
    skinsStake: 5,
    teamIds
  })
  const round2 = makeRound({
    name: 'Round 2',
    courseName: 'Harbour Town Golf Links',
    mode: 'teams',
    format: 'stroke',
    playerIds,
    stake: 10,
    skins: true,
    skinsStake: 5,
    teamIds
  })
  round1.scores = Object.fromEntries(
    playerIds.map(id => [id, demoScoresR1[id]?.map(v => v as number | null) || Array(18).fill(null)])
  )
  round1.putts = Object.fromEntries(playerIds.map(id => [id, Array(18).fill(2)]))
  const trip: Trip = {
    id: DEMO_TRIP_ID,
    code: DEMO_TRIP_CODE,
    name: 'Boys Trip 2026',
    location: 'Kiawah Sound, SC',
    start: '2026-03-12',
    end: '2026-03-15',
    seed: true,
    paid: true,
    price: 5,
    players,
    teams: {
      pine: { name: 'Pine', color: '#2A6B4A', ids: teamIds.pine },
      sand: { name: 'Sand', color: '#C4A882', ids: teamIds.sand }
    },
    sameTeams: true,
    rounds: [round1, round2],
    course: round1.course,
    games: round1.games,
    scores: round1.scores,
    putts: round1.putts,
    feed: [
      { id: uid('feed'), authorId: 'mort', authorNick: 'The Mortician', body: 'Mortician checked in. Course is ready. Bring cash.', ts: Date.now() - 86400000, reactions: { '🔥': ['bank', 'hawk'] } },
      { id: uid('feed'), authorId: 'bank', authorNick: 'The Bank', body: 'Skins pot looking healthy after 9. Dr. Sandbag still calculating his net.', ts: Date.now() - 43200000, reactions: { '😂': ['tony', 'sand', 'chip'] } }
    ],
    bets: [],
    activeRoundIndex: 0
  }
  return switchActiveRound(trip, 0)
}

export const DEFAULT_MERIT = [
  { nick: 'The Mortician', points: 142, trips: 4 },
  { nick: 'The Bank', points: 128, trips: 4 },
  { nick: 'Hawk Eye', points: 115, trips: 3 },
  { nick: 'Dr. Sandbag', points: 98, trips: 4 },
  { nick: 'Two-Card Tony', points: 76, trips: 3 }
]
