// Runs in <head> before anything paints: applies the member's dark mode from the saved
// app state, so a dark-mode user never sees a flash of parchment. The sales pages
// (quiz, upsells) always stay light.

export const FUNNEL_PATHS = ['/', '/quiz', '/upsell', '/upsell-downsell', '/slowa-pana', '/slowa-pana-downsell']

export function themeBootstrap(storageKey: string): string {
  return `try{var p=location.pathname;if(${JSON.stringify(FUNNEL_PATHS)}.indexOf(p)<0){var s=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'{}');if(s.theme==='dark')document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`
}
