import { getToken, saveToken } from './tokenStorage';

export function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new Error('Set EXPO_PUBLIC_API_URL to the address of the Vestir backend.');
  }
  return configuredUrl.replace(/\/+$/, '');
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const { auth = false, ...fetchOptions } = options;
  const headers = { ...fetchOptions.headers };

  if (auth) {
    let token;
    try {
      token = await getToken();
    } catch {
      throw new Error('Could not read the saved login token. Please log in again.');
    }
    if (!token) throw new Error('Please log in to access your favourites.');
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}/${path}`, { ...fetchOptions, headers });
  } catch {
    throw new Error(`Could not reach the backend at ${baseUrl}. Check the server and API URL.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.ok ? 'The backend returned an invalid response.' : `Request failed (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (HTTP ${response.status}).`);
  }

  return data;
}

async function postAuth(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function login(email, password) {
  const data = await postAuth('login', { email: email.trim(), password });
  if (typeof data?.token !== 'string' || !data.token) {
    throw new Error('Login succeeded, but the backend did not return a token.');
  }

  try {
    await saveToken(data.token);
  } catch {
    throw new Error('Login succeeded, but the token could not be stored on this device.');
  }

  return data;
}

export async function signup(name, email, password) {
  return postAuth('signup', { name, email, password });
}

export { getToken };