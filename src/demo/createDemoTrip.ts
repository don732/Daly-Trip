import { BLACK_CYPRESS, makePlayer } from '@/engine/courses'
import { makeTripFromForm } from '@/engine/tripFactory'
import type { TeamKey, Trip } from '@/types/trip'
import { DEMO_TRIP_ID } from '@/demo/constants'

const DEMO_ROSTER: Array<{
  id: string
  nick: string
  name: string
  hcp: number
  team: TeamKey
  venmo?: string
  club?: string
  strength?: string
  weakness?: string
  record?: string
  winnings?: number
  badges?: string[]
  rival?: string
  choke?: string
}> = [
  {
    id: 'demo_mort',
    nick: 'The Mortician',
    name: 'Dev Patel',
    hcp: 4,
    team: 'pine',
    venmo: '@dev-patel',
    club: 'Oakridge CC',
    strength: 'Ice-cold under pressure',
    weakness: 'Driver goes sideways when smiling',
    record: '18–6',
    winnings: 1240,
    badges: ['💀 Closer', '🏆 2x Champ'],
    rival: 'The Bank',
    choke: 'Triple on 18 to lose the Nassau'
  },
  {
    id: 'demo_bank',
    nick: 'The Bank',
    name: 'Marcus Cole',
    hcp: 8,
    team: 'sand',
    venmo: '@marcus-cole',
    club: 'Harbour Town',
    strength: 'Never misses a four-footer',
    weakness: 'Talks too much on the tee',
    record: '14–10',
    winnings: 890,
    rival: 'The Mortician'
  },
  {
    id: 'demo_tony',
    nick: 'Two-Card Tony',
    name: 'Tony Reyes',
    hcp: 19,
    team: 'pine',
    venmo: '@two-card',
    club: 'Muni Kings',
    strength: 'Clutch scrambler',
    weakness: 'Keeps two scorecards',
    record: '9–15',
    winnings: 210
  },
  {
    id: 'demo_sand',
    nick: 'Dr. Sandbag',
    name: 'Elliot Grant',
    hcp: 22,
    team: 'sand',
    venmo: '@dr-sandbag',
    club: 'Bandon Regulars',
    strength: 'Miraculous recovery shots',
    weakness: 'Handicap under review since 2019',
    record: '11–13',
    winnings: 640
  },
  {
    id: 'demo_wedge',
    nick: 'Wedge Wizard',
    name: 'Sam Ortiz',
    hcp: 12,
    team: 'pine',
    venmo: '@wedge-wiz',
    club: 'Pine Valley Alumni'
  },
  {
    id: 'demo_grip',
    nick: 'Grip It & Rip It',
    name: 'Jake Morrison',
    hcp: 15,
    team: 'sand',
    venmo: '@grip-rip'
  },
  {
    id: 'demo_putt',
    nick: 'The Putter Whisperer',
    name: 'Chris Lane',
    hcp: 10,
    team: 'pine',
    venmo: '@putter-whisper'
  },
  {
    id: 'demo_hawk',
    nick: 'Hawkeye',
    name: 'Ryan Brooks',
    hcp: 6,
    team: 'sand',
    venmo: '@hawkeye-golf'
  }
]

function demoScores(playerIndex: number, thru: number): (number | null)[] {
  const pars = BLACK_CYPRESS.holes.map(h => h.par)
  return Array.from({ length: 18 }, (_, hole) => {
    if (hole >= thru) return null
    const base = pars[hole]
    const spread = (playerIndex + hole) % 5
    if (spread === 0) return base - 1
    if (spread === 4) return base + 2
    if (spread === 3) return base + 1
    return base
  })
}

export function createDemoTrip(): Trip {
  const players = DEMO_ROSTER.map(p =>
    makePlayer({
      id: p.id,
      nick: p.nick,
      name: p.name,
      hcp: p.hcp,
      team: p.team,
      venmo: p.venmo,
      club: p.club,
      strength: p.strength,
      weakness: p.weakness,
      record: p.record,
      winnings: p.winnings,
      badges: p.badges,
      rival: p.rival,
      choke: p.choke
    })
  )

  const thru = 12
  const base = makeTripFromForm({
    name: "Boys' Weekend · Kiawah",
    location: 'Kiawah Sound, SC',
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    players: players.map(p => ({ nick: p.nick, hcp: p.hcp, team: p.team, venmo: p.venmo })),
    paid: true,
    mode: 'indiv',
    gameFormat: 'stroke',
    stake: 5,
    skins: true,
    skinsStake: 5,
    rounds: [{ course: BLACK_CYPRESS.name, name: 'Round 1' }]
  })

  const scores = Object.fromEntries(players.map((p, i) => [p.id, demoScores(i, thru)]))
  const rounds = base.rounds.map((r, i) => (i === 0 ? { ...r, scores, course: { ...BLACK_CYPRESS } } : r))

  const demoPlayers = players.map(p => {
    const fromForm = base.players.find(fp => fp.nick === p.nick)
    return fromForm ? { ...fromForm, ...p, id: p.id } : p
  })

  const pineIds = demoPlayers.filter(p => p.team === 'pine').map(p => p.id)
  const sandIds = demoPlayers.filter(p => p.team === 'sand').map(p => p.id)

  return {
    ...base,
    id: DEMO_TRIP_ID,
    code: 'DEMO26',
    seed: true,
    paid: true,
    name: "Boys' Weekend · Kiawah",
    location: 'Kiawah Sound, SC',
    course: BLACK_CYPRESS,
    players: demoPlayers,
    teams: {
      pine: { name: 'Pine', color: '#2A6B4A', ids: pineIds },
      sand: { name: 'Sand', color: '#C4A882', ids: sandIds }
    },
    scores,
    rounds,
    feed: [
      {
        id: 'demo_feed_1',
        authorId: 'demo_mort',
        authorNick: 'The Mortician',
        body: 'Cards are out. Wagers are live. Nobody mention the 18th last year.',
        ts: Date.now() - 3600000,
        reactions: { '🔥': ['demo_bank', 'demo_tony'] }
      },
      {
        id: 'demo_feed_2',
        authorId: 'demo_sand',
        authorNick: 'Dr. Sandbag',
        body: 'Net lead is a social construct. Gross is the only truth.',
        ts: Date.now() - 1800000,
        reactions: { '😂': ['demo_wedge', 'demo_grip', 'demo_putt'] }
      },
      {
        id: 'demo_feed_3',
        authorId: 'demo_hawk',
        authorNick: 'Hawkeye',
        body: 'Birdie on 6. The Mortician smiled. Weather alert: cold front incoming.',
        ts: Date.now() - 600000,
        reactions: { '⛳': ['demo_mort'] }
      }
    ]
  }
}
