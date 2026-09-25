'use client'

import { useEffect, useId, useRef } from 'react'
import { preload } from 'react-dom'
import { Icon } from '../icons'
import type { VslConfig } from '@/lib/funnel/config'

type SmartPlayer = HTMLElement & {
  displayHiddenElements?: (seconds: number, selectors: string[], options: { persist: boolean }) => void
}

// Mounts a VTurb smartplayer from the owner's own account and tells the page when the
// offer may appear. VTurb's delay API reveals a hidden sentinel at `delaySeconds` (and
// remembers it for returning viewers); a MutationObserver turns that into `onReveal`,
// so the offer itself stays ordinary React state.
//
// No player configured, or the script fails to load → the offer is revealed at once:
// a broken video must never hide the buy button.

export function VturbPlayer({ video, onReveal }: { video: VslConfig; onReveal: () => void }) {
  const mount = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLSpanElement>(null)
  const sentinelId = `offer-gate-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const configured = Boolean(video.playerId && video.scriptUrl)
  // VTurb's "Optimize Player Loading Speed": start downloading the player script as
  // early as possible (React emits the <link rel="preload"> once, in <head>).
  if (configured) preload(video.scriptUrl, { as: 'script' })

  useEffect(() => {
    if (!configured || video.delaySeconds <= 0) onReveal()
  }, [configured, video.delaySeconds, onReveal])

  useEffect(() => {
    const host = mount.current
    const gate = sentinel.current
    if (!configured || !host || !gate) return

    const player = document.createElement('vturb-smartplayer') as SmartPlayer
    player.id = video.playerId
    player.style.cssText = 'display:block;margin:0 auto;width:100%;max-width:400px;'
    const onReady = () => {
      if (video.delaySeconds > 0) player.displayHiddenElements?.(video.delaySeconds, [`#${sentinelId}`], { persist: true })
    }
    player.addEventListener('player:ready', onReady)
    host.appendChild(player)

    const observer = new MutationObserver(() => {
      if (gate.style.display && gate.style.display !== 'none') onReveal()
    })
    observer.observe(gate, { attributes: true, attributeFilter: ['style'] })

    if (!document.querySelector(`script[data-vturb="${video.playerId}"]`)) {
      const script = document.createElement('script')
      script.src = video.scriptUrl
      script.async = true
      script.dataset.vturb = video.playerId
      script.addEventListener('error', onReveal)
      document.head.appendChild(script)
    }

    return () => {
      observer.disconnect()
      player.removeEventListener('player:ready', onReady)
      player.remove()
    }
  }, [configured, video.playerId, video.scriptUrl, video.delaySeconds, sentinelId, onReveal])

  return (
    <div>
      {configured ? (
        <div ref={mount} className="mx-auto max-w-[400px] overflow-hidden rounded-2xl bg-black shadow-card" />
      ) : (
        <div className="grid aspect-[9/16] max-h-[520px] w-full place-items-center rounded-2xl bg-[#0c0a07] text-center text-[#fbf1dc]">
          <div className="px-6">
            <Icon name="play" className="mx-auto size-12 text-gold-bright" />
            <p className="mt-3 font-serif text-lg">Wideo w przygotowaniu</p>
          </div>
        </div>
      )}
      <span ref={sentinel} id={sentinelId} style={{ display: 'none' }} aria-hidden />
    </div>
  )
}
