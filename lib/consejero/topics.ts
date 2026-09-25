import type { IconName } from '@/components/icons'

// What people most often bring to the Doradca: grouped starters for members, and
// example answers (written by us, Uwspółcześniona Biblia Gdańska UBG18) for those who
// don't have it yet.

export interface TopicGroup {
  id: string
  label: string
  icon: IconName
  starters: string[]
}

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    id: 'emociones',
    label: 'Co czuję',
    icon: 'heart',
    starters: ['Dopada mnie silny lęk', 'Jest mi smutno i nie mam na nic siły', 'Boję się tego, co przyniesie przyszłość', 'Czuję się bardzo samotnie'],
  },
  {
    id: 'familia',
    label: 'Rodzina i relacje',
    icon: 'users',
    starters: ['Pokłóciliśmy się w domu', 'Martwię się o moje dzieci', 'Moje małżeństwo przechodzi kryzys', 'Nie potrafię komuś przebaczyć'],
  },
  {
    id: 'fe',
    label: 'Moja wiara',
    icon: 'book',
    starters: ['Czuję, że Bóg jest daleko', 'Nie rozumiem fragmentu Biblii', 'Mam wątpliwości w wierze', 'Chcę nauczyć się lepiej modlić'],
  },
  {
    id: 'trabajo',
    label: 'Praca i pieniądze',
    icon: 'calendar',
    starters: ['Mam długi i nie mogę spać', 'Nie mam już pracy', 'Praca mnie wykańcza', 'Chcę mądrzej gospodarować tym, co mam'],
  },
  {
    id: 'duelo',
    label: 'Strata i żałoba',
    icon: 'feather',
    starters: ['Odszedł ktoś, kogo kocham', 'Lekarz postawił mi trudną diagnozę', 'Skończył się ważny dla mnie związek'],
  },
  {
    id: 'orar',
    label: 'Módlmy się razem',
    icon: 'sparkles',
    starters: ['Pomódl się ze mną za moją rodzinę', 'Chcę podziękować Bogu', 'Modlitwa, żeby spokojnie zasnąć'],
  },
]

export interface PainExample {
  id: string
  label: string
  icon: IconName
  question: string
  answer: string
}

/** Shown to members without Słowa Pana: a taste of a real answer, cut before the end. */
export const PAIN_EXAMPLES: PainExample[] = [
  {
    id: 'ansiedad',
    label: 'Lęk',
    icon: 'heart',
    question: 'Bardzo się denerwuję przez długi i nie mogę spać.',
    answer:
      'Dziękuję, że mi o tym mówisz. Kiedy rachunki się nie domykają, głowa nie odpoczywa, i to bardzo ludzkie tak się czuć. Słowo Boże mówi: «Dlatego nie troszczcie się o dzień jutrzejszy, gdyż dzień jutrzejszy sam się zatroszczy o swoje potrzeby. Dosyć ma dzień swego utrapienia» (Mateusza 6,34). Dziś wieczorem, zanim pójdziesz spać, wypisz na kartce każdy dług i…',
  },
  {
    id: 'tristeza',
    label: 'Smutek',
    icon: 'feather',
    question: 'Od kilku tygodni jest mi smutno i nic mi się nie chce.',
    answer:
      'To, co opisujesz, bardzo ciąży, i nie jest brakiem wiary. Bóg nie oddala się od kogoś, kto tak się czuje: «Bliski jest PAN skruszonym w sercu i wybawia złamanych na duchu» (Psalm 34,18). Gdy smutek trwa tak długo, rozmowa ze specjalistą albo z księdzem czy pastorem to także sposób, w jaki Bóg się o ciebie troszczy. Na dziś proponuję ci bardzo mały krok…',
  },
  {
    id: 'soledad',
    label: 'Samotność',
    icon: 'users',
    question: 'Czuję się samotna, jakby nikogo nie obchodziło, co się ze mną dzieje.',
    answer:
      'To uczucie naprawdę boli i dobrze, że mówisz o nim na głos. Bóg mówi wprost do ciebie: «A sam PAN pójdzie przed tobą, on będzie z tobą, nie porzuci cię ani cię nie opuści. Nie bój się ani się nie lękaj» (Powtórzonego Prawa 31,8). Dziś możesz zrobić jeden krok: pomyśl o osobie, do której…',
  },
  {
    id: 'miedo',
    label: 'Lęk o jutro',
    icon: 'star',
    question: 'Straciłem pracę i boję się tego, co będzie dalej.',
    answer:
      'Utrata pracy wstrząsa wszystkim: finansami, planami, a nawet tym, jak na siebie patrzymy. Twój lęk jest zrozumiały. Posłuchaj tej obietnicy: «Nie bój się, bo ja jestem z tobą. Nie lękaj się, bo ja jestem twoim Bogiem. Umocnię cię, wspomogę cię i podeprę cię prawicą swojej sprawiedliwości» (Izajasza 41,10). Na dziś…',
  },
  {
    id: 'familia',
    label: 'Kłótnie w domu',
    icon: 'home',
    question: 'Pokłóciłam się z synem i nakrzyczałam na niego. Czuję się okropnie.',
    answer:
      'To, że cię to boli, jest dobrym znakiem: zależy ci na synu i chcesz postępować lepiej. Biblia daje prostą wskazówkę: «Łagodna odpowiedź uśmierza zapalczywość, a przykre słowa wzniecają gniew» (Przysłów 15,1). Nie chodzi o to, żeby nigdy nie upaść, tylko żeby wracać. Dziś wieczorem możesz do niego podejść i powiedzieć…',
  },
  {
    id: 'perdon',
    label: 'Przebaczenie',
    icon: 'sparkles',
    question: 'Nie potrafię przebaczyć bratu, zdradził mnie.',
    answer:
      'Zdrada kogoś bliskiego rani głęboko i niełatwo ją puścić. Przebaczyć nie znaczy powiedzieć, że to, co się stało, było w porządku, ani znów narażać się na krzywdę. Jezus uczył tak: «A gdy stoicie, modląc się, przebaczcie, jeśli macie coś przeciwko komuś, aby i wasz Ojciec, który jest w niebie, przebaczył wam wasze przewinienia» (Marka 11,25). Pierwszym krokiem może być…',
  },
  {
    id: 'duelo',
    label: 'Żałoba',
    icon: 'flame',
    question: 'Miesiąc temu zmarła moja mama i nie wiem, jak dalej żyć.',
    answer:
      'Bardzo mi przykro. Miesiąc to tak niewiele, a twoja miłość do niej wciąż trwa, dlatego tak bardzo boli. Sam Jezus powiedział: «Błogosławieni, którzy się smucą, ponieważ oni będą pocieszeni» (Mateusza 5,4). Płacz nie jest brakiem wiary; jest miłością. Nie musisz przechodzić przez to w pojedynkę: twoja wspólnota wiary…',
  },
  {
    id: 'fe',
    label: 'Bóg daleko',
    icon: 'book',
    question: 'Czuję, że Bóg jest daleko, i nie mam już ochoty się modlić.',
    answer:
      'Przeżywa to wielu ludzi, którzy kochają Boga, nawet wielcy mężczyźni i kobiety z Biblii. Dobra wiadomość jest taka, że droga powrotna jest krótka: «Zbliżcie się do Boga, a on zbliży się do was» (Jakuba 4,8). Nie potrzeba długiej ani pięknej modlitwy. Spróbuj dziś tego: jedno szczere zdanie…',
  },
]
