import type {Player} from './game.ts';
import {clubId, commonClubs} from './game.ts';

// C1 is immutable: shared fg2 links pin these selections and their rules.
export const CLUBS = {
  milan: {name: 'Milan', club: 'Milan', motto: 'La tua memoria rossonera.', mark: 'ACM',
    ids: [7,8,9,10,13,17,20,21,23,25,27,34,37,59,70,80,82,100,104,118,126,140,141,156,166,170,181,187,188,189,191,192,195,202,203,205,211,214,216,218,220,221,242,267,272,276,282,312,319,357,362,363,386,417,436,439,443,446,464,481,483,485]},
  inter: {name: 'Inter', club: 'Inter', motto: 'La tua memoria nerazzurra.', mark: 'INT',
    ids: [7,14,17,20,22,25,34,53,70,78,79,81,82,88,93,100,101,106,108,113,117,124,125,139,169,174,182,187,191,192,212,213,217,219,222,223,226,227,232,233,245,321,360,368,382,385,404,428,436,437,448,452,458,484,488,489,498,499]},
  juventus: {name: 'Juventus', club: 'Juventus', motto: 'La tua memoria bianconera.', mark: 'JUV',
    ids: [3,17,19,20,22,24,25,26,28,33,34,35,52,79,82,102,104,105,111,123,156,169,172,175,179,180,183,188,190,196,197,198,207,208,209,212,216,221,223,224,225,230,233,239,240,244,246,248,252,258,260,263,282,333,343,385,436,451,454,481]},
  napoli: {name: 'Napoli', club: 'Napoli', motto: 'La tua memoria azzurra.', mark: 'NAP',
    ids: [22,73,77,86,92,103,104,126,199,228,234,300,312,458,459]},
} as const;
export type ClubMode = keyof typeof CLUBS;
export type Mode = 'world' | ClubMode;
export function isClub(value: string): value is ClubMode { return Object.hasOwn(CLUBS, value); }
export function modeOf(theme: string): Mode { return isClub(theme) ? theme : 'world'; }
export function clubPlayers(players: Player[], mode: ClubMode) {
  const ids: readonly number[] = CLUBS[mode].ids;
  return players.filter(player => ids.includes(player.id));
}
export function clueClubs(a: Player, b: Player, theme: string) {
  return commonClubs(a, b).filter(club => !isClub(theme) || clubId(club) !== clubId(CLUBS[theme].club));
}
export function clueClubHint(a: Player, b: Player, theme: string) {
  return !a.clubs.length || !b.clubs.length ? 'unknown' : clueClubs(a, b, theme).length ? 'match' : 'miss';
}
