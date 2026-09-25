// Demo community shown while the app has no backend. Every name and text here is
// invented — nothing comes from real members of any app. Replaced by the database.

export interface SeedComment {
  author: string
  text: string
  ageMin: number
}

export interface SeedPost {
  id: string
  author: string
  text: string
  ageMin: number
  likes: number
  lessonKey?: string
  comments: SeedComment[]
}

export interface SeedMember {
  name: string
  weekPoints: number
  streak: number
}

export interface SeedReflection {
  author: string
  text: string
  ageMin: number
}

export const SEED_POSTS: SeedPost[] = [
  {
    id: 'seed-1',
    author: 'Katarzyna W.',
    text: 'Skończyłam dziś Księgę Rodzaju. Czytanie w kolejności zmienia wszystko: obietnicę daną Abrahamowi rozumiem teraz zupełnie inaczej.',
    ageMin: 42,
    likes: 12,
    lessonKey: 'cronologico/ksiega-rodzaju',
    comments: [{ author: 'Tomasz K.', text: 'Amen. Ja miałem tak samo z Księgą Wyjścia.', ageMin: 20 }],
  },
  {
    id: 'seed-2',
    author: 'Tomasz K.',
    text: 'To już 9. dzień mojej serii. Słuchanie nagrania w drodze do pracy bardzo mi pomaga.',
    ageMin: 190,
    likes: 8,
    comments: [],
  },
  {
    id: 'seed-3',
    author: 'Magdalena N.',
    text: 'Nie wiedziałam, że Hiob pojawia się tak wcześnie w tej historii. Kogoś jeszcze to zaskoczyło?',
    ageMin: 610,
    likes: 15,
    lessonKey: 'cronologico/ksiega-hioba',
    comments: [
      { author: 'Paweł Z.', text: 'Tak, mnie też. Teraz czytam go inaczej.', ageMin: 540 },
      { author: 'Agnieszka M.', text: 'U mnie było tak samo!', ageMin: 500 },
    ],
  },
  {
    id: 'seed-4',
    author: 'Paweł Z.',
    text: 'Proszę o modlitwę za moją rodzinę. Przechodzimy trudny czas, ale ufamy Panu.',
    ageMin: 1500,
    likes: 23,
    comments: [{ author: 'Barbara S.', text: 'Modlę się za was, bracie.', ageMin: 1400 }],
  },
  {
    id: 'seed-5',
    author: 'Agnieszka M.',
    text: 'Dziś zrozumiałam, że Biblia to nie zbiór luźnych opowieści, ale jedna historia, która prowadzi do Jezusa.',
    ageMin: 2900,
    likes: 21,
    comments: [],
  },
  {
    id: 'seed-6',
    author: 'Joanna P.',
    text: 'Zaczęłam z córką zajęcia dla dzieci. Bardzo jej się spodobały.',
    ageMin: 4300,
    likes: 9,
    comments: [],
  },
]

export const SEED_MEMBERS: SeedMember[] = [
  { name: 'Agnieszka M.', weekPoints: 180, streak: 21 },
  { name: 'Tomasz K.', weekPoints: 150, streak: 9 },
  { name: 'Katarzyna W.', weekPoints: 140, streak: 14 },
  { name: 'Barbara S.', weekPoints: 120, streak: 30 },
  { name: 'Magdalena N.', weekPoints: 95, streak: 5 },
  { name: 'Piotr L.', weekPoints: 80, streak: 12 },
  { name: 'Paweł Z.', weekPoints: 60, streak: 3 },
  { name: 'Joanna P.', weekPoints: 55, streak: 4 },
  { name: 'Krzysztof D.', weekPoints: 40, streak: 2 },
  { name: 'Ewa J.', weekPoints: 30, streak: 6 },
  { name: 'Michał B.', weekPoints: 25, streak: 1 },
  { name: 'Anna G.', weekPoints: 15, streak: 1 },
]

export const SEED_REFLECTIONS: Record<string, SeedReflection[]> = {
  'cronologico/ksiega-rodzaju': [
    { author: 'Barbara S.', text: 'Nigdy wcześniej nie zauważyłam, że obietnica dana Abrahamowi już wskazywała na Jezusa. Czytanie w kolejności bardzo mi pomogło.', ageMin: 180 },
    { author: 'Piotr L.', text: 'Historia Józefa poruszyła mnie dzisiaj. To, co wyglądało na koniec, było częścią Bożego planu.', ageMin: 1300 },
  ],
  'cronologico/zacznij-tutaj': [
    { author: 'Ewa J.', text: 'Poprosiłam Boga o wytrwałość. Chcę przejść tę drogę do końca.', ageMin: 3000 },
  ],
}
