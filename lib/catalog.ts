import type { IconName } from '@/components/icons'
import { WHATSAPP_URL } from './config'
import { COMIENZA_AQUI, GENESIS } from './content/sample'
import { slugify } from './text'

// Every product in the app, in the order the member sees it. A product is a list of
// sections, a section is a list of lessons — the same shape for the chronological
// summary, the audio version and every bonus guide, so progress, checklist, streak
// and reflections work everywhere without special cases.
//
// `offer` is what unlocks a product: 'front' is the main purchase, 'upsell1' the audio
// version, 'upsell2' the Wykonawcy Słowa guide. The bonuses are provisionally on 'front'
// until the owner decides which offer carries each one — change that one field.

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
}

export interface Lesson {
  id: string
  title: string
  format: LessonFormat
  audioSrc?: string
  content?: LessonContent
}

export interface Section {
  id: string
  title: string
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
}

export interface Offer {
  id: OfferId
  title: string
  /** How the offer is named in a short line: "Zawarte w {short}" (locative case). */
  short: string
  pitch: string
  /** Product whose cover represents the offer in the Tienda. */
  productId: string
}

// ─── Content that already exists, keyed by lesson id ───────────────

const SAMPLE_CONTENT: Record<string, LessonContent> = {
  'zacznij-tutaj': COMIENZA_AQUI,
  'ksiega-rodzaju': GENESIS,
}

function lessons(titles: string[], format: LessonFormat): Lesson[] {
  return titles.map((title) => {
    const id = slugify(title)
    return { id, title, format, content: SAMPLE_CONTENT[id] }
  })
}

function numberedDays(count: number, format: LessonFormat): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({ id: `dzien-${i + 1}`, title: `Dzień ${i + 1}`, format }))
}

/** Guides whose inner structure is still to be defined: one entry to open them. */
function pendingGuide(format: LessonFormat = 'texto'): Section[] {
  return [{ id: 'tresc', title: 'Treść', lessons: lessons(['Zacznij tutaj'], format) }]
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
      return { id: `dzien-${day}`, title: `Dzień ${day}`, format: 'texto' as const }
    }),
  }))
}

// ─── Chronological order (as listed in the reference app) ──────────
// Book names as in the Biblia Tysiąclecia.

const INTRO = ['Zacznij tutaj', 'Oś czasu', 'Dlaczego Biblia dzieli się na Stary i Nowy Testament?']

const OLD_TESTAMENT = [
  'Księga Rodzaju', 'Księga Hioba', 'Księga Wyjścia', 'Księga Kapłańska', 'Księga Liczb', 'Księga Powtórzonego Prawa',
  'Księga Jozuego', 'Księga Sędziów', 'Księga Rut', '1 Księga Samuela', '2 Księga Samuela', '1 Księga Kronik',
  'Księga Psalmów', 'Księga Przysłów', 'Księga Koheleta', 'Pieśń nad Pieśniami', '1 Księga Królewska 1-11',
  '2 Księga Kronik 1-9', 'Księga Jonasza', 'Księga Amosa', 'Księga Ozeasza', 'Księga Izajasza', 'Księga Micheasza',
  'Księga Nahuma', 'Księga Sofoniasza', 'Księga Habakuka', 'Księga Jeremiasza', 'Lamentacje', 'Księga Abdiasza',
  'Księga Ezechiela', 'Księga Daniela', 'Księga Ezdrasza', 'Księga Aggeusza', 'Księga Zachariasza', 'Księga Estery',
  'Księga Nehemiasza', 'Księga Malachiasza',
]

const NEW_TESTAMENT = [
  'Ewangelia według św. Łukasza 1-2', 'Ewangelia według św. Mateusza 1-2', 'Ewangelia według św. Marka 1',
  'Ewangelia według św. Jana 1', 'Działalność Jezusa: harmonia Ewangelii', 'Dzieje Apostolskie', 'List św. Jakuba',
  'List do Galatów', '1 List do Tesaloniczan', '2 List do Tesaloniczan', '1 List do Koryntian', '2 List do Koryntian',
  'List do Rzymian', 'List do Efezjan', 'List do Filipian', 'List do Kolosan', 'List do Filemona',
  '1 List do Tymoteusza', 'List do Tytusa', '2 List do Tymoteusza', '1 List św. Piotra', '2 List św. Piotra',
  'List do Hebrajczyków', 'List św. Judy', '1 List św. Jana', '2 List św. Jana', '3 List św. Jana', 'Apokalipsa św. Jana',
]

const COMMANDMENTS = [
  'Nie będziesz miał bogów cudzych', 'Nie będziesz czynił sobie podobizny', 'Nie będziesz brał imienia Pana Boga nadaremno',
  'Pamiętaj o dniu świętym', 'Czcij ojca swego i matkę swoją', 'Nie zabijaj', 'Nie cudzołóż',
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
    description: 'Przejdź przez całą historię biblijną w porządku chronologicznym, od stworzenia świata aż po obietnicę nowego nieba i nowej ziemi. Każde streszczenie zawiera przybliżoną datę, autora, postacie, kluczowy werset oraz jasne i wierne tekstowi wyjaśnienie.',
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
    title: 'Chronologiczne Streszczenie w Audio',
    short: 'Cała historia biblijna opowiedziana po kolei — do słuchania na spacerze, w drodze albo w chwili odpoczynku.',
    description: 'Ta sama historia, w wersji audio. Każda księga czytana w porządku chronologicznym, z regulacją prędkości i zapamiętanym miejscem, abyś mógł kontynuować dokładnie tam, gdzie skończyłeś.',
    kind: 'recorrido',
    offer: 'upsell1',
    cover: { ...AMBER, lines: ['Chronologiczne', 'Streszczenie', 'w'], highlight: 'Audio', icon: 'headphones' },
    sections: [
      { id: 'introduccion', title: 'Wprowadzenie', lessons: lessons(['Zacznij tutaj', 'Dlaczego Biblia dzieli się na Stary i Nowy Testament?'], 'audio') },
      { id: 'antiguo-testamento', title: 'Stary Testament', lessons: lessons(OLD_TESTAMENT, 'audio') },
      { id: 'nuevo-testamento', title: 'Nowy Testament', lessons: lessons(NEW_TESTAMENT, 'audio') },
    ],
  },
  {
    id: 'hacedores',
    title: 'Przewodnik „Wykonawcy Słowa”',
    short: 'Ponad 100 prawdziwych sytuacji z życia i biblijna odpowiedź zastosowana krok po kroku.',
    description: 'To nie jest teoretyczna książka ani kolejne ogólne rozważanie. To praktyczny przewodnik: przy każdej prawdziwej sytuacji z życia — co mówi Biblia i jak to zastosować, krok po kroku.',
    kind: 'recorrido',
    offer: 'upsell2',
    cover: { ...DAWN, lines: ['Przewodnik', 'Wykonawcy'], highlight: 'Słowa', icon: 'feather' },
    sections: pendingGuide(),
  },
  {
    id: 'plan-escucha',
    title: 'Plan Słuchania · 30 dni',
    short: 'Jedno nagranie dziennie przez miesiąc.',
    description: 'Trzydzieści dni, by wytrwale słuchać Słowa — jeden krok każdego dnia.',
    kind: 'guia',
    offer: 'front',
    cover: { ...AMBER, lines: ['Plan', 'Słuchania'], highlight: '30 dni', icon: 'headphones' },
    sections: [{ id: 'dias', title: '30 dni', lessons: numberedDays(30, 'audio') }],
  },
  {
    id: 'plan-transformacion',
    title: '30-dniowy Plan Duchowej Przemiany',
    short: 'Trzydzieści dni, by odnowić twoje życie modlitwy.',
    description: 'Trzydziestodniowa droga, jeden krok dziennie, by odnowić twoją relację z Bogiem.',
    kind: 'guia',
    offer: 'front',
    cover: { ...DUSK, lines: ['Plan', 'Przemiany'], highlight: '30 dni', icon: 'sparkles' },
    sections: [{ id: 'dias', title: '30 dni', lessons: numberedDays(30, 'texto') }],
  },
  {
    id: 'caminando-gigantes',
    title: 'Biblioteka „Wędrując z Olbrzymami”',
    short: 'Wielcy mężczyźni i kobiety wiary.',
    description: 'Biblioteka opowieści o życiu tych, którzy szli z Bogiem przed nami.',
    kind: 'guia',
    offer: 'front',
    cover: { ...OLIVE, lines: ['Wędrując', 'z'], highlight: 'Olbrzymami', icon: 'users' },
    sections: pendingGuide(),
  },
  {
    id: 'mapas-mentales',
    title: 'Mapy Myśli Biblii',
    short: 'Każda księga na jednym obrazie.',
    description: 'Wizualne mapy, dzięki którym zrozumiesz i zapamiętasz każdą księgę jednym spojrzeniem.',
    kind: 'guia',
    offer: 'front',
    cover: { ...DAWN, lines: ['Myśli'], highlight: 'Mapy', icon: 'map' },
    sections: pendingGuide(),
  },
  {
    id: 'biografias',
    title: 'Biografie Apostołów i Postaci Biblijnych',
    short: 'Kim byli i czego uczą nas dzisiaj.',
    description: 'Życie apostołów i najważniejszych postaci Biblii.',
    kind: 'guia',
    offer: 'front',
    cover: { ...WARM, lines: ['Apostołowie', 'i postacie'], highlight: 'Biografie', icon: 'user' },
    sections: pendingGuide(),
  },
  {
    id: 'mandamientos',
    title: '10 Przykazań z Wyjaśnieniem',
    short: 'Każde przykazanie, jego sens i to, jak żyć nim dzisiaj.',
    description: 'Dziesięć Przykazań, jedno po drugim, wyjaśnione w świetle całego Pisma Świętego.',
    kind: 'guia',
    offer: 'front',
    cover: { ...OLIVE, lines: ['Przykazań', 'z wyjaśnieniem'], highlight: '10', icon: 'star' },
    sections: [{ id: 'mandamientos', title: 'Dziesięć Przykazań', lessons: lessons(COMMANDMENTS, 'texto') }],
  },
  {
    id: 'plan-365',
    title: 'Plan Czytania Biblii w 365 dni',
    short: 'Cała Biblia w rok, jeden fragment dziennie.',
    description: 'Przeczytaj całą Biblię w ciągu roku, z codziennym fragmentem, uporządkowanym według miesięcy.',
    kind: 'guia',
    offer: 'front',
    cover: { ...WARM, lines: ['Plan', 'czytania'], highlight: '365', icon: 'calendar' },
    sections: yearPlan(),
  },
  {
    id: 'mujeres-virtuosas',
    title: 'Niewiasty Dzielne w Biblii',
    short: 'Kobiety wiary i to, czego uczy nas ich historia.',
    description: 'Kobiety Biblii, które zapisały się w historii wiary.',
    kind: 'guia',
    offer: 'front',
    cover: { ...ROSE, lines: ['Dzielne', 'w Biblii'], highlight: 'Niewiasty', icon: 'heart' },
    sections: pendingGuide(),
  },
  {
    id: 'milagros-jesus',
    title: '43 Cuda Jezusa',
    short: 'Każdy cud i to, co objawia o Nim.',
    description: 'Cuda Jezusa opisane w Ewangeliach i to, co każdy z nich mówi nam o Nim.',
    kind: 'guia',
    offer: 'front',
    cover: { ...DUSK, lines: ['Cuda', 'Jezusa'], highlight: '43', icon: 'sparkles' },
    sections: pendingGuide(),
  },
  {
    id: 'actividades-ninos',
    title: 'Biblijne Zabawy dla Dzieci',
    short: 'Aby poznawać Biblię całą rodziną.',
    description: 'Zabawy i zadania, dzięki którym najmłodsi poznają historie biblijne przez zabawę.',
    kind: 'guia',
    offer: 'front',
    cover: { ...OLIVE, lines: ['Biblijne', 'zabawy'], highlight: 'Dzieci', icon: 'gift' },
    sections: pendingGuide(),
  },
  {
    id: 'comunidad-whatsapp',
    title: 'Wspólnota na WhatsAppie',
    short: 'Modlitwa i studium razem z braćmi i siostrami.',
    description: 'Dołącz do grupy na WhatsAppie, by modlić się, dzielić i studiować razem z braćmi i siostrami.',
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
    short: 'twoim zakupie',
    pitch: '66 ksiąg w porządku chronologicznym i wszystkie bonusy.',
    productId: 'cronologico',
  },
  {
    id: 'upsell1',
    title: 'Chronologiczne Streszczenie w Audio',
    short: 'pakiecie Audio Premium',
    pitch: 'Słuchaj całej historii biblijnej po kolei — na spacerze, w drodze albo w chwili odpoczynku.',
    productId: 'cronologico-audio',
  },
  {
    id: 'upsell2',
    title: 'Przewodnik „Wykonawcy Słowa”',
    short: 'pakiecie „Wykonawcy Słowa”',
    pitch: 'Ponad 100 prawdziwych sytuacji z życia i biblijna odpowiedź zastosowana krok po kroku.',
    productId: 'hacedores',
  },
]

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function offerById(id: OfferId): Offer {
  return OFFERS.find((o) => o.id === id) ?? OFFERS[0]
}
