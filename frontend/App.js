import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Components & Modals
import {
  AlertModal,
  Toast,
  DialogModal,
  CreateGroupModal,
  InviteModal,
  JoinGroupModal,
} from './src/components';

// Screens — Arsitektur Modular Berbasis Fitur (Domain-Driven)
import {
  SplashScreen,
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotScreen,
  ResetScreen,
} from './src/screens/auth';
import { DashboardScreen } from './src/screens/dashboard';
import { GroupListScreen, GroupDetailScreen } from './src/screens/groups';
import {
  SetoranScreen,
  SetoranSummaryScreen,
  PengeluaranScreen,
  RiwayatScreen,
  KoreksiScreen,
} from './src/screens/transactions';
import {
  StatusScreen,
  StatusLateScreen,
  StatusMemberScreen,
} from './src/screens/status';
import { NotifikasiScreen } from './src/screens/notifications';
import { ProfilScreen, AntrianScreen } from './src/screens/profile';

// Context & API
import { AuthProvider } from './src/context/AuthContext';
import * as authApi from './src/api/auth.api';
import * as groupApi from './src/api/group.api';
import * as contributionApi from './src/api/contribution.api';
import * as expenseApi from './src/api/expense.api';
import * as balanceApi from './src/api/balance.api';
import { clearToken, getToken } from './src/utils/tokenStorage';
import { adaptBackendGroup } from './src/utils/groupAdapter';
import * as Notifications from 'expo-notifications';
import { syncPushTokenWithBackend } from './src/utils/notification';

// Local storage & Store
import {
  normGroup, addPengeluaran, addSetoran, applyHapus, applyKoreksi,
  auth, createGroup, failAttempt, joinGroupFromInvite, makePengeluaranTx,
  makeQueueItem, makeSetoranTx, queueStats, reminderSummary, syncAll, syncPending,
} from './src/store';
import {
  allGroupCodes, clearSession, emptyData, joinGroupByCode,
  loadSession, loadUserData, loadUsers, pushNotif, saveSession, saveUserData, saveUsers,
} from './src/storage';
import { c, rb, rupiah } from './src/theme';

function MainApp() {
  const [stack, setStack] = useState(['splash']);
  const screen = stack[stack.length - 1];
  const [user, setUser] = useState(null);
  const [rawGroups, setGroups] = useState([]);
  const groups = useMemo(() => rawGroups.map(normGroup), [rawGroups]);
  const [selectedId, setSelectedId] = useState(null);
  const [setoranGroupId, setSetoranGroupId] = useState(null);
  const [keluarGroupId, setKeluarGroupId] = useState(null);
  const [statusGroupId, setStatusGroupId] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [riwayatGroupId, setRiwayatGroupId] = useState(null);
  const [koreksi, setKoreksi] = useState(null);
  const [riwayatTxId, setRiwayatTxId] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [netOk, setNetOk] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  // Backend berjalan di jaringan lokal (LAN/Wi-Fi/Hotspot), sehingga tidak memerlukan koneksi internet publik.
  // online aktif selama user tidak mengaktifkan mode offline secara manual (forceOffline).
  const online = !forceOffline;
  const prevOnline = useRef(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [inviteId, setInviteId] = useState(null);
  const [remind, setRemind] = useState(null);
  const [txs, setTxs] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [invite, setInvite] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [alert, setAlert] = useState(null);
  const [toast, setToast] = useState({ message: '', id: 0 });
  const alertCb = useRef(null);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadedFor = useRef(null);

  // Simpan otomatis data akun lokal
  useEffect(() => {
    if (user && loadedFor.current === user.username) {
      saveUserData(user.username, { groups, txs, notifs, queue });
    }
  }, [user, groups, txs, notifs, queue]);

  // Pantau koneksi internet
  useEffect(() => {
    const unsub = NetInfo.addEventListener((st) => setNetOk(st.isConnected !== false));
    return () => unsub();
  }, []);

  const koreksiGroup = koreksi && groups.find((g) => g.id === koreksi.groupId);
  const koreksiTx = koreksiGroup && (koreksiGroup.history || []).find((t) => t.id === koreksi.txId);

  const go = useCallback((name) => setStack((s) => [...s, name]), []);
  const replace = useCallback((name) => setStack([name]), []);
  const swap = useCallback((name) => setStack((s) => [...s.slice(0, -1), name]), []);
  const back = useCallback(() => {
    if (alert) return true;
    if (stack.length > 1 && screen !== 'home' && screen !== 'groups') {
      setStack((s) => s.slice(0, -1));
      return true;
    }
    return false;
  }, [stack, screen, alert]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [back]);

  const showAlert = (title, lines, cb) => {
    alertCb.current = cb;
    setAlert({ title, lines });
  };
  const closeAlert = () => {
    setAlert(null);
    alertCb.current?.();
    alertCb.current = null;
  };
  const showToast = (message) => setToast((t) => ({ message, id: t.id + 1 }));

  // Muat daftar grup dari server backend Express + MySQL
  const refreshGroupsFromBackend = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const bgList = await groupApi.getGroups();
      if (Array.isArray(bgList)) {
        const detailed = await Promise.all(
          bgList.map(async (bg) => {
            try {
              const det = await groupApi.getGroupDetail(bg.id);
              return adaptBackendGroup(det);
            } catch {
              return adaptBackendGroup(bg);
            }
          })
        );
        setGroups(detailed);
      }
    } catch (err) {
      console.warn('[App] Gagal memuat grup dari backend:', err.message);
    }
  }, []);

  // Login handler
  const onLogin = async (u, isNew = false) => {
    const d = isNew ? emptyData() : await loadUserData(u.username);
    loadedFor.current = u.username;
    saveSession(u.username);
    setUser(u);
    setGroups(d.groups || []);
    setTxs(d.txs || []);
    setNotifs(d.notifs || []);
    setQueue(d.queue || []);
    setForceOffline(false);
    replace(isNew ? 'groups' : 'home');

    // Sinkronisasi data grup dari backend
    refreshGroupsFromBackend();

    // Daftarkan dan kirim push token ke backend (Phase 3)
    syncPushTokenWithBackend();
  };

  // Listener push notifikasi (Phase 3)
  useEffect(() => {
    const notifSub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      const newNotif = {
        id: 'n_push_' + Date.now(),
        kind: data?.tipe === 'setoran' ? 'in' : data?.tipe === 'pengeluaran' ? 'out' : 'invite',
        at: Date.now(),
        unread: true,
        title: title || 'Notifikasi FinLife',
        text: body || '',
        groupId: data?.grupId ? String(data.grupId) : null,
      };
      setNotifs((prev) => [newNotif, ...prev]);
      showToast(`${title}: ${body}`);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.grupId) {
        setSelectedId(String(data.grupId));
        replace('groups');
        go('detail');
      }
    });

    return () => {
      notifSub.remove();
      responseSub.remove();
    };
  }, [replace, go]);

  // Muat sesi tersimpan saat app dibuka
  useEffect(() => {
    (async () => {
      try {
        const list = await loadUsers();
        auth.init(list, saveUsers);

        // 1. Coba validasi token JWT ke backend jika ada
        const token = await getToken();
        if (token) {
          try {
            const me = await authApi.getMe();
            if (me) {
              const u = {
                id: me.id,
                name: me.nama,
                nama: me.nama,
                username: me.username,
                email: me.email,
                token,
              };
              await onLogin(u);
              setReady(true);
              return;
            }
          } catch (err) {
            console.warn('[App] Token validation failed:', err.message);
          }
        }

        // 2. Fallback sesi lokal
        const un = await loadSession();
        const u = un ? auth.byUsername(un) : null;
        if (u) await onLogin(u);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Kembali online → antrian menunggu otomatis terkirim
  useEffect(() => {
    if (prevOnline.current === online) return;
    prevOnline.current = online;
    if (!user) return;
    if (online) {
      const n = queue.filter((i) => i.status === 'pending').length;
      setQueue((q) => syncPending(q));
      refreshGroupsFromBackend();
      showToast(n ? `Kembali online. ${n} data berhasil dikirim.` : 'Kembali online.');
    } else {
      showToast('Mode offline. Data baru disimpan lokal.');
    }
  }, [online]);

  const notifyOthers = (g, { kind, title, text, txId }) =>
    (g.people || [])
      .filter((p) => p.username !== user?.username)
      .forEach((p) =>
        pushNotif(p.username, {
          id: 'n' + Date.now() + p.username,
          kind,
          at: Date.now(),
          unread: true,
          title,
          text,
          groupId: g.id,
          groupCode: g.code,
          txId,
        })
      );

  const soon = (what) => showToast(`${what} — layar ini belum dibuat.`);

  const tab = (k) => {
    if (k === 'home' || k === 'groups') {
      if (k !== screen) replace(k);
    } else if (k === 'add') {
      openSetoran();
    } else if (k === 'notif') {
      if (screen !== 'notif') replace('notif');
    } else if (k === 'profile') {
      if (screen !== 'profile') replace('profile');
    }
  };

  // 06 Catat setoran
  const openSetoran = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mencatat setoran.');
    if (screen === 'setoran') return;
    setSetoranGroupId(g?.id ?? setoranGroupId ?? selectedId ?? groups[0].id);
    go('setoran');
  };

  const openSetoranSummary = (g) => {
    setSetoranGroupId(g.id);
    go('setoranSum');
  };

  const onSaveSetoran = async ({ groupId, username, amount, date, note }) => {
    const g = groups.find((x) => x.id === groupId);
    const person = (g.people || []).find((p) => p.username === username) || { name: username, username };
    const next = addSetoran(groups, groupId, username, amount, { date, by: user.username });
    setGroups(next);

    const ng = next.find((x) => x.id === groupId);
    if (ng) {
      notifyOthers(ng, {
        kind: 'in',
        title: 'Setoran Dicatat',
        txId: ng.history?.[0]?.id,
        text: `${user.name.split(' ')[0]} mencatat setoran ${rb(amount)}${
          person.username === user.username ? '' : ` untuk ${person.name.split(' ')[0]}`
        }`,
      });
    }

    setTxs((t) => [makeSetoranTx(person, amount, date), ...t]);
    setSetoranGroupId(groupId);
    swap('setoranSum');

    // Kirim ke backend jika online
    let sentToBackend = false;
    if (online && !isNaN(Number(groupId))) {
      try {
        const targetUser = (g.people || []).find((p) => p.username === username);
        await contributionApi.createContribution(groupId, {
          id_user: targetUser?.id,
          nominal: amount,
          keterangan: note || 'Setoran',
          tanggal: date.toISOString().split('T')[0],
        });
        sentToBackend = true;
      } catch (apiErr) {
        console.error('[App] Gagal kirim setoran ke backend:', apiErr.message);
        showToast(`Server: ${apiErr.message}`);
      }
    }

    setQueue((q) => [
      makeQueueItem({ kind: 'in', title: 'Setoran', amount, online: sentToBackend || online }),
      ...q,
    ]);
    showToast(
      `Setoran ${rupiah(amount)} dari ${person.name.split(' ')[0]} tersimpan.${
        sentToBackend || online ? '' : ' Dikirim saat online.'
      }`
    );
  };

  // 07 Catat pengeluaran
  const openPengeluaran = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mencatat pengeluaran.');
    if (screen === 'keluar') return;
    setKeluarGroupId(g?.id ?? keluarGroupId ?? selectedId ?? groups[0].id);
    go('keluar');
  };

  const onSavePengeluaran = async ({ groupId, title, amount, date, shares, mode, payer }) => {
    const next = addPengeluaran(groups, groupId, shares, amount, {
      title: title.trim(),
      date,
      mode,
      by: user.username,
      payer,
    });
    setGroups(next);

    const ng = next.find((x) => x.id === groupId);
    if (ng) {
      notifyOthers(ng, {
        kind: 'out',
        title: 'Pengeluaran Dicatat',
        txId: ng.history?.[0]?.id,
        text: `${user.name.split(' ')[0]} mencatat "${title.trim()}" ${rb(amount)}`,
      });
    }

    setTxs((t) => [makePengeluaranTx(title, amount, date, user), ...t]);
    setSelectedId(groupId);
    setStack((s) => s.slice(0, -1));

    // Kirim ke backend jika online
    let sentToBackend = false;
    if (online && !isNaN(Number(groupId))) {
      try {
        const g = groups.find((x) => x.id === groupId);
        const payerPerson = (g.people || []).find((p) => p.username === payer);

        // Pastikan semua user ID numerik (dari backend MySQL), bukan string lokal
        const allPeopleHaveNumericId = (g.people || []).every((p) => !isNaN(Number(p.id)));
        if (!allPeopleHaveNumericId || !payerPerson?.id || isNaN(Number(payerPerson.id))) {
          throw new Error('Grup belum tersinkron ke database — ID anggota belum valid');
        }

        const backendSplits =
          mode === 'equal'
            ? Object.keys(shares).map((u) => {
                const p = (g.people || []).find((x) => x.username === u);
                if (!p?.id || isNaN(Number(p.id))) throw new Error(`Anggota ${u} belum punya ID database`);
                return Number(p.id);
              })
            : Object.entries(shares).map(([u, nom]) => {
                const p = (g.people || []).find((x) => x.username === u);
                if (!p?.id || isNaN(Number(p.id))) throw new Error(`Anggota ${u} belum punya ID database`);
                return { id_user: Number(p.id), nominal_bagian: nom };
              });

        await expenseApi.createExpense(groupId, {
          nama_pengeluaran: title.trim(),
          total_nominal: amount,
          metode_pembagian: mode === 'equal' ? 'bagi_rata' : 'nominal_masing_masing',
          tanggal: date.toISOString().split('T')[0],
          id_pembayar: Number(payerPerson.id),
          splits: backendSplits,
        });
        sentToBackend = true;
      } catch (apiErr) {
        console.error('[App] Gagal kirim pengeluaran ke backend:', apiErr.message);
        showToast(`Server: ${apiErr.message}`);
      }
    }

    setQueue((q) => [
      makeQueueItem({ kind: 'out', title: title.trim(), amount, online: sentToBackend || online }),
      ...q,
    ]);
    showToast(
      `Pengeluaran ${rupiah(amount)} untuk ${
        shares ? Object.keys(shares).length : 0
      } anggota tersimpan.${sentToBackend || online ? '' : ' Dikirim saat online.'}`
    );
  };

  // 08 Status keuangan
  const openStatus = async (g) => {
    setStatusGroupId(g.id);
    go('status');

    // Refresh data grup dari backend agar saldo & kewajiban up-to-date dari MySQL
    if (online && !isNaN(Number(g.id))) {
      try {
        const det = await groupApi.getGroupDetail(g.id);
        const updated = adaptBackendGroup(det);
        if (updated) {
          setGroups((prev) => prev.map((item) => (item.id === g.id ? { ...item, ...updated } : item)));
        }
      } catch (err) {
        console.warn('[App] Gagal refresh status grup:', err.message);
      }
    }
  };
  const openStatusMember = (p) => {
    setStatusUser(p.username);
    go('statusMember');
  };

  // 09 Riwayat transaksi
  const openRiwayat = async (g, txId = null) => {
    setRiwayatGroupId(g.id);
    setRiwayatTxId(txId);
    go('riwayat');

    // Ambil riwayat terbaru dari backend jika online
    if (online && !isNaN(Number(g.id))) {
      try {
        const serverTxs = await balanceApi.getTransactions(g.id);
        if (Array.isArray(serverTxs) && serverTxs.length > 0) {
          // Field mapping sesuai response backend getTransactions():
          // Backend mengirim: jenis, nominal, keterangan, tanggal, created_at,
          //   nama_penyetor (setoran), nama_pencatat, nama_pembayar (pengeluaran)
          const mappedHistory = serverTxs.map((t) => ({
            id: String(t.id),
            kind: t.jenis === 'setoran' ? 'in' : 'out',
            title: t.keterangan || (t.jenis === 'setoran' ? `Setoran ${t.nama_penyetor || ''}` : 'Pengeluaran'),
            amount: parseFloat(t.nominal || 0),
            at: new Date(t.tanggal).getTime() || Date.now(),
            by: t.nama_pencatat || '',
            payer: t.jenis === 'setoran' ? (t.nama_penyetor || '') : (t.nama_pembayar || ''),
            deleted: false,
          }));
          setGroups((all) =>
            all.map((item) => (item.id === g.id ? { ...item, history: mappedHistory } : item))
          );
        }
      } catch (err) {
        console.warn('[App] Gagal ambil transaksi dari backend:', err.message);
      }
    }
  };

  const openKoreksi = (g, tx) => {
    setKoreksi({ groupId: g.id, txId: tx.id });
    go('koreksi');
  };

  const onSaveKoreksi = async (data) => {
    setGroups((x) => applyKoreksi(x, koreksi.groupId, koreksi.txId, { ...data, by: user.username }));
    setStack((s) => s.slice(0, -1));

    // Kirim koreksi ke backend jika online dan ID numerik (dari MySQL)
    if (online && !isNaN(Number(koreksi.groupId)) && !isNaN(Number(koreksi.txId))) {
      try {
        await contributionApi.updateContribution(koreksi.groupId, koreksi.txId, {
          nominal: data.amount,
          keterangan: data.title || data.note || 'Koreksi',
          tanggal: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined,
        });
        showToast('Koreksi tersimpan ke database.');
      } catch (apiErr) {
        console.error('[App] Gagal koreksi di backend:', apiErr.message);
        showToast(`Koreksi lokal tersimpan. Server: ${apiErr.message}`);
      }
    } else {
      showToast('Koreksi tersimpan (lokal).');
    }
  };

  const onDeleteTx = async (g, tx) => {
    setGroups((x) => applyHapus(x, g.id, tx.id, user.username));

    // Hapus transaksi di backend jika online dan ID numerik
    if (online && !isNaN(Number(g.id)) && !isNaN(Number(tx.id))) {
      try {
        if (tx.kind === 'in') {
          await contributionApi.deleteContribution(g.id, tx.id);
        } else {
          await expenseApi.deleteExpense(g.id, tx.id);
        }
        showToast('Transaksi dihapus dari database.');
      } catch (apiErr) {
        console.error('[App] Gagal hapus di backend:', apiErr.message);
        showToast(`Dihapus lokal. Server: ${apiErr.message}`);
      }
    } else {
      showToast('Transaksi dihapus (lokal).');
    }
  };

  const changeOnline = (v) => {
    if (v && !netOk) return showToast('Perangkat tidak terhubung ke internet.');
    setForceOffline(!v);
  };

  const retryQueue = () => {
    if (!online) {
      setQueue((q) => failAttempt(q));
      return showToast('Masih offline. Percobaan kirim ulang gagal.');
    }
    const n = queueStats(queue).unsent;
    setQueue((q) => syncAll(q));
    showToast(`${n} data berhasil dikirim.`);
  };

  const doLogout = async () => {
    setLogoutAsk(false);
    loadedFor.current = null;
    await clearToken();
    await clearSession();
    setUser(null);
    setGroups([]);
    setTxs([]);
    setNotifs([]);
    setQueue([]);
    setForceOffline(false);
    replace('login');
    showToast('Kamu sudah keluar.');
  };

  const askLogout = () => (queueStats(queue).unsent > 0 ? setLogoutAsk(true) : doLogout());

  const askReminder = (late) => setRemind({ people: late });
  const sendReminder = () => {
    const { to } = reminderSummary(remind.people);
    const g = groups.find((x) => x.id === statusGroupId);
    remind.people.forEach((p) =>
      pushNotif(p.username, {
        id: 'n' + Date.now() + p.username,
        kind: 'reminder',
        at: Date.now(),
        unread: true,
        title: 'Pengingat Tagihan',
        text: `${user.name.split(' ')[0]} mengingatkan: kamu masih kurang ${rb(
          p.wajib - p.setor
        )}${g ? ` di "${g.name}"` : ''}`,
        groupId: g?.id,
        groupCode: g?.code,
      })
    );
    setRemind(null);
    showToast(`Pengingat tagihan dikirim ke ${to}.`);
  };

  const openNotif = (n) => {
    setNotifs((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
    if (n.kind === 'invite') {
      if (n.invite.status === 'pending') return setInviteId(n.id);
      const g = groups.find((x) => x.id === n.invite.groupId);
      return g ? openGroup(g) : undefined;
    }
    const g = groups.find((x) => x.id === n.groupId || (n.groupCode && x.code === n.groupCode));
    if (!g) return showToast('Grup untuk notifikasi ini tidak ditemukan.');
    if (n.kind === 'reminder') return openGroup(g);
    openRiwayat(g, g.history?.some((t) => t.id === n.txId) ? n.txId : null);
  };

  const inviteNotif = notifs.find((n) => n.id === inviteId);
  const setInviteStatus = (id, patch) =>
    setNotifs((l) =>
      l.map((x) => (x.id === id ? { ...x, unread: false, invite: { ...x.invite, ...patch } } : x))
    );

  const acceptInvite = async () => {
    const n = inviteNotif;
    setInviteId(null);
    if (!n?.invite?.code) return;
    if (groups.some((g) => (g.code || g.kode_undangan) === n.invite.code)) {
      return showToast('Kamu sudah tergabung di grup ini.');
    }
    const err = await onJoin(n.invite.code);
    if (!err) {
      setInviteStatus(n.id, { status: 'accepted' });
    } else {
      showToast(err);
    }
  };

  const onJoin = async (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (groups.some((g) => (g.code || g.kode_undangan) === cleanCode)) {
      return 'Kamu sudah tergabung di grup ini.';
    }

    // 1. Coba gabung via API backend jika online
    if (online) {
      try {
        const res = await groupApi.joinGroup(cleanCode);
        let joinedGroup = null;
        try {
          const det = await groupApi.getGroupDetail(res.id);
          joinedGroup = adaptBackendGroup(det);
        } catch {
          joinedGroup = adaptBackendGroup(res);
        }
        setGroups((x) => [...x.filter((g) => g.id !== joinedGroup.id), joinedGroup]);
        setJoinOpen(false);
        setSelectedId(joinedGroup.id);
        replace('groups');
        go('detail');
        showToast(`Kamu bergabung ke grup “${joinedGroup.name}”.`);
        return null;
      } catch (apiErr) {
        return apiErr.message || 'Kode grup tidak ditemukan. Periksa kembali kodenya.';
      }
    } else {
      // 2. Mode offline
      const r = await joinGroupByCode(cleanCode, user);
      if (r.error) return 'Kode grup tidak ditemukan. Periksa kembali kodenya.';
      setGroups((x) => [...x, r.group]);
      setJoinOpen(false);
      setSelectedId(r.group.id);
      replace('groups');
      go('detail');
      showToast(`Kamu bergabung ke grup “${r.group.name}”.`);
      return null;
    }
  };

  const declineInvite = () => {
    const n = inviteNotif;
    setInviteId(null);
    setInviteStatus(n.id, { status: 'declined' });
    showToast('Undangan ditolak.');
  };

  const openGroup = (g) => {
    setSelectedId(g.id);
    go('detail');

    // Auto-refresh detail grup dari backend saat dibuka
    if (online && !isNaN(Number(g.id))) {
      groupApi.getGroupDetail(g.id)
        .then((det) => {
          const updated = adaptBackendGroup(det);
          if (updated) {
            setGroups((prev) => prev.map((item) => (item.id === g.id ? { ...item, ...updated } : item)));
          }
        })
        .catch((e) => console.warn('[App] Auto-refresh grup warning:', e.message));
    }
  };

  const onCreate = async (name) => {
    let newGroup = null;

    // 1. Buat grup di backend MySQL jika online
    if (online) {
      try {
        console.log('[App] Mencoba membuat grup di backend:', name);
        const created = await groupApi.createGroup(name);
        try {
          const det = await groupApi.getGroupDetail(created.id);
          newGroup = adaptBackendGroup(det);
        } catch {
          newGroup = adaptBackendGroup(created);
        }
        console.log('[App] Grup berhasil dibuat di MySQL:', newGroup?.id);
      } catch (apiErr) {
        console.error('[App] Gagal membuat grup di backend:', apiErr.message);
        showToast(`Server: ${apiErr.message || 'Gagal menyimpan ke database'}`);
      }
    }

    // 2. Fallback pembuatan grup lokal (jika backend gagal atau offline)
    if (!newGroup) {
      const taken = (await allGroupCodes()).map((c) => ({ code: c }));
      newGroup = createGroup(name, user, [...groups, ...taken]);
      showToast(`Grup disimpan lokal (belum masuk DB). Kode: ${newGroup.code}`);
    } else {
      showToast(`Grup “${newGroup.name}” dibuat. Kode: ${newGroup.code}`);
    }

    setGroups((x) => [...x, newGroup]);
    setCreateOpen(false);
    setSelectedId(newGroup.id);
    replace('groups');
    go('detail');
  };

  const onInvited = async (u, g) => {
    // Coba undang via backend jika online
    if (online && !isNaN(Number(g.id))) {
      try {
        await groupApi.inviteMember(g.id, u.username);
      } catch (err) {
        console.warn('[App] Backend invite warning:', err.message);
      }
    }

    const ok = await pushNotif(u.username, {
      id: 'n' + Date.now(),
      kind: 'invite',
      at: Date.now(),
      unread: true,
      title: 'Undangan Grup Baru',
      text: `${user.name.split(' ')[0]} mengundang kamu ke "${g.name}"`,
      invite: {
        from: user.name,
        groupName: g.name,
        code: g.code,
        admin: g.admin || user.username,
        status: 'pending',
        members: (g.people || []).map((p) => ({ name: p.name, username: p.username, color: p.color })),
      },
    });
    showToast(
      ok
        ? `Undangan ke @${u.username} untuk ${g.name} terkirim.`
        : `@${u.username} sudah punya undangan untuk grup ini.`
    );
  };

  const openInvite = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mengundang anggota.');
    setInvite({ groupId: g?.id ?? null });
  };

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await refreshGroupsFromBackend();
    setRefreshing(false);
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />
      {screen === 'splash' && <SplashScreen go={(n) => replace(n)} />}
      {screen === 'welcome' && <WelcomeScreen go={go} />}
      {screen === 'login' && <LoginScreen go={go} onLogin={onLogin} showAlert={showAlert} />}
      {screen === 'register' && <RegisterScreen go={go} onLogin={onLogin} showAlert={showAlert} />}
      {screen === 'forgot' && (
        <ForgotScreen
          go={go}
          initialEmail={user?.email}
          onBack={user ? back : undefined}
          onCodeSent={(e) => {
            setResetEmail(e);
            go('reset');
          }}
        />
      )}
      {screen === 'reset' && (
        <ResetScreen
          email={resetEmail}
          onDone={() => {
            if (user) {
              setStack((s) => s.slice(0, -2));
              showToast('Kata sandi diperbarui.');
            } else {
              replace('login');
              showToast('Kata sandi diperbarui. Silakan masuk.');
            }
          }}
        />
      )}
      {screen === 'home' && (
        <DashboardScreen
          user={user}
          groups={groups}
          onNavigate={tab}
          onSoon={soon}
          onOpenGroup={openGroup}
          onInvite={() => openInvite()}
          transactions={txs}
          onSetoran={() => openSetoran()}
          onKeluar={() => openPengeluaran()}
        />
      )}
      {screen === 'groups' && (
        <GroupListScreen
          groups={groups}
          onNavigate={tab}
          onCreate={() => setCreateOpen(true)}
          onOpenGroup={openGroup}
          onJoin={() => setJoinOpen(true)}
          onRefresh={handlePullRefresh}
          refreshing={refreshing}
        />
      )}
      {screen === 'detail' && (
        <GroupDetailScreen
          group={groups.find((g) => g.id === selectedId)}
          onNavigate={tab}
          onSoon={soon}
          onInvite={openInvite}
          onStatus={openStatus}
          onRiwayat={openRiwayat}
          onSetoran={openSetoran}
          onSetoranSummary={openSetoranSummary}
          onPengeluaran={openPengeluaran}
        />
      )}
      {screen === 'setoran' && groups.length > 0 && (
        <SetoranScreen
          groups={groups}
          groupId={setoranGroupId}
          user={user}
          online={online}
          onChangeGroup={setSetoranGroupId}
          onNavigate={tab}
          onSave={onSaveSetoran}
        />
      )}
      {screen === 'setoranSum' && (
        <SetoranSummaryScreen
          group={groups.find((g) => g.id === setoranGroupId)}
          onNavigate={tab}
          onAdd={() => go('setoran')}
        />
      )}
      {screen === 'keluar' && groups.length > 0 && (
        <PengeluaranScreen
          groups={groups}
          groupId={keluarGroupId}
          user={user}
          onChangeGroup={setKeluarGroupId}
          onNavigate={tab}
          onSave={onSavePengeluaran}
        />
      )}
      {screen === 'status' && (
        <StatusScreen
          group={groups.find((g) => g.id === statusGroupId)}
          onNavigate={tab}
          onMember={openStatusMember}
          onUnpaid={() => go('statusLate')}
        />
      )}
      {screen === 'statusLate' && (
        <StatusLateScreen
          group={groups.find((g) => g.id === statusGroupId)}
          onNavigate={tab}
          onMember={openStatusMember}
          onRemind={askReminder}
        />
      )}
      {screen === 'statusMember' && (
        <StatusMemberScreen
          group={groups.find((g) => g.id === statusGroupId)}
          username={statusUser}
          onNavigate={tab}
          onRemind={askReminder}
        />
      )}
      {screen === 'riwayat' && (
        <RiwayatScreen
          group={groups.find((g) => g.id === riwayatGroupId)}
          user={user}
          initialTxId={riwayatTxId}
          online={online}
          onNavigate={tab}
          onToast={showToast}
          onKoreksi={openKoreksi}
          onDelete={onDeleteTx}
        />
      )}
      {screen === 'profile' && (
        <ProfilScreen
          user={user}
          queue={queue}
          online={online}
          onNavigate={tab}
          onEdit={() => soon('Edit Profil')}
          onSecurity={() => go('forgot')}
          onQueue={() => go('antrian')}
          onLogout={askLogout}
        />
      )}
      {screen === 'antrian' && (
        <AntrianScreen
          queue={queue}
          online={online}
          onToggleOnline={changeOnline}
          onRetry={retryQueue}
          onNavigate={tab}
        />
      )}
      {screen === 'notif' && <NotifikasiScreen notifs={notifs} onOpen={openNotif} onNavigate={tab} />}
      {screen === 'koreksi' && koreksiGroup && koreksiTx && (
        <KoreksiScreen
          key={koreksiTx.id}
          group={koreksiGroup}
          tx={koreksiTx}
          online={online}
          onNavigate={tab}
          onSave={onSaveKoreksi}
          onCancel={() => setStack((s) => s.slice(0, -1))}
        />
      )}
      <DialogModal
        visible={!!inviteNotif && inviteId !== null}
        icon={'\u2709\uFE0E'}
        title="Undangan Grup Keuangan"
        onClose={() => setInviteId(null)}
        lines={
          inviteNotif
            ? [
                `${inviteNotif.invite.from} mengundang kamu`,
                'untuk bergabung ke grup:',
                inviteNotif.invite.groupName,
                `Kode ${inviteNotif.invite.code} · ${inviteNotif.invite.members.length} anggota aktif`,
              ]
            : []
        }
        primary={{ label: 'Terima', onPress: acceptInvite }}
        secondary={{ label: 'Tolak', onPress: declineInvite }}
      />
      <DialogModal
        visible={!!remind}
        icon="!"
        tone={c.amber}
        title="Kirim Pengingat Tagihan"
        onClose={() => setRemind(null)}
        lines={
          remind
            ? [
                `Kirim notifikasi pengingat ke ${reminderSummary(remind.people).to}`,
                `(Kurang bayar ${remind.people.length > 1 ? 'total ' : ''}${rupiah(
                  reminderSummary(remind.people).total
                )})`,
              ]
            : []
        }
        primary={{ label: 'Kirim Notifikasi Pengingat', onPress: sendReminder }}
        secondary={{ label: 'Batal', onPress: () => setRemind(null) }}
      />
      <DialogModal
        visible={logoutAsk}
        icon="!"
        tone={c.amber}
        title="Ada Data Belum Terkirim"
        onClose={() => setLogoutAsk(false)}
        lines={[
          `${queueStats(queue).unsent} data masih di antrian offline.`,
          'Jika keluar sekarang, data ini bisa hilang.',
        ]}
        primary={{ label: 'Kembali', onPress: () => setLogoutAsk(false) }}
        secondary={{ label: 'Tetap Keluar', onPress: doLogout }}
      />
      <CreateGroupModal
        visible={createOpen}
        groups={groups}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
      />
      <JoinGroupModal visible={joinOpen} onClose={() => setJoinOpen(false)} onJoin={onJoin} />
      <InviteModal
        visible={!!invite}
        groups={groups}
        groupId={invite?.groupId}
        onClose={() => setInvite(null)}
        onInvited={onInvited}
      />
      <AlertModal visible={!!alert} title={alert?.title} lines={alert?.lines} onClose={closeAlert} />
      <Toast message={toast.message} id={toast.id} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
