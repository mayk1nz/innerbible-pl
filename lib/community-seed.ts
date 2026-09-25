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
    author: 'Agnieszka Wróbel',
    text: 'Skończyłam dziś Księgę Rodzaju. Czytanie w porządku chronologicznym zmienia wszystko: obietnicę daną Abrahamowi rozumiem teraz zupełnie inaczej.',
    ageMin: 42,
    likes: 12,
    lessonKey: 'cronologico/rodzaju',
    comments: [{ author: 'Tomasz Nowicki', text: 'Amen. U mnie było tak samo z Księgą Wyjścia.', ageMin: 20 }],
  },
  {
    id: 'seed-2',
    author: 'Tomasz Nowicki',
    text: 'To już 9. dzień mojej serii. Słuchanie nagrań w drodze do pracy bardzo mi pomaga.',
    ageMin: 190,
    likes: 8,
    comments: [],
  },
  {
    id: 'seed-3',
    author: 'Magdalena Kowalczyk',
    text: 'Nie wiedziałam, że Księga Hioba jest umieszczona tak wcześnie w historii. Kogoś jeszcze to zaskoczyło?',
    ageMin: 610,
    likes: 15,
    lessonKey: 'cronologico/hioba',
    comments: [
      { author: 'Piotr Zieliński', text: 'Mnie też. Teraz czytam ją zupełnie inaczej.', ageMin: 540 },
      { author: 'Katarzyna Lewandowska', text: 'Miałam dokładnie tak samo!', ageMin: 500 },
    ],
  },
  {
    id: 'seed-4',
    author: 'Piotr Zieliński',
    text: 'Proszę o modlitwę za moją rodzinę. Przechodzimy trudny czas, ale ufamy Panu.',
    ageMin: 1500,
    likes: 23,
    comments: [{ author: 'Joanna Mazur', text: 'Modlę się za was, bracie.', ageMin: 1400 }],
  },
  {
    id: 'seed-5',
    author: 'Katarzyna Lewandowska',
    text: 'Dziś zrozumiałam, że Biblia to nie zbiór luźnych opowieści, ale jedna historia, która prowadzi do Jezusa.',
    ageMin: 2900,
    likes: 21,
    comments: [],
  },
  {
    id: 'seed-6',
    author: 'Ewa Dąbrowska',
    text: 'Zaczęłam z córką biblijne zajęcia dla dzieci. Jest zachwycona.',
    ageMin: 4300,
    likes: 9,
    comments: [],
  },
]

export const SEED_MEMBERS: SeedMember[] = [
  { name: 'Katarzyna Lewandowska', weekPoints: 180, streak: 21 },
  { name: 'Tomasz Nowicki', weekPoints: 150, streak: 9 },
  { name: 'Agnieszka Wróbel', weekPoints: 140, streak: 14 },
  { name: 'Joanna Mazur', weekPoints: 120, streak: 30 },
  { name: 'Magdalena Kowalczyk', weekPoints: 95, streak: 5 },
  { name: 'Andrzej Wiśniewski', weekPoints: 80, streak: 12 },
  { name: 'Piotr Zieliński', weekPoints: 60, streak: 3 },
  { name: 'Ewa Dąbrowska', weekPoints: 55, streak: 4 },
  { name: 'Marek Kamiński', weekPoints: 40, streak: 2 },
  { name: 'Monika Szymańska', weekPoints: 30, streak: 6 },
  { name: 'Paweł Jankowski', weekPoints: 25, streak: 1 },
  { name: 'Barbara Wojciechowska', weekPoints: 15, streak: 1 },
]

export const SEED_REFLECTIONS: Record<string, SeedReflection[]> = {
  'cronologico/rodzaju': [
    { author: 'Joanna Mazur', text: 'Nigdy wcześniej nie zauważyłam, że obietnica dana Abrahamowi już wskazywała na Jezusa. Czytanie po kolei bardzo mi pomogło.', ageMin: 180 },
    { author: 'Andrzej Wiśniewski', text: 'Historia Józefa poruszyła mnie dzisiaj. To, co wyglądało na koniec, było częścią Bożego planu.', ageMin: 1300 },
  ],
  'cronologico/zacznij-tutaj': [
    { author: 'Monika Szymańska', text: 'Poprosiłam Boga o wytrwałość. Chcę przejść tę drogę do końca.', ageMin: 3000 },
  ],
}