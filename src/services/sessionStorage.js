const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const stores = [sessionStorage, localStorage]

function safeRead(store, key) {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

function safeRemove(store, key) {
  try {
    store.removeItem(key)
  } catch {
    // Browser storage can be unavailable in privacy-restricted contexts.
  }
}

export function clearSession() {
  stores.forEach((store) => {
    safeRemove(store, TOKEN_KEY)
    safeRemove(store, USER_KEY)
  })
}

export function getSession() {
  for (const store of stores) {
    const token = safeRead(store, TOKEN_KEY)
    if (!token) continue

    const rawUser = safeRead(store, USER_KEY)
    let user = null
    if (rawUser) {
      try {
        user = JSON.parse(rawUser)
      } catch {
        clearSession()
        return null
      }
    }

    return { token, user }
  }
  return null
}

export function getAccessToken() {
  return getSession()?.token || null
}

export function isActiveToken(token) {
  return Boolean(token) && getAccessToken() === token
}

export function saveSession(token, user, remember = false) {
  clearSession()
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(USER_KEY, JSON.stringify(user))
}
