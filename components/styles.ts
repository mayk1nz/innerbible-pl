// Plain class strings, usable from server and client components alike. (Values
// exported from a 'use client' module cannot be read by a server component.)

export const buttonClass = {
  primary:
    'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-center text-[16px] font-semibold text-white text-balance transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 px-5 py-3 text-center text-[16px] font-semibold text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-primary transition hover:bg-surface',
} as const
