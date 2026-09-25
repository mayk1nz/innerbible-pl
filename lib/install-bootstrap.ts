// Shared by the inline <head> script (root layout, a server component) and the
// client hooks in lib/install.ts — kept free of React so the layout can import it.

export const INSTALL_CHANGE_EVENT = 'ib-install'

/**
 * Runs in <head>, before any bundle: stores the browser's install event (and
 * suppresses its own mini-infobar, which would also pop up over the sales funnel)
 * and registers the service worker in production.
 */
export function installBootstrap(registerServiceWorker: boolean): string {
  return [
    `addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ibInstallEvent=e;dispatchEvent(new Event('${INSTALL_CHANGE_EVENT}'))});`,
    `addEventListener('appinstalled',function(){window.__ibInstalled=true;window.__ibInstallEvent=null;dispatchEvent(new Event('${INSTALL_CHANGE_EVENT}'))});`,
    registerServiceWorker
      ? `if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`
      : '',
  ].join('')
}
