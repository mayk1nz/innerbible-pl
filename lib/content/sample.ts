import type { LessonContent } from '../catalog'

// Sample content so the reader can be judged with real text in it. The final copy
// comes from the owner; replacing these two objects is all it takes.
// Lesson ids (from the Polish titles): COMIENZA_AQUI → 'zacznij-tutaj', GENESIS → 'ksiega-rodzaju'.

export const COMIENZA_AQUI: LessonContent = {
  resumen: [
    'Witaj. Ta ścieżka poprowadzi cię przez całą historię biblijną w takiej kolejności, w jakiej się wydarzyła — od słów „Na początku” aż po obietnicę nowego nieba i nowej ziemi.',
    'Każde streszczenie ma zawsze ten sam układ, żeby łatwo było się w nim odnaleźć: przybliżony czas wydarzeń, autora, któremu tradycja przypisuje księgę, okres i najważniejsze postacie, kluczowy werset oraz jasne streszczenie wierne tekstowi.',
    'Każda lektura zajmuje tylko kilka minut. Gdy skończysz, oznacz ją jako przeczytaną: zobaczysz swoje postępy, podtrzymasz serię i zawsze będziesz wiedzieć, gdzie kontynuować.',
    'Pragniemy, aby na końcu tej drogi Biblia stała się dla ciebie jedną historią: Bożym planem ocalenia ludzkości przez Jezusa Chrystusa.',
  ],
  meditar: 'Zanim zaczniesz, powiedz Bogu własnymi słowami, czego pragniesz odnaleźć na tej ścieżce.',
}

export const GENESIS: LessonContent = {
  fecha: 'Od stworzenia świata do śmierci Józefa (ok. 1805 r. przed Chr.)',
  autor: 'Tradycyjnie przypisywana Mojżeszowi',
  periodo: 'Początki i patriarchowie: Adam i Ewa, Noe, Abraham, Izaak, Jakub i Józef',
  versiculo: { texto: 'Na początku Bóg stworzył niebo i ziemię.', referencia: 'Rdz 1,1' },
  resumen: [
    'Księga Rodzaju to księga początków. Bóg stwarza wszechświat swoim słowem i czyni człowieka na swój obraz, aby żył z Nim w jedności.',
    'Nieposłuszeństwo Adama i Ewy zrywa tę jedność, a grzech rozszerza się wśród ludzi aż do potopu. Mimo to Bóg zachowuje Noego i jego rodzinę i odnawia swoje przymierze ze stworzeniem.',
    'Następnie Bóg powołuje Abrahama i obiecuje mu potomstwo, ziemię i błogosławieństwo dla wszystkich rodów ziemi. Ta obietnica przechodzi na Izaaka i na Jakuba, któremu Bóg nadaje imię Izrael.',
    'Księga kończy się historią Józefa w Egipcie: sprzedany przez braci, wywyższony przez Boga, staje się narzędziem ocalenia swojej rodziny przed głodem. To, co inni zamierzyli na zło, Bóg obrócił w dobro.',
  ],
  meditar: 'W jakiej części twojej historii potrzebujesz uwierzyć, tak jak Józef, że Bóg może obrócić wszystko w dobro?',
}
