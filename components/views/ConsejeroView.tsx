'use client'

import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react'
import { BenefitList, DealBox } from '../Deal'
import { Icon } from '../icons'
import { PageHeader } from '../PageHeader'
import { buttonClass } from '../ui'
import { PAIN_EXAMPLES, TOPIC_GROUPS } from '@/lib/consejero/topics'
import { DEALS } from '@/lib/deals'
import { useAppState } from '@/lib/store'

// Twój Doradca Biblijny. Members with Słowa Pana (upsell 2) talk with it every
// day; everyone else gets one free question a day, examples of the biggest pains and
// the half-price offer with their own countdown. Everything comes from /api/consejero
// (the conversation is kept on the server, for the member only).

interface Message {
  role: 'user' | 'assistant'
  content: string
  crisis?: boolean
}

interface Status {
  member: boolean
  limit: number
  used: number
  offerStartedAt: string | null
  messages: Message[]
}

export function ConsejeroView() {
  const { session } = useAppState()
  const [status, setStatus] = useState<Status | 'loading' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    fetch('/api/consejero', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as Status
        if (alive) setStatus(data)
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [attempt])

  if (status === 'loading') {
    return (
      <div aria-busy className="animate-pulse space-y-4">
        <div className="h-44 rounded-[28px] bg-primary/80" />
        <div className="h-6 w-2/3 rounded bg-line-soft" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <>
        <PageHeader title="Twój Doradca Biblijny" />
        <div className="rounded-3xl border border-line bg-surface p-6 text-center">
          <p className="text-[16px] text-text">Nie udało się otworzyć Doradcy. Sprawdź połączenie z internetem.</p>
          <button type="button" onClick={() => { setStatus('loading'); setAttempt((a) => a + 1) }} className={`${buttonClass.secondary} mt-4`}>
            Spróbuj ponownie
          </button>
        </div>
      </>
    )
  }

  const name = session?.name ?? ''
  if (status.member) return <Chat status={status} name={name} mode="member" />
  return <LockedConsejero status={status} name={name} />
}

// ─── Pieces ─────────────────────────────────────────────────────────

/** "a **b** c" → a <strong>b</strong> c. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, j) => (
        <Fragment key={j}>{j % 2 ? <strong className="font-semibold">{part}</strong> : part}</Fragment>
      ))}
    </>
  )
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ol' | 'ul'; items: string[] }

const OL_ITEM = /^\s*\d+[.)]\s+/
const UL_ITEM = /^\s*[-•*]\s+/

/** The answer's light markdown: paragraphs, line breaks, numbered and bulleted steps, bold. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let gap = false
  for (const raw of text.split('\n')) {
    // A stray heading ("### Krok 1") reads as a bold line.
    const line = raw.replace(/^\s*#{1,6}\s+(.*)$/, '**$1**')
    const last = blocks[blocks.length - 1]
    if (!line.trim()) {
      gap = true
      continue
    }
    const kind = OL_ITEM.test(line) ? 'ol' : UL_ITEM.test(line) ? 'ul' : 'p'
    if (kind === 'p') {
      // A blank line starts a new paragraph; a single line break stays inside it.
      if (last?.kind === 'p' && !gap) last.lines.push(line)
      else blocks.push({ kind: 'p', lines: [line] })
    } else {
      // Steps separated by blank lines are still one list (numbering continues).
      const item = line.replace(kind === 'ol' ? OL_ITEM : UL_ITEM, '')
      if (last?.kind === kind) last.items.push(item)
      else blocks.push({ kind, items: [item] })
    }
    gap = false
  }
  return blocks
}

function Answer({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {toBlocks(text).map((b, i) =>
        b.kind === 'p' ? (
          <p key={i}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </Fragment>
            ))}
          </p>
        ) : b.kind === 'ol' ? (
          <ol key={i} className="space-y-2">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft font-sans text-[13px] font-bold text-ink">{j + 1}</span>
                <span className="min-w-0">
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                <span className="min-w-0">
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

function CrisisCard() {
  return (
    <div role="alert" className="mt-3 rounded-2xl border-2 border-danger/40 bg-danger/10 p-4 text-[15px] leading-relaxed text-ink">
      <p className="flex items-center gap-2 font-semibold text-danger">
        <Icon name="phone" className="size-5" />
        Nie zostajesz bez pomocy. Porozmawiaj z kimś jeszcze dziś:
      </p>
      <ul className="mt-2 space-y-1">
        <li>
          <strong>112</strong> — numer alarmowy, gdy życie jest w niebezpieczeństwie
        </li>
        <li>
          <strong>116 123</strong> — Kryzysowy Telefon Zaufania dla dorosłych
        </li>
        <li>
          <strong>800 70 2222</strong> — Centrum Wsparcia dla Osób Dorosłych w Kryzysie Psychicznym (całodobowo, bezpłatnie)
        </li>
        <li>
          <strong>116 111</strong> — Telefon Zaufania dla Dzieci i Młodzieży
        </li>
      </ul>
      <p className="mt-2">Możesz też od razu zadzwonić do zaufanej osoby, księdza lub pastora.</p>
    </div>
  )
}

/** "O czym chcesz porozmawiać?": groups first, then ready-to-send first sentences. */
function TopicPicker({ onPick, title = 'O czym chcesz porozmawiać?' }: { onPick: (text: string) => void; title?: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const group = TOPIC_GROUPS.find((g) => g.id === open)
  return (
    <section aria-label="Tematy do rozmowy" className="mt-6">
      <h2 className="font-serif text-[20px] font-semibold text-ink">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {TOPIC_GROUPS.map((g) => {
          const active = g.id === open
          return (
            <button
              key={g.id}
              type="button"
              aria-expanded={active}
              onClick={() => setOpen(active ? null : g.id)}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                active ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-surface text-ink hover:bg-surface-hover'
              }`}
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-white/15 text-gold-bright' : 'bg-gold-soft text-gold'}`}>
                <Icon name={g.icon} className="size-5" />
              </span>
              <span className="text-[15px] font-semibold leading-tight">{g.label}</span>
            </button>
          )
        })}
      </div>
      {group && (
        <ul className="animate-rise mt-3 space-y-2">
          {group.starters.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => onPick(s)}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-left text-[15.5px] text-ink transition hover:bg-surface-hover"
              >
                <span className="flex-1">{s}</span>
                <Icon name="send" className="size-4 shrink-0 text-primary" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-center text-[14px] text-muted">Albo napisz to własnymi słowami poniżej.</p>
    </section>
  )
}

// ─── The conversation ─────────────────────────────────────────────

function Chat({ status, name, mode }: { status: Status; name: string; mode: 'member' | 'free' }) {
  const [messages, setMessages] = useState<Message[]>(status.messages)
  const [used, setUsed] = useState(status.used)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const left = Math.max(0, status.limit - used)
  const free = mode === 'free'

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy || left === 0) return
    const before = messages
    setInput('')
    setNotice(null)
    setBusy(true)
    const withQuestion: Message[] = [...before, { role: 'user', content: question }]
    setMessages([...withQuestion, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/consejero', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })
      if (!res.ok || !res.body) {
        const code = ((await res.json().catch(() => ({}))) as { error?: string }).error
        throw new Error(code ?? 'upstream')
      }
      setUsed((u) => u + 1)
      const crisis = res.headers.get('x-crisis') === '1'
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setMessages([...withQuestion, { role: 'assistant', content: answer, crisis }])
      }
    } catch (err) {
      // Nothing was answered: give the question back.
      const code = err instanceof Error ? err.message : ''
      setMessages(before)
      if (code === 'limit' || code === 'free-used') {
        setUsed(status.limit)
      } else {
        setInput(question)
      }
      setNotice(
        code === 'limit'
          ? `To już wszystkie dzisiejsze rozmowy (limit: ${status.limit}). Czekam na ciebie jutro!`
          : code === 'free-used'
            ? 'Dzisiejsze darmowe pytanie zostało już wykorzystane. Wróć jutro albo odblokuj Doradcę, aby rozmawiać codziennie.'
            : code === 'not-configured'
              ? 'Doradca nie jest jeszcze podłączony. Wróć za chwilę.'
              : code === 'no-session'
                ? 'Twoja sesja wygasła. Zaloguj się ponownie swoim adresem e-mail.'
                : 'Nie udało mi się teraz odpowiedzieć. Sprawdź połączenie i spróbuj ponownie za chwilę.',
      )
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const reset = async () => {
    if (!window.confirm('Usunąć całą rozmowę z Doradcą? Tego nie da się cofnąć.')) return
    const res = await fetch('/api/consejero', { method: 'DELETE' }).catch(() => null)
    if (res?.ok) setMessages([])
  }

  const empty = messages.length === 0

  return (
    <>
      {free ? (
        <div className="rounded-3xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">
            <Icon name="gift" className="size-4" />
            Twoje darmowe pytanie na dziś
          </p>
          <p className="mt-1 text-[15px] leading-snug text-text">
            {left > 0 ? 'Wypróbuj teraz: opowiedz, co nosisz w sercu. Codziennie masz 1 darmowe pytanie.' : 'Dzisiejsze pytanie zostało wykorzystane. Jutro będzie kolejne.'}
          </p>
        </div>
      ) : empty ? (
        <div className="relative overflow-hidden rounded-[28px] bg-primary px-5 pb-6 pt-5 text-white shadow-float">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(90% 70% at 85% 0%, rgba(224,172,74,.35), transparent 60%)' }}
          />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-gold-bright">
              <Icon name="chatCross" className="size-6" />
            </span>
            <h1 className="mt-4 font-serif text-[27px] font-semibold leading-tight">Witaj{name ? `, ${name}` : ''}</h1>
            <p className="mt-1.5 text-[16px] leading-relaxed text-white/85">
              Jestem twoim Doradcą Biblijnym. Opowiedz mi, co nosisz w sercu, a razem poszukamy światła w Słowie Bożym.
            </p>
          </div>
        </div>
      ) : (
        <PageHeader title="Twój Doradca Biblijny" subtitle="Pociecha i wskazówki w Słowie Bożym" />
      )}

      {empty && left > 0 && <TopicPicker onPick={(t) => void send(t)} title={free ? 'O co chcesz zapytać?' : undefined} />}

      <div className="mt-4 space-y-4">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-md bg-primary px-4 py-3 text-[16px] leading-relaxed text-white">
              {m.content}
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-gold-bright" aria-hidden>
                <Icon name="chatCross" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="rounded-3xl rounded-tl-md border border-line bg-surface px-4 py-3 font-serif text-[16.5px] leading-relaxed text-ink">
                  {m.content ? <Answer text={m.content} /> : <span className="animate-pulse text-muted">Szukam światła w Słowie…</span>}
                </div>
                {m.crisis && <CrisisCard />}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl bg-gold-soft/60 px-4 py-3 text-center text-[15px] text-ink">
          {notice}
        </p>
      )}

      {(left > 0 || !free) && (
        <form
          onSubmit={submit}
          className="sticky z-30 mt-5 rounded-3xl border border-line bg-surface p-2 shadow-card"
          style={{ bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 88px)' }}
        >
          <div className="flex items-end gap-2">
            <label htmlFor="consejero-input" className="sr-only">
              Napisz wiadomość
            </label>
            <textarea
              id="consejero-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              maxLength={1500}
              disabled={left === 0}
              placeholder={left === 0 ? 'Limit na dziś wykorzystany. Do jutra!' : 'Napisz, co czujesz…'}
              className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-[16px] leading-snug text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || left === 0}
              aria-label="Wyślij"
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-white transition disabled:opacity-40"
            >
              <Icon name="send" className="size-5" />
            </button>
          </div>
          <div className="flex items-center justify-between px-3 pb-1 pt-1 text-[12.5px] text-muted">
            <span>{free ? (left ? '1 darmowe pytanie dziś' : 'Dzisiejsze pytanie wykorzystane') : `Pozostało na dziś: ${left} z ${status.limit}`}</span>
            {!empty && !free && (
              <button type="button" onClick={() => void reset()} className="font-semibold text-primary underline-offset-4 hover:underline">
                Usuń rozmowę
              </button>
            )}
          </div>
        </form>
      )}

      <p className="mt-3 text-center text-[13px] leading-snug text-muted">
        Twój Doradca korzysta ze sztucznej inteligencji, aby pomóc ci szukać światła w Biblii. Nie zastępuje księdza, pastora ani specjalisty. Twoja rozmowa jest prywatna: widzisz ją tylko ty.
      </p>
    </>
  )
}

// ─── For members without Słowa Pana ───────────────────────

/** The biggest pains, each with the start of a real-style answer, cut at the lock. */
function PainExamples() {
  const [id, setId] = useState(PAIN_EXAMPLES[0].id)
  const ex = PAIN_EXAMPLES.find((p) => p.id === id) ?? PAIN_EXAMPLES[0]
  return (
    <section aria-label="Przykładowe rozmowy" className="mt-8">
      <h2 className="font-serif text-[20px] font-semibold text-ink">Tak towarzyszy ci każdego dnia</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">Dotknij tematu i zobacz przykład:</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {PAIN_EXAMPLES.map((p) => {
          const active = p.id === ex.id
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setId(p.id)}
              className={`flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2 text-center transition ${
                active ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-surface text-ink hover:bg-surface-hover'
              }`}
            >
              <Icon name={p.icon} className={`size-5 ${active ? 'text-gold-bright' : 'text-gold'}`} />
              <span className="text-[12.5px] font-semibold leading-tight">{p.label}</span>
            </button>
          )
        })}
      </div>
      <div key={ex.id} className="animate-rise relative mt-4 overflow-hidden rounded-3xl border border-line bg-surface-2 p-4">
        <div className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-tr-md bg-primary px-4 py-3 text-[15.5px] leading-relaxed text-white">{ex.question}</div>
        <div className="mt-3 flex gap-2.5">
          <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-gold-bright" aria-hidden>
            <Icon name="chatCross" className="size-4" />
          </span>
          <div className="rounded-3xl rounded-tl-md border border-line bg-surface px-4 py-3 font-serif text-[16px] leading-relaxed text-ink">{ex.answer}</div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-2 to-transparent" />
        <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-white">
          <Icon name="lock" className="size-3.5" />
          Kontynuuj z Doradcą
        </span>
      </div>
    </section>
  )
}

function LockedConsejero({ status, name }: { status: Status; name: string }) {
  return (
    <>
      <PageHeader title="Twój Doradca Biblijny" subtitle="Pociecha i wskazówki w Słowie Bożym, o każdej porze" />

      <Chat status={status} name={name} mode="free" />

      <PainExamples />

      <div className="mt-6">
        <DealBox offer="upsell2" title="Twój Doradca + 3 plany 90-dniowe" cta="Chcę mojego Doradcę" />
      </div>

      <div className="mt-5 rounded-3xl border border-line bg-surface p-5">
        <BenefitList items={DEALS.upsell2.benefits} label="W zestawie" />
      </div>
    </>
  )
}
