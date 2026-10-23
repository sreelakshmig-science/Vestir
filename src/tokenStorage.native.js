import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vestir_jwt';

export function saveToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function removeToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}