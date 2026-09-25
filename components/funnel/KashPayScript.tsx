/**
 * KashPay's official upsell script, exactly as KashPay requires it: this URL, loaded
 * synchronously (no async/defer), before the buttons. It defines the global
 * acceptUpsell / declineUpsell used by OneClickPage. Rendered only on the upsell and
 * downsell pages, so the rest of the site never loads it.
 */
export function KashPayScript() {
  // eslint-disable-next-line @next/next/no-sync-scripts -- KashPay requires a synchronous tag
  return <script src="https://checkout.kashpay.com.br/scripts/upsell-processor.js" />
}
