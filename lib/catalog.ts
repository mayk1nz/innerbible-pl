import type { IconName } from '@/components/icons'
import { WHATSAPP_URL } from './config'
import { PLAN_TITLES, type PlanId } from './content/plans/titles'
import { COMIENZA_AQUI, GENESIS } from './content/sample'
import { slugify } from './text'

// Every product in the app, in the order the member sees it. A product is a list of
// sections, a section is a list of lessons — the same shape for the chronological
// summary, the audio version and every bonus guide, so progress, checklist, streak
// and reflections work everywhere without special cases.
//
// `offer` is what unlocks a product: 'front' is the main purchase, 'upsell1' the audio
// version, 'upsell2' the Palabras del Señor guide (formerly "Hacedores de la Palabra",
// id kept) plus the bonuses its sales page lists. The other 9 bonuses come with
// 'front' ("+ 9 regalos especiales") — to move one, change that one field.

export type OfferId = 'front' | 'upsell1' | 'upsell2'
export type ProductKind = 'recorrido' | 'guia' | 'enlace'
export type LessonFormat = 'texto' | 'audio'

export interface LessonContent {
  fecha?: string
  autor?: string
  periodo?: string
  versiculo?: { texto: string; referencia: string }
  resumen?: string[]
  meditar?: string
  /** Plans: the small task of the day. */
  tarea?: string
  /** Plans: concrete steps to put the day's reading into practice. */
  practica?: string[]
}

export interface Lesson {
  id: string
  title: string
  /** Plans: the day's name ("Un corazón dispuesto"), shown next to "Día 1". */
  subtitle?: string
  format: LessonFormat
  audioSrc?: string
  /** Square cover of an audio lesson (public/audio-covers/<lesson>.webp). */
  image?: string
  content?: LessonContent
  /** Plans: the text lives in lib/content/plans and loads only when the day is opened. */
  plan?: { id: PlanId; day: number }
}

export interface Section {
  id: string
  title: string
  /** Label of the section's tab, when the product shows its sections as tabs. */
  tab?: string
  /**
   * A day-by-day plan: one day at a time — the next day opens the day after the
   * previous one was done (see planDayStatus in lib/progress.ts).
   */
  plan?: { goal: string }
  lessons: Lesson[]
}

export interface CoverStyle {
  from: string
  to: string
  glow: string
  lines: string[]
  highlight: string
  icon: IconName
}

export interface Product {
  id: string
  title: string
  short: string
  description: string
  kind: ProductKind
  offer: OfferId
  cover: CoverStyle
  sections: Section[]
  /** Only for kind 'enlace' (e.g. the WhatsApp group). */
  url?: string
  /** Show the sections as tabs (e.g. Palabras del Señor: the guide + its plans). */
  tabs?: boolean
}

export interface Offer {
  id: OfferId
  title: string
  /** How the offer is named in a short line: "Incluido en {short}". */
  short: string
  pitch: string
  /** Product whose cover represents the offer in the Tienda. */
  productId: string
}

// ─── Content that already exists, keyed by lesson id ───────────────

const SAMPLE_CONTENT: Record<string, LessonContent> = {
  'zacznij-tutaj': COMIENZA_AQUI,
  rodzaju: GENESIS,
}

function lessons(titles: string[], format: LessonFormat): Lesson[] {
  return titles.map((title) => {
    const id = slugify(title)
    return { id, title, format, content: SAMPLE_CONTENT[id] }
  })
}

/**
 * Audio lessons play from /api/audio/<product>/<lesson>, which checks the purchase and
 * hands out a short-lived link to the file in Supabase Storage (bucket "audios", file
 * "<product>/<lesson>.mp3"). A file not uploaded yet shows "Audio en preparación".
 */
function audioLessons(productId: string, titles: string[]): Lesson[] {
  return lessons(titles, 'audio').map((l) => ({ ...l, audioSrc: `/api/audio/${productId}/${l.id}`, image: `/audio-covers/${l.id}.webp` }))
}

function numberedDays(count: number, format: LessonFormat): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({ id: `dia-${i + 1}`, title: `Dzień ${i + 1}`, format }))
}

/** Days of a plan inside a product with several plans: ids carry the plan, so they never clash. */
function planDays(planId: PlanId, count: number): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${planId}-dia-${i + 1}`,
    title: `Dzień ${i + 1}`,
    subtitle: PLAN_TITLES[planId][i],
    format: 'texto' as const,
    plan: { id: planId, day: i + 1 },
  }))
}

/** Guides whose inner structure is still to be defined: one entry to open them. */
function pendingGuide(format: LessonFormat = 'texto'): Section[] {
  return [{ id: 'contenido', title: 'Treść', lessons: lessons(['Zacznij tutaj'], format) }]
}

const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function yearPlan(): Section[] {
  let day = 0
  return MONTHS.map((month, i) => ({
    id: slugify(month),
    title: month,
    lessons: Array.from({ length: MONTH_DAYS[i] }, () => {
      day += 1
      return { id: `dia-${day}`, title: `Dzień ${day}`, format: 'texto' as const }
    }),
  }))
}

// ─── Chronological order (as listed in the reference app) ──────────

const INTRO = ['Zacznij tutaj', 'Oś czasu', 'Dlaczego Biblia dzieli się na Stary i Nowy Testament?']

// Book names as in content-src/planes/verify-verses.mjs (the UBG18 reference form),
// except "Psalmy", which reads better as a title than the reference form "Psalm".
const OLD_TESTAMENT = [
  'Rodzaju', 'Hioba', 'Wyjścia', 'Kapłańska', 'Liczb', 'Powtórzonego Prawa', 'Jozuego', 'Sędziów', 'Rut',
  '1 Samuela', '2 Samuela', '1 Kronik', 'Psalmy', 'Przysłów', 'Koheleta', 'Pieśń nad Pieśniami',
  '1 Królewska 1–11', '2 Kronik 1–9', 'Jonasza', 'Amosa', 'Ozeasza', 'Izajasza', 'Micheasza', 'Nahuma', 'Sofoniasza',
  'Habakuka', 'Jeremiasza', 'Lamentacje', 'Abdiasza', 'Ezechiela', 'Daniela', 'Ezdrasza', 'Aggeusza', 'Zachariasza',
  'Estery', 'Nehemiasza', 'Malachiasza',
]

const NEW_TESTAMENT = [
  'Łukasza 1–2', 'Mateusza 1–2', 'Marka 1', 'Jana 1', 'Działalność Jezusa: harmonia Ewangelii',
  'Dzieje Apostolskie', 'Jakuba', 'Galacjan', '1 Tesaloniczan', '2 Tesaloniczan', '1 Koryntian',
  '2 Koryntian', 'Rzymian', 'Efezjan', 'Filipian', 'Kolosan', 'Filemona', '1 Tymoteusza', 'Tytusa',
  '2 Tymoteusza', '1 Piotra', '2 Piotra', 'Hebrajczyków', 'Judy', '1 Jana', '2 Jana', '3 Jana', 'Objawienie',
]

const COMMANDMENTS = [
  'Nie będziesz miał innych bogów', 'Nie czyń sobie rzeźbionego posągu', 'Nie bierz imienia Boga nadaremnie',
  'Pamiętaj, aby dzień święty święcić', 'Czcij ojca swego i matkę swoją', 'Nie zabijaj', 'Nie cudzołóż',
  'Nie kradnij', 'Nie mów fałszywego świadectwa', 'Nie pożądaj',
]

// ─── Cover palettes: dark earthy grounds, one warm glow each ───────

const WARM = { from: '#2b2418', to: '#0c0a07', glow: 'rgba(255, 210, 130, 0.42)' }
const AMBER = { from: '#3b2512', to: '#110a05', glow: 'rgba(255, 176, 90, 0.45)' }
const DAWN = { from: '#22303b', to: '#0a1016', glow: 'rgba(170, 205, 255, 0.35)' }
const OLIVE = { from: '#28291a', to: '#0b0c07', glow: 'rgba(214, 220, 140, 0.32)' }
const ROSE = { from: '#35211f', to: '#100908', glow: 'rgba(255, 170, 150, 0.32)' }
const DUSK = { from: '#2a2233', to: '#0d0a12', glow: 'rgba(210, 180, 255, 0.30)' }

export const PRODUCTS: Product[] = [
  {
    id: 'cronologico',
    title: 'Chronologiczne Streszczenie Biblii',
    short: '66 ksiąg w kolejności, w jakiej działy się wydarzenia — przejrzyście i prosto.',
    description: 'Przejdź przez całą historię biblijną w porządku chronologicznym, od stworzenia aż po obietnicę nowego nieba i nowej ziemi. Każde streszczenie podaje przybliżoną datę, autora, postacie, kluczowy werset oraz jasne i wierne tekstowi wyjaśnienie.',
    kind: 'recorrido',
    offer: 'front',
    cover: { ...WARM, lines: ['Chronologiczne', 'Streszczenie'], highlight: 'Biblii', icon: 'book' },
    sections: [
      { id: 'introduccion', title: 'Wprowadzenie', lessons: lessons(INTRO, 'texto') },
      { id: 'antiguo-testamento', title: 'Stary Testament', lessons: lessons(['Spis ksiąg Starego Testamentu', ...OLD_TESTAMENT], 'texto') },
      { id: 'nuevo-testamento', title: 'Nowy Testament', lessons: lessons(['Spis ksiąg Nowego Testamentu', ...NEW_TESTAMENT], 'texto') },
    ],
  },
  {
    id: 'cronologico-audio',
    title: 'Chronologiczne Streszczenie Biblii w audio',
    short: 'Cała historia biblijna opowiedziana po kolei — do słuchania na spacerze, w drodze albo w chwili odpoczynku.',
    description: 'Ta sama historia w wersji audio. Każda księga opowiedziana w porządku chronologicznym, z regulowaną prędkością. Aplikacja pamięta, gdzie skończyło się słuchanie, więc zawsze wracasz dokładnie do tego miejsca.',
    kind: 'recorrido',
    offer: 'upsell1',
    cover: { ...AMBER, lines: ['Chronologiczne', 'Streszczenie', 'w wersji'], highlight: 'Audio', icon: 'headphones' },
    sections: [
      { id: 'introduccion', title: 'Wprowadzenie', lessons: audioLessons('cronologico-audio', ['Zacznij tutaj', 'Dlaczego Biblia dzieli się na Stary i Nowy Testament?']) },
      { id: 'antiguo-testamento', title: 'Stary Testament', lessons: audioLessons('cronologico-audio', OLD_TESTAMENT) },
      { id: 'nuevo-testamento', title: 'Nowy Testament', lessons: audioLessons('cronologico-audio', NEW_TESTAMENT) },
      { id: 'conclusion', title: 'Zakończenie', lessons: audioLessons('cronologico-audio', ['Zakończenie: od Księgi Rodzaju do Objawienia']) },
    ],
  },
  {
    id: 'hacedores',
    title: 'Słowa Pana',
    short: 'Praktyczny przewodnik i trzy 90-dniowe plany, by żyć Słowem dzień po dniu.',
    description: 'To nie jest teoretyczna książka ani kolejne ogólne rozważania. To praktyczny przewodnik: przy każdej prawdziwej sytuacji życiowej pokazuje, co mówi Biblia i jak zastosować to krok po kroku. Do tego trzy 90-dniowe plany — z czytaniem, mini-zadaniem i praktycznymi krokami na każdy dzień.',
    kind: 'recorrido',
    offer: 'upsell2',
    cover: { ...DAWN, lines: ['Słowa'], highlight: 'Pana', icon: 'feather' },
    tabs: true,
    sections: [
      { id: 'guia', title: 'Przewodnik „Słowa Pana”', tab: 'Przewodnik', lessons: lessons(['Jak korzystać z tego przewodnika'], 'texto') },
      {
        id: 'transformacion',
        title: '90-dniowy plan Duchowej Przemiany',
        tab: 'Przemiana',
        plan: { goal: 'Odnów swoją relację z Bogiem — każdego dnia jeden krok.' },
        lessons: planDays('transformacion', 90),
      },
      {
        id: 'vivir-como-jesus',
        title: '90-dniowy plan: jak żyć według nauki Jezusa',
        tab: 'Żyć jak Jezus',
        plan: { goal: 'Wnoś Jego nauczanie w swoją codzienność, krok po kroku.' },
        lessons: planDays('vivir-como-jesus', 90),
      },
      {
        id: 'nueva-mentalidad',
        title: '90-dniowy plan: zmień sposób myślenia i stań się prawdziwym chrześcijaninem',
        tab: 'Nowe myślenie',
        plan: { goal: 'Odnów swój sposób myślenia w świetle Słowa.' },
        lessons: planDays('nueva-mentalidad', 90),
      },
    ],
  },
  {
    id: 'plan-escucha',
    title: 'Plan słuchania · 30 dni',
    short: 'Jedno nagranie dziennie przez miesiąc.',
    description: 'Trzydzieści dni, by wytrwale słuchać Słowa — każdego dnia jeden krok.',
    kind: 'guia',
    offer: 'front',
    cover: { ...AMBER, lines: ['Plan', 'słuchania'], highlight: '30 dni', icon: 'headphones' },
    sections: [{ id: 'dias', title: '30 dni', lessons: numberedDays(30, 'audio').map((l) => ({ ...l, audioSrc: `/api/audio/plan-escucha/${l.id}` })) }],
  },
  {
    id: 'caminando-gigantes',
    title: 'Biblioteka „Kroczyć z olbrzymami”',
    short: 'Wielcy mężczyźni i kobiety wiary.',
    description: 'Biblioteka życiorysów tych, którzy kroczyli z Bogiem przed nami.',
    kind: 'guia',
    offer: 'upsell2',
    cover: { ...OLIVE, lines: ['Kroczyć', 'z'], highlight: 'Olbrzymami', icon: 'users' },
    sections: pendingGuide(),
  },
  {
    id: 'mapas-mentales',
    title: 'Biblijne mapy myśli',
    short: 'Każda księga na jednym obrazie.',
    description: 'Wizualne mapy, dzięki którym zrozumiesz i zapamiętasz każdą księgę jednym spojrzeniem.',
    kind: 'guia',
    offer: 'front',
    cover: { ...DAWN, lines: ['Mapy'], highlight: 'Myśli', icon: 'map' },
    sections: pendingGuide(),
  },
  {
    id: 'biografias',
    title: 'Biografie apostołów i postaci biblijnych',
    short: 'Kim byli i czego uczą nas dziś.',
    description: 'Życie apostołów i kluczowych postaci Biblii.',
    kind: 'guia',
    offer: 'front',
    cover: { ...WARM, lines: ['Apostołowie', 'i postacie'], highlight: 'Biografie', icon: 'user' },
    sections: pendingGuide(),
  },
  {
    id: 'mandamientos',
    title: '10 przykazań z objaśnieniem',
    short: 'Każde przykazanie: jego sens i jak żyć nim dziś.',
    description: 'Dziesięć przykazań, jedno po drugim, objaśnione w świetle całego Pisma.',
    kind: 'guia',
    offer: 'front',
    cover: { ...OLIVE, lines: ['Przykazań', 'z objaśnieniem'], highlight: '10', icon: 'star' },
    sections: [{ id: 'mandamientos', title: 'Dziesięć przykazań', lessons: lessons(COMMANDMENTS, 'texto') }],
  },
  {
    id: 'plan-365',
    title: 'Plan czytania Biblii w 365 dni',
    short: 'Cała Biblia w rok, jeden fragment dziennie.',
    description: 'Przeczytaj całą Biblię w ciągu roku — codziennie jeden fragment, ułożony według miesięcy.',
    kind: 'guia',
    offer: 'front',
    cover: { ...WARM, lines: ['Plan', 'czytania'], highlight: '365', icon: 'calendar' },
    sections: yearPlan(),
  },
  {
    id: 'mujeres-virtuosas',
    title: 'Cnotliwe kobiety Biblii',
    short: 'Kobiety wiary i to, czego uczy nas ich historia.',
    description: 'Kobiety Biblii, które zapisały się w historii wiary.',
    kind: 'guia',
    offer: 'front',
    cover: { ...ROSE, lines: ['Cnotliwe'], highlight: 'Kobiety', icon: 'heart' },
    sections: pendingGuide(),
  },
  {
    id: 'milagros-jesus',
    title: '43 cuda Jezusa',
    short: 'Każdy cud i to, co objawia o Nim.',
    description: 'Cuda Jezusa opisane w Ewangeliach i to, co każdy z nich mówi nam o Nim.',
    kind: 'guia',
    offer: 'front',
    cover: { ...DUSK, lines: ['Cuda', 'Jezusa'], highlight: '43', icon: 'sparkles' },
    sections: pendingGuide(),
  },
  {
    id: 'actividades-ninos',
    title: 'Biblijne zajęcia dla dzieci',
    short: 'Do wspólnego poznawania Biblii w rodzinie.',
    description: 'Zajęcia, dzięki którym najmłodsi poznają biblijne historie przez zabawę.',
    kind: 'guia',
    offer: 'front',
    cover: { ...OLIVE, lines: ['Biblijne', 'zajęcia dla'], highlight: 'Dzieci', icon: 'gift' },
    sections: pendingGuide(),
  },
  {
    id: 'comunidad-whatsapp',
    title: 'Wspólnota na WhatsAppie',
    short: 'Modlitwa i studium razem z braćmi i siostrami.',
    description: 'Dołącz do grupy na WhatsAppie, by modlić się, dzielić i studiować Słowo razem z braćmi i siostrami.',
    kind: 'enlace',
    offer: 'front',
    cover: { ...DAWN, lines: ['na WhatsAppie'], highlight: 'Wspólnota', icon: 'message' },
    sections: [],
    url: WHATSAPP_URL,
  },
]

export const OFFERS: Offer[] = [
  {
    id: 'front',
    title: 'Chronologiczne Streszczenie Biblii',
    short: 'twój zakup',
    pitch: '66 ksiąg w porządku chronologicznym i 9 prezentów.',
    productId: 'cronologico',
  },
  {
    id: 'upsell1',
    title: 'Chronologiczne Streszczenie Biblii w audio',
    short: 'Audio Premium',
    pitch: 'Słuchaj całej historii biblijnej po kolei — na spacerze, w drodze albo w chwili odpoczynku.',
    productId: 'cronologico-audio',
  },
  {
    id: 'upsell2',
    title: 'Słowa Pana',
    short: 'Słowa Pana',
    pitch: 'Twój Doradca Biblijny do codziennej rozmowy, trzy 90-dniowe plany i praktyczny przewodnik, by żyć Słowem.',
    productId: 'hacedores',
  },
]

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function offerById(id: OfferId): Offer {
  return OFFERS.find((o) => o.id === id) ?? OFFERS[0]
}
