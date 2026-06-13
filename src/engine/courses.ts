import type { Course, Hole, Player, TeamKey } from '@/types/trip'
import { uid } from '@/styles'

export const BLACK_CYPRESS: Course = {
  name: 'Black Cypress National',
  sub: 'The Coastal Course',
  location: 'Kiawah Sound, SC',
  par: 72,
  slope: 148,
  rating: 75.6,
  weather: '74° · Breezy · 12mph SW',
  par9: [4, 4, 3, 5, 4, 4, 3, 5, 4],
  holes: [
    { n: 1, par: 4, yds: 410, hcp: 7 },
    { n: 2, par: 4, yds: 445, hcp: 3 },
    { n: 3, par: 3, yds: 175, hcp: 17 },
    { n: 4, par: 5, yds: 540, hcp: 11 },
    { n: 5, par: 4, yds: 400, hcp: 9 },
    { n: 6, par: 4, yds: 460, hcp: 1 },
    { n: 7, par: 3, yds: 195, hcp: 15 },
    { n: 8, par: 5, yds: 565, hcp: 5 },
    { n: 9, par: 4, yds: 420, hcp: 13 },
    { n: 10, par: 4, yds: 415, hcp: 8 },
    { n: 11, par: 4, yds: 450, hcp: 2 },
    { n: 12, par: 3, yds: 165, hcp: 18 },
    { n: 13, par: 5, yds: 555, hcp: 10 },
    { n: 14, par: 4, yds: 405, hcp: 12 },
    { n: 15, par: 4, yds: 470, hcp: 4 },
    { n: 16, par: 3, yds: 205, hcp: 16 },
    { n: 17, par: 5, yds: 575, hcp: 6 },
    { n: 18, par: 4, yds: 435, hcp: 14 }
  ]
}

export function blankCourse(name = 'New Course'): Course {
  const holes: Hole[] = Array.from({ length: 18 }, (_, i) => ({
    n: i + 1,
    par: i % 5 === 2 ? 3 : i % 5 === 4 ? 5 : 4,
    yds: 400,
    hcp: i + 1
  }))
  return { name, par: holes.reduce((s, h) => s + h.par, 0), holes }
}

export function makeCourse(name: string, sub?: string): Course {
  return { ...BLACK_CYPRESS, name, sub: sub || BLACK_CYPRESS.sub }
}

export function makePlayer(input: Partial<Player> & { nick: string; hcp: number; team: TeamKey }): Player {
  return {
    id: input.id || uid('p'),
    name: input.name || input.nick,
    nick: input.nick,
    hcp: input.hcp,
    team: input.team,
    avatar: input.avatar,
    venmo: input.venmo,
    club: input.club,
    strength: input.strength,
    weakness: input.weakness,
    record: input.record,
    winnings: input.winnings,
    badges: input.badges,
    rival: input.rival,
    choke: input.choke
  }
}

export const COURSE_DB: Course[] = [
  BLACK_CYPRESS,
  makeCourse('Harbour Town Golf Links', 'RBC Heritage'),
  makeCourse('Pinehurst No. 2', 'Sandhills'),
  makeCourse('Bandon Dunes', 'Pacific Dunes'),
  makeCourse('Pebble Beach Golf Links', 'Monterey Peninsula')
]

export function searchCourses(q: string): Course[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return COURSE_DB
  return COURSE_DB.filter(c => `${c.name} ${c.sub || ''} ${c.location || ''}`.toLowerCase().includes(needle))
}
