// Penyimpanan token JWT — menggunakan expo-secure-store (enkripsi perangkat)
// dengan fallback ke AsyncStorage jika SecureStore tidak tersedia.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'finlife:jwt';

// Cek apakah SecureStore tersedia di platform ini
let _secureAvailable = null;
async function isSecureAvailable() {
  if (_secureAvailable !== null) return _secureAvailable;
  try {
    _secureAvailable = await SecureStore.isAvailableAsync();
  } catch {
    _secureAvailable = false;
  }
  return _secureAvailable;
}

/** Simpan JWT token secara aman */
export async function saveToken(token) {
  try {
    if (await isSecureAvailable()) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    console.warn('[tokenStorage] Gagal menyimpan token:', err.message);
  }
}

/** Ambil JWT token yang tersimpan; null jika tidak ada */
export async function getToken() {
  try {
    if (await isSecureAvailable()) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Hapus JWT token (logout) */
export async function clearToken() {
  try {
    if (await isSecureAvailable()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // abaikan error saat hapus
  }
}
