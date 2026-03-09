import { getServerSession } from '@/lib/auth-server'
import NavigationClient from './NavigationClient'

export default async function Navigation() {
  const user = await getServerSession()
  return <NavigationClient user={user} />
}
