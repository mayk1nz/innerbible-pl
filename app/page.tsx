import { redirect } from 'next/navigation'

// The app shell sends visitors without a session to /logowanie.
export default function Page() {
  redirect('/start')
}
