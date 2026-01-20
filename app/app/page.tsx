import { redirect } from 'next/navigation'

export default function Home() {
  // 나중에 인증 체크 후 리다이렉트 로직 추가
  redirect('/login')
}
