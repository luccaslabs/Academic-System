import { useUnreadContext } from '../contexts/UnreadContext'

export function useUnreadDot() {
  return useUnreadContext()
}
