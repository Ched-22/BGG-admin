const TOKEN_KEY = 'bgg-token';
const USER_KEY = 'bgg-user';
const REMEMBER_KEY = 'bgg-admin-remember';

let unauthorizedHandler = null;

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function parseUser(raw) {
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (user?.email || user?.name) return user;
  } catch {
    /* ignore */
  }
  return null;
}

/** Drop legacy tokens saved without "remember me" so the app opens on login. */
export function normalizeSessionOnBoot() {
  try {
    if (localStorage.getItem(REMEMBER_KEY) !== '1') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* storage blocked */
  }
}

function readStorage(getter) {
  try {
    return getter();
  } catch {
    return null;
  }
}

export function getToken() {
  const sessionToken = readStorage(() => sessionStorage.getItem(TOKEN_KEY));
  if (sessionToken) return sessionToken;
  if (readStorage(() => localStorage.getItem(REMEMBER_KEY)) === '1') {
    return readStorage(() => localStorage.getItem(TOKEN_KEY));
  }
  return null;
}

export function getStoredUser() {
  const sessionRaw = readStorage(() => sessionStorage.getItem(USER_KEY));
  const fromSession = parseUser(sessionRaw);
  if (fromSession) return fromSession;
  if (readStorage(() => localStorage.getItem(REMEMBER_KEY)) === '1') {
    return parseUser(readStorage(() => localStorage.getItem(USER_KEY)));
  }
  return null;
}

export function hasStoredSession() {
  return Boolean(getToken() && getStoredUser());
}

export function patchStoredUser(partial) {
  const user = getStoredUser();
  if (!user) return null;
  const next = { ...user, ...partial };
  try {
    if (sessionStorage.getItem(USER_KEY)) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(next));
    }
    if (localStorage.getItem(USER_KEY)) {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function setSession(accessToken, user, { remember = false } = {}) {
  clearSession();
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, accessToken);
    store.setItem(USER_KEY, JSON.stringify(user));
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* ignore */
  }
}

export function handleUnauthorized(reason = 'expired') {
  clearSession();
  unauthorizedHandler?.(reason);
}
