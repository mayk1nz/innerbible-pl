import type { IconName } from '@/components/icons'

// The owner's quiz, question for question, with its illustrations (public/funil/assets),
// in Polish.
//
// Images: a question `image` shows above the title. Options with images render as a
// two-column grid of picture cards, or — with `thumbs` — as a list with a small
// picture on the left (for small illustrations such as the scroll and the book).

const A = (file: string) => `/funil/assets/${file}`

export interface ProfileQuestion {
  kind: 'profile'
  id: string
  eyebrow?: string
  title: string
  hint?: string
  multi?: boolean
  image?: string
  /** Option images as small thumbnails in a list, instead of a picture grid. */
  thumbs?: boolean
  options: { label: string; icon?: IconName; image?: string }[]
}

export interface TestQuestion {
  kind: 'test'
  id: string
  title: string
  image?: string
  options: string[]
  /** One per option, same order. Omit for text-only options. */
  optionImages?: string[]
  correct: number
}

export const INTRO = {
  title: 'Jak dobrze znasz Słowo Boże?',
  text: 'Rozwiąż ten krótki test i sprawdź, jaki jest twój poziom znajomości Pisma Świętego.',
  gift: 'Na końcu otrzymasz trzy prezenty!',
  image: A('5932855a6aea.jpg'),
  button: 'Rozpocznij test',
}

export const TEST_INTRO = {
  title: 'A teraz sprawdźmy twoją znajomość Słowa Bożego!',
  text: 'Odpowiedz na poniższe pytania.',
  image: A('427bcc431455.jpg'),
  button: 'Zaczynamy',
}

export const ANALYSIS_IMAGE = A('9663a02b6178.jpg')

export const PROFILE: ProfileQuestion[] = [
  {
    kind: 'profile',
    id: 'conexion',
    eyebrow: 'Najpierw chcemy dowiedzieć się o tobie trochę więcej.',
    title: 'W jaki sposób najczęściej spotykasz się ze Słowem Bożym?',
    options: [
      { label: 'Lektury, filmy lub kazania', image: A('0ba2f5618e0f.jpg') },
      { label: 'Czytając Biblię / rozważania', image: A('ab8f47db12c3.jpg') },
      { label: 'Nabożeństwa i spotkania', image: A('e3c8133b3c68.jpg') },
      { label: 'Nie udaje mi się nawiązać więzi z Bogiem', image: A('0d1f6e8b4e4c.jpg') },
    ],
  },
  {
    kind: 'profile',
    id: 'dificultad',
    title: 'Którą część Biblii trudno ci zrozumieć?',
    image: A('da5eeb04f639.jpg'),
    thumbs: true,
    options: [
      { label: 'Stary Testament', image: A('ad0185192c2b.png') },
      { label: 'Nowy Testament', image: A('392de206fdde.png') },
    ],
  },
  {
    kind: 'profile',
    id: 'sentimiento',
    title: 'Jak się czujesz, gdy próbujesz zrozumieć Biblię w całości?',
    options: [
      { label: 'Próbowałem/am już wiele razy i się poddałem/am', image: A('86967420bc64.jpg') },
      { label: 'Próbuję, ale w ogóle mi nie wychodzi', image: A('dfbf4286b0d4.jpg') },
      { label: 'Czasem się gubię, ale ją rozumiem', image: A('98219e64b88d.jpg') },
      { label: 'Spokojnie, ale czuję, że mogę się rozwinąć', image: A('a25afd282159.jpg') },
    ],
  },
  {
    kind: 'profile',
    id: 'freno',
    title: 'Jakie jest twoje największe wyzwanie, gdy próbujesz czytać Biblię?',
    hint: 'Możesz zaznaczyć więcej niż jedną odpowiedź',
    image: A('1f42a824330b.jpg'),
    multi: true,
    options: [
      { label: 'Nie wiem, od czego zacząć' },
      { label: 'Trudno mi zrozumieć tekst' },
      { label: 'Brak planu i organizacji' },
      { label: 'Mam wrażenie, że czytanie zajmuje za dużo czasu' },
      { label: 'Brakuje mi materiału, który pomógłby w czytaniu' },
    ],
  },
  {
    kind: 'profile',
    id: 'completa',
    title: 'Czy udało ci się przeczytać całą Biblię?',
    image: A('c419e8e9d0c6.jpg'),
    options: [
      { label: 'Tak, udało mi się', icon: 'check' },
      { label: 'Nie, jeszcze nie', icon: 'x' },
    ],
  },
  {
    kind: 'profile',
    id: 'genero',
    title: 'Jesteś:',
    options: [
      { label: 'Chrześcijaninem', image: A('660ce8f8a425.jpg') },
      { label: 'Chrześcijanką', image: A('dca1f1f0ae30.jpg') },
    ],
  },
  {
    kind: 'profile',
    id: 'edad',
    title: 'Ile masz lat?',
    options: [
      { label: '18–34', image: A('1624ba59a944.jpg') },
      { label: '35–44', image: A('9d1ca84b491d.jpg') },
      { label: '45–54', image: A('b835e63aadc4.jpg') },
      { label: '55+', image: A('125dddb9bd91.jpg') },
    ],
  },
]

export const TEST: TestQuestion[] = [
  {
    kind: 'test',
    id: 't1',
    title: 'Kto pokonał olbrzyma za pomocą procy i kamienia?',
    options: ['Jozue', 'Mojżesz', 'Dawid', 'Samson'],
    optionImages: [A('098950509c58.webp'), A('0e261719ce9c.webp'), A('bbf14f60abf9.webp'), A('7dcd52bc8aed.webp')],
    correct: 2,
  },
  {
    kind: 'test',
    id: 't2',
    title: 'Która scena przedstawia Maryję, Józefa i Dzieciątko w żłobie?',
    image: A('2c6873e4b0f1.jpg'),
    options: ['Przemienienie Pańskie', 'Boże Narodzenie', 'Zwiastowanie', 'Ostatnia Wieczerza'],
    correct: 1,
  },
  {
    kind: 'test',
    id: 't3',
    title: 'Którą bitwę wygrało 300 mężczyzn z trąbami i pochodniami?',
    options: ['Bunt Absaloma', 'Zdobycie Jerycha', 'Podbój Kanaanu', 'Bitwa z Madianitami'],
    optionImages: [A('50ccc33bce10.webp'), A('b55f79d6c2c8.jpg'), A('a39a0b61be97.jpg'), A('1af3b904dc36.jpg')],
    correct: 3,
  },
  {
    kind: 'test',
    id: 't4',
    title: 'Które wydarzenie przedstawia mury miasta walące się po siedmiu dniach okrążania?',
    image: A('dc99fc4f82be.jpg'),
    options: ['Założenie Jerozolimy', 'Zagłada Sodomy', 'Upadek Babilonu', 'Zdobycie Jerycha'],
    correct: 3,
  },
  {
    kind: 'test',
    id: 't5',
    title: 'Jaką obietnicę Boga symbolizuje tęcza na niebie?',
    image: A('1ddd10d66bab.jpg'),
    options: ['Wyjście z Egiptu', 'Stworzenie świata', 'Przyjście Jezusa', 'Przymierze z Noem'],
    correct: 3,
  },
  {
    kind: 'test',
    id: 't6',
    title: 'Który prorok został wzięty do nieba na ognistym rydwanie?',
    options: ['Eliasz', 'Ezechiel', 'Jeremiasz', 'Izajasz'],
    optionImages: [A('dba0b06b71b5.webp'), A('874ee62f147e.webp'), A('a1b858db99d5.webp'), A('7ded05a5e1ba.webp')],
    correct: 0,
  },
  {
    kind: 'test',
    id: 't7',
    title: 'Który prorok miał widzenie doliny wyschłych kości, które ożyły?',
    options: ['Ozeasz', 'Ezechiel', 'Daniel', 'Izajasz'],
    optionImages: [A('c085d547d210.webp'), A('874ee62f147e.webp'), A('e2e9061b85b9.webp'), A('7ded05a5e1ba.webp')],
    correct: 1,
  },
  {
    kind: 'test',
    id: 't8',
    title: 'Który król spalił zwój z proroctwem Jeremiasza?',
    options: ['Jozjasz', 'Manasses', 'Sedecjasz', 'Jojakim'],
    optionImages: [A('5296c8a9b95f.webp'), A('6ad8082f2a1e.webp'), A('e6d9e81400fb.webp'), A('419521e1f991.webp')],
    correct: 3,
  },
  {
    kind: 'test',
    id: 't9',
    title: 'Kogo znamy z wielobarwnej szaty i z wyjaśnienia snów faraona?',
    image: A('5c790905fc1d.jpg'),
    options: ['Józef', 'Elizeusz', 'Mojżesz', 'Daniel'],
    correct: 0,
  },
  {
    kind: 'test',
    id: 't10',
    title: 'Jaką śmierć poniósł pierwszy chrześcijański męczennik opisany w Dziejach Apostolskich?',
    options: ['Ścięcie Jana Chrzciciela', 'Ukamienowanie Szczepana', 'Śmierć Jakuba', 'Śmierć Piotra'],
    optionImages: [A('3a8c11fab85f.jpg'), A('277ab8c877ff.jpg'), A('1fc30b6ec0a3.jpg'), A('8026eff08f78.jpg')],
    correct: 1,
  },
]

export const RESULT = {
  eyebrow: 'Wyniki twojego biblijnego testu',
  image: A('91c1c80705ec.jpg'),
  productImage: A('c014d152c355.webp'),
  high: [
    'Gratulacje, jesteś na dobrej drodze!',
    'Widać, że sporo wiesz o Biblii, ale zawsze można odkryć coś nowego.',
    'Wchodząc nieco głębiej, możesz zyskać jeszcze więcej jasności i zrozumienia.',
  ],
  low: [
    'Każde pytanie to okazja, by się czegoś nauczyć.',
    'Świat Biblii jest ogromny i złożony, dlatego trudno zapamiętać wszystkie szczegóły.',
    'Idąc właściwą drogą, możesz zyskać o wiele więcej jasności i zrozumienia.',
  ],
  goodNews: 'Dobra wiadomość?',
  pitch: [
    'Zrozumienie Biblii nie musi być trudne.',
    'Prawdziwa przemiana przychodzi wtedy, gdy przyjmujesz Boże nauczanie z prostotą i uważnością.',
    'A ja odkryłam najprostszy sposób, by to zrobić.',
  ],
  product: 'To Chronologiczne Streszczenie Biblii',
  button: 'Kliknij i zobacz, jak je otrzymać',
}

export const OFFER = {
  title: 'Obejrzyj poniższe wideo i odkryj sekret zrozumienia Biblii.',
  headline: 'Odbierz teraz!',
  product: 'Chronologiczne Streszczenie',
  extra: '+ 9 wyjątkowych prezentów',
  button: 'Kliknij tutaj i zdobądź swój materiał',
  bullets: ['Natychmiastowy dostęp', '30 dni gwarancji'],
  perMonth: '/mies.',
}

/**
 * Payment info under the button. The front is a MONTHLY subscription, so this must
 * never say "jednorazowa płatność" / "bez miesięcznych opłat" (the owner's old image said so).
 */
export const PAYMENT_NOTE = {
  badge: 'Natychmiastowy dostęp!',
  plan: 'Subskrypcja miesięczna',
  calm: 'Bez obaw!',
  convert:
    'Kwota zostanie automatycznie przeliczona na walutę twojego kraju po kliknięciu przycisku „Kliknij tutaj i zdobądź swój materiał”. Możesz też zapłacić lokalnymi metodami płatności dostępnymi w twoim kraju.',
}
