const TOKEN_KEY = 'vestir_jwt';

function getStorage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Browser storage is unavailable.');
  }
  return localStorage;
}

export async function saveToken(token) {
  getStorage().setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return getStorage().getItem(TOKEN_KEY);
}

export async function removeToken() {
  getStorage().removeItem(TOKEN_KEY);
}