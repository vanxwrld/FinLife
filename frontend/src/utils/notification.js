// Layanan notifikasi Expo Push Notification (Phase 3)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updatePushToken } from '../api/auth.api';

// Konfigurasi bagaimana notifikasi ditampilkan saat aplikasi aktif di foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Meminta izin notifikasi dan mendaftarkan perangkat untuk menerima Push Token dari Expo.
 * @returns {Promise<string|null>} ExponentPushToken[...] atau null jika gagal/ditolak
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    // 1. Konfigurasi channel notifikasi Android (Android 8.0+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FinLife Notifikasi',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00E676',
      });
    }

    // 2. Periksa status izin notifikasi saat ini
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Jika belum diberi izin, minta izin ke pengguna
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Izin push notifikasi ditolak oleh pengguna.');
      return null;
    }

    // 3. Dapatkan Expo Push Token
    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    token = pushTokenData?.data || null;

    if (token) {
      console.log('[Notifications] Expo Push Token diperoleh:', token);
    }
  } catch (err) {
    // Di simulator atau lingkungan tanpa Play Services, token push mungkin tidak tersedia
    console.warn('[Notifications] Gagal mendapatkan push token:', err.message);
  }

  return token;
}

/**
 * Daftarkan dan kirim token push ke backend jika user sedang login
 */
export async function syncPushTokenWithBackend() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await updatePushToken(token);
      console.log('[Notifications] Push token berhasil disinkronkan ke backend');
      return token;
    }
  } catch (err) {
    console.warn('[Notifications] Gagal sinkronisasi push token ke server:', err.message);
  }
  return null;
}
