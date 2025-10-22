export const API = import.meta.env.VITE_API_BASE

export async function getMe() {
  const res = await fetch(`${API}/me`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) return null
  const { user } = await res.json()
  return user
}
