import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to chat for now (will add auth later)
  redirect('/chat')
}

