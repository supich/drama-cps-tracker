import { redirect } from 'next/navigation'

export default function Home() {
  // 重定向到 Dashboard
  redirect('/dashboard')
}