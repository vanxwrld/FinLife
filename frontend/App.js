import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AlertModal from './src/components/AlertModal';
import Toast from './src/components/Toast';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotScreen from './src/screens/ForgotScreen';
import ResetScreen from './src/screens/ResetScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GroupListScreen from './src/screens/GroupListScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import CreateGroupModal from './src/components/CreateGroupModal';
import InviteModal from './src/components/InviteModal';
import JoinGroupModal from './src/components/JoinGroupModal';
import SetoranScreen from './src/screens/SetoranScreen';
import SetoranSummaryScreen from './src/screens/SetoranSummaryScreen';
import PengeluaranScreen from './src/screens/PengeluaranScreen';
import StatusScreen from './src/screens/StatusScreen';
import StatusLateScreen from './src/screens/StatusLateScreen';
import StatusMemberScreen from './src/screens/StatusMemberScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';
import KoreksiScreen from './src/screens/KoreksiScreen';
import NotifikasiScreen from './src/screens/NotifikasiScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import AntrianScreen from './src/screens/AntrianScreen';
import DialogModal from './src/components/DialogModal';
import { normGroup, addPengeluaran, addSetoran, applyHapus, applyKoreksi, auth, createGroup, failAttempt, joinGroupFromInvite, makePengeluaranTx, makeQueueItem, makeSetoranTx, queueStats, reminderSummary, syncAll, syncPending } from './src/store';
import { allGroupCodes, clearSession, emptyData, joinGroupByCode, loadSession, loadUserData, loadUsers, pushNotif, saveSession, saveUserData, saveUsers } from './src/storage';
import { c, rb, rupiah } from './src/theme';

export default function App() {
  const [stack, setStack] = useState(['splash']);
  const screen = stack[stack.length - 1];
  const [user, setUser] = useState(null);
  const [rawGroups, setGroups] = useState([]);
  const groups = useMemo(() => rawGroups.map(normGroup), [rawGroups]); // members & unpaid dihitung dari data
  const [selectedId, setSelectedId] = useState(null);
  const [setoranGroupId, setSetoranGroupId] = useState(null); // grup aktif di layar Setoran (06/06c)
  const [keluarGroupId, setKeluarGroupId] = useState(null); // grup aktif di layar Pengeluaran (07)
  const [statusGroupId, setStatusGroupId] = useState(null); // grup aktif di layar Status keuangan (08/08b/08c)
  const [statusUser, setStatusUser] = useState(null); // anggota yang dibuka di 08c
  const [riwayatGroupId, setRiwayatGroupId] = useState(null); // grup aktif di layar Riwayat (09/09b/09c)
  const [koreksi, setKoreksi] = useState(null); // { groupId, txId } transaksi yang dikoreksi di 09d
  const [riwayatTxId, setRiwayatTxId] = useState(null); // transaksi yang langsung dibuka di Riwayat (dari Notifikasi)
  const [notifs, setNotifs] = useState([]); // 10 Notifikasi
  const [netOk, setNetOk] = useState(true); // koneksi asli perangkat (NetInfo)
  const [forceOffline, setForceOffline] = useState(false); // saklar simulasi offline di layar 13/13b
  const online = netOk && !forceOffline;
  const prevOnline = useRef(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [queue, setQueue] = useState([]); // antrian offline sync (13/13b)
  const [logoutAsk, setLogoutAsk] = useState(false); // konfirmasi keluar bila ada data belum terkirim
  const [inviteId, setInviteId] = useState(null); // 10b: id notifikasi undangan yang sedang dibuka
  const [remind, setRemind] = useState(null); // 10c: { people } anggota yang akan diingatkan
  const [txs, setTxs] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [invite, setInvite] = useState(null); // { groupId } saat modal undang terbuka
  const [resetEmail, setResetEmail] = useState('');
  const [alert, setAlert] = useState(null);
  const [toast, setToast] = useState({ message: '', id: 0 });
  const alertCb = useRef(null);
  const [ready, setReady] = useState(false); // akun tersimpan sudah dimuat
  const loadedFor = useRef(null); // username yang datanya sudah dimuat (mencegah menimpa data dengan state kosong)

  // Simpan otomatis data akun yang sedang masuk setiap ada perubahan.
  useEffect(() => {
    if (user && loadedFor.current === user.username) saveUserData(user.username, { groups, txs, notifs, queue });
  }, [user, groups, txs, notifs, queue]);

  // Pantau koneksi internet sungguhan.
  useEffect(() => {
    const unsub = NetInfo.addEventListener((st) => setNetOk(st.isConnected !== false));
    return () => unsub();
  }, []);

  const koreksiGroup = koreksi && groups.find((g) => g.id === koreksi.groupId);
  const koreksiTx = koreksiGroup && (koreksiGroup.history || []).find((t) => t.id === koreksi.txId);

  const go = useCallback((name) => setStack((s) => [...s, name]), []);
  const replace = useCallback((name) => setStack([name]), []);
  const swap = useCallback((name) => setStack((s) => [...s.slice(0, -1), name]), []); // ganti layar teratas
  const back = useCallback(() => {
    if (alert) return true;
    if (stack.length > 1 && screen !== 'home' && screen !== 'groups') { setStack((s) => s.slice(0, -1)); return true; }
    return false; // keluar app
  }, [stack, screen, alert]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [back]);

  const showAlert = (title, lines, cb) => { alertCb.current = cb; setAlert({ title, lines }); };
  const closeAlert = () => { setAlert(null); alertCb.current?.(); alertCb.current = null; };
  const showToast = (message) => setToast((t) => ({ message, id: t.id + 1 }));

  // Login → muat data akun itu dari penyimpanan (kosong bila belum pernah membuat apa pun) → Dashboard (01).
  // Daftar baru → Daftar grup kosong (04b).
  const onLogin = async (u, isNew = false) => {
    const d = isNew ? emptyData() : await loadUserData(u.username);
    loadedFor.current = u.username;
    saveSession(u.username); // sesi tersimpan: app berikutnya langsung masuk
    setUser(u);
    setGroups(d.groups); setTxs(d.txs); setNotifs(d.notifs); setQueue(d.queue);
    setForceOffline(false);
    replace(isNew ? 'groups' : 'home');
  };
  // Muat akun & sesi tersimpan sebelum app tampil. Ada sesi → langsung ke Dashboard (tanpa login ulang).
  useEffect(() => {
    (async () => {
      const list = await loadUsers();
      auth.init(list, saveUsers);
      const un = await loadSession();
      const u = un ? auth.byUsername(un) : null;
      if (u) await onLogin(u);
      setReady(true);
    })();
  }, []);
  // Kembali online → antrian menunggu otomatis terkirim (F10). Offline → beri tahu.
  useEffect(() => {
    if (prevOnline.current === online) return;
    prevOnline.current = online;
    if (!user) return;
    if (online) {
      const n = queue.filter((i) => i.status === 'pending').length;
      setQueue((q) => syncPending(q));
      showToast(n ? `Kembali online. ${n} data berhasil dikirim.` : 'Kembali online.');
    } else showToast('Mode offline. Data baru disimpan lokal.');
  }, [online]);
  // Beri tahu anggota lain di grup (US-10). Dikirim ke notifikasi akun tujuan di perangkat ini.
  const notifyOthers = (g, { kind, title, text, txId }) =>
    g.people.filter((p) => p.username !== user.username).forEach((p) =>
      pushNotif(p.username, { id: 'n' + Date.now() + p.username, kind, at: Date.now(), unread: true, title, text, groupId: g.id, groupCode: g.code, txId }));
  const soon = (what) => showToast(`${what} — layar ini belum dibuat.`);
  const tab = (k) => {
    if (k === 'home' || k === 'groups') { if (k !== screen) replace(k); }
    else if (k === 'add') openSetoran();
    else if (k === 'notif') { if (screen !== 'notif') replace('notif'); }
    else if (k === 'profile') { if (screen !== 'profile') replace('profile'); }
  };
  // 06 Catat setoran — dari Dashboard, tab Catat, atau Detail grup
  const openSetoran = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mencatat setoran.');
    if (screen === 'setoran') return;
    setSetoranGroupId(g?.id ?? setoranGroupId ?? selectedId ?? groups[0].id);
    go('setoran');
  };
  // 06c Ringkasan setoran — dari Detail grup
  const openSetoranSummary = (g) => { setSetoranGroupId(g.id); go('setoranSum'); };
  const onSaveSetoran = ({ groupId, username, amount, date }) => {
    const g = groups.find((x) => x.id === groupId);
    const person = g.people.find((p) => p.username === username);
    const next = addSetoran(groups, groupId, username, amount, { date, by: user.username });
    setGroups(next);
    const ng = next.find((x) => x.id === groupId);
    notifyOthers(ng, { kind: 'in', title: 'Setoran Dicatat', txId: ng.history[0].id,
      text: `${user.name.split(' ')[0]} mencatat setoran ${rb(amount)}${person.username === user.username ? '' : ` untuk ${person.name.split(' ')[0]}`}` });
    setTxs((t) => [makeSetoranTx(person, amount, date), ...t]);
    setSetoranGroupId(groupId);
    swap('setoranSum');
    setQueue((q) => [makeQueueItem({ kind: 'in', title: 'Setoran', amount, online }), ...q]);
    showToast(`Setoran ${rupiah(amount)} dari ${person.name.split(' ')[0]} tersimpan.${online ? '' : ' Dikirim saat online.'}`);
  };
  // 07 Catat pengeluaran — dari Dashboard (tombol Keluar) atau Detail grup
  const openPengeluaran = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mencatat pengeluaran.');
    if (screen === 'keluar') return;
    setKeluarGroupId(g?.id ?? keluarGroupId ?? selectedId ?? groups[0].id);
    go('keluar');
  };
  const onSavePengeluaran = ({ groupId, title, amount, date, shares, mode, payer }) => {
    const next = addPengeluaran(groups, groupId, shares, amount, { title: title.trim(), date, mode, by: user.username, payer });
    setGroups(next);
    const ng = next.find((x) => x.id === groupId);
    notifyOthers(ng, { kind: 'out', title: 'Pengeluaran Dicatat', txId: ng.history[0].id, text: `${user.name.split(' ')[0]} mencatat "${title.trim()}" ${rb(amount)}` });
    setTxs((t) => [makePengeluaranTx(title, amount, date, user), ...t]);
    setSelectedId(groupId);
    setStack((s) => s.slice(0, -1)); // kembali ke layar asal (Dashboard / Detail grup)
    setQueue((q) => [makeQueueItem({ kind: 'out', title: title.trim(), amount, online }), ...q]);
    showToast(`Pengeluaran ${rupiah(amount)} untuk ${shares ? Object.keys(shares).length : 0} anggota tersimpan.${online ? '' : ' Dikirim saat online.'}`);
  };
  // 08 Status keuangan — dari "Status lengkap" di Detail grup. 08b/08c dibuka dari dalamnya.
  const openStatus = (g) => { setStatusGroupId(g.id); go('status'); };
  const openStatusMember = (p) => { setStatusUser(p.username); go('statusMember'); };
  // 09 Riwayat transaksi — dari tombol "Riwayat" di Detail grup. 09b = filter, 09c = detail (sheet) di dalamnya.
  const openRiwayat = (g, txId = null) => { setRiwayatGroupId(g.id); setRiwayatTxId(txId); go('riwayat'); };
  // 09d Koreksi — dari "Ubah Data" di sheet 09c. Simpan/Batal kembali ke Riwayat.
  const openKoreksi = (g, tx) => { setKoreksi({ groupId: g.id, txId: tx.id }); go('koreksi'); };
  const onSaveKoreksi = (data) => {
    setGroups((x) => applyKoreksi(x, koreksi.groupId, koreksi.txId, { ...data, by: user.username }));
    setStack((s) => s.slice(0, -1));
    showToast('Koreksi tersimpan dan tercatat di riwayat.');
  };
  // 09e Hapus — dikonfirmasi di Riwayat; saldo & kewajiban dihitung ulang, entri tetap ada sebagai jejak audit.
  const onDeleteTx = (g, tx) => {
    setGroups((x) => applyHapus(x, g.id, tx.id, user.username));
    showToast('Transaksi dihapus dan tercatat di riwayat.');
  };
  // 11 Profil — Keamanan → 02b (email terisi), Antrian/Riwayat Sinkronisasi → 13/13b, Keluar Akun → 02.
  const changeOnline = (v) => {
    if (v && !netOk) return showToast('Perangkat tidak terhubung ke internet.');
    setForceOffline(!v); // toast & sinkronisasi ditangani efek perubahan status online
  };
  const retryQueue = () => {
    if (!online) { setQueue((q) => failAttempt(q)); return showToast('Masih offline. Percobaan kirim ulang gagal.'); }
    const n = queueStats(queue).unsent;
    setQueue((q) => syncAll(q));
    showToast(`${n} data berhasil dikirim.`);
  };
  const doLogout = () => {
    setLogoutAsk(false);
    loadedFor.current = null;
    clearSession();
    setUser(null); setGroups([]); setTxs([]); setNotifs([]); setQueue([]); setForceOffline(false);
    replace('login');
    showToast('Kamu sudah keluar.');
  };
  const askLogout = () => (queueStats(queue).unsent > 0 ? setLogoutAsk(true) : doLogout());
  // 10c Kirim pengingat — dari 08b / 08c. late = anggota yang kurang bayar.
  const askReminder = (late) => setRemind({ people: late });
  const sendReminder = () => {
    const { to } = reminderSummary(remind.people);
    const g = groups.find((x) => x.id === statusGroupId);
    remind.people.forEach((p) => pushNotif(p.username, {
      id: 'n' + Date.now() + p.username, kind: 'reminder', at: Date.now(), unread: true, title: 'Pengingat Tagihan',
      text: `${user.name.split(' ')[0]} mengingatkan: kamu masih kurang ${rb(p.wajib - p.setor)}${g ? ` di "${g.name}"` : ''}`,
      groupId: g?.id, groupCode: g?.code,
    }));
    setRemind(null);
    showToast(`Pengingat tagihan dikirim ke ${to}.`);
  };
  // 10 Notifikasi — undangan → popup 10b; pengeluaran/setoran dicatat → Riwayat (sheet 09f bila ada transaksinya).
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
    setNotifs((l) => l.map((x) => (x.id === id ? { ...x, unread: false, invite: { ...x.invite, ...patch } } : x)));
  const acceptInvite = async () => {
    const n = inviteNotif;
    setInviteId(null);
    if (groups.some((g) => g.code === n.invite.code)) return showToast('Kamu sudah tergabung di grup ini.');
    const r = await joinGroupByCode(n.invite.code, user); // bergabung ke grup yang sama (bukan salinan)
    const g = r.group || joinGroupFromInvite(n.invite, user, groups);
    setGroups((x) => [...x, g]);
    setInviteStatus(n.id, { status: 'accepted', groupId: g.id });
    replace('groups'); // 10b → Daftar grup (04)
    showToast(`Kamu bergabung ke grup “${g.name}”.`);
  };
  // Gabung lewat kode grup (US-02 kriteria 2). Mengembalikan pesan error, atau null bila berhasil.
  const onJoin = async (code) => {
    if (groups.some((g) => g.code === code.trim().toUpperCase())) return 'Kamu sudah tergabung di grup ini.';
    const r = await joinGroupByCode(code, user);
    if (r.error) return 'Kode grup tidak ditemukan. Periksa kembali kodenya.';
    setGroups((x) => [...x, r.group]);
    setJoinOpen(false);
    setSelectedId(r.group.id);
    replace('groups'); go('detail');
    showToast(`Kamu bergabung ke grup “${r.group.name}”.`);
    return null;
  };
  const declineInvite = () => {
    const n = inviteNotif;
    setInviteId(null);
    setInviteStatus(n.id, { status: 'declined' });
    showToast('Undangan ditolak.');
  };
  const openGroup = (g) => { setSelectedId(g.id); go('detail'); };
  const onCreate = async (name) => {
    const taken = (await allGroupCodes()).map((code) => ({ code })); // kode grup harus unik di seluruh akun
    const g = createGroup(name, user, [...groups, ...taken]);
    setGroups((x) => [...x, g]);
    setCreateOpen(false);
    setSelectedId(g.id);
    replace('groups'); go('detail');
    showToast(`Grup “${g.name}” dibuat. Kode: ${g.code}`);
  };
  // Undangan masuk ke notifikasi akun tujuan (di perangkat ini). Tanpa backend belum ada sinkron antar perangkat.
  const onInvited = async (u, g) => {
    const ok = await pushNotif(u.username, {
      id: 'n' + Date.now(), kind: 'invite', at: Date.now(), unread: true, title: 'Undangan Grup Baru',
      text: `${user.name.split(' ')[0]} mengundang kamu ke "${g.name}"`,
      invite: { from: user.name, groupName: g.name, code: g.code, admin: g.admin || user.username, status: 'pending',
        members: g.people.map((p) => ({ name: p.name, username: p.username, color: p.color })) },
    });
    showToast(ok ? `Undangan ke @${u.username} untuk ${g.name} terkirim.` : `@${u.username} sudah punya undangan untuk grup ini.`);
  };
  // Dashboard: undang tanpa grup terpilih (pilih di modal) · Detail grup: undang ke grup itu
  const openInvite = (g) => {
    if (!groups.length) return showToast('Buat grup dulu sebelum mengundang anggota.');
    setInvite({ groupId: g?.id ?? null });
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
        <ForgotScreen go={go} initialEmail={user?.email} onBack={user ? back : undefined}
          onCodeSent={(e) => { setResetEmail(e); go('reset'); }} />
      )}
      {screen === 'reset' && (
        <ResetScreen email={resetEmail} onDone={() => {
          if (user) { setStack((s) => s.slice(0, -2)); showToast('Kata sandi diperbarui.'); } // dari Profil → kembali ke Profil
          else { replace('login'); showToast('Kata sandi diperbarui. Silakan masuk.'); }
        }} />
      )}
      {screen === 'home' && (
        <DashboardScreen user={user} groups={groups} onNavigate={tab} onSoon={soon} onOpenGroup={openGroup} onInvite={() => openInvite()}
          transactions={txs} onSetoran={() => openSetoran()} onKeluar={() => openPengeluaran()} />
      )}
      {screen === 'groups' && (
        <GroupListScreen groups={groups} onNavigate={tab} onCreate={() => setCreateOpen(true)} onOpenGroup={openGroup} onJoin={() => setJoinOpen(true)} />
      )}
      {screen === 'detail' && (
        <GroupDetailScreen group={groups.find((g) => g.id === selectedId)} onNavigate={tab} onSoon={soon} onInvite={openInvite} onStatus={openStatus} onRiwayat={openRiwayat}
          onSetoran={openSetoran} onSetoranSummary={openSetoranSummary} onPengeluaran={openPengeluaran} />
      )}
      {screen === 'setoran' && groups.length > 0 && (
        <SetoranScreen groups={groups} groupId={setoranGroupId} user={user} online={online} onChangeGroup={setSetoranGroupId}
          onNavigate={tab} onSave={onSaveSetoran} />
      )}
      {screen === 'setoranSum' && (
        <SetoranSummaryScreen group={groups.find((g) => g.id === setoranGroupId)} onNavigate={tab} onAdd={() => go('setoran')} />
      )}
      {screen === 'keluar' && groups.length > 0 && (
        <PengeluaranScreen groups={groups} groupId={keluarGroupId} user={user} onChangeGroup={setKeluarGroupId}
          onNavigate={tab} onSave={onSavePengeluaran} />
      )}
      {screen === 'status' && (
        <StatusScreen group={groups.find((g) => g.id === statusGroupId)} onNavigate={tab}
          onMember={openStatusMember} onUnpaid={() => go('statusLate')} />
      )}
      {screen === 'statusLate' && (
        <StatusLateScreen group={groups.find((g) => g.id === statusGroupId)} onNavigate={tab}
          onMember={openStatusMember} onRemind={askReminder} />
      )}
      {screen === 'statusMember' && (
        <StatusMemberScreen group={groups.find((g) => g.id === statusGroupId)} username={statusUser} onNavigate={tab}
          onRemind={askReminder} />
      )}
      {screen === 'riwayat' && (
        <RiwayatScreen group={groups.find((g) => g.id === riwayatGroupId)} user={user} initialTxId={riwayatTxId} online={online} onNavigate={tab} onToast={showToast}
          onKoreksi={openKoreksi} onDelete={onDeleteTx} />
      )}
      {screen === 'profile' && (
        <ProfilScreen user={user} queue={queue} online={online} onNavigate={tab} onEdit={() => soon('Edit Profil')}
          onSecurity={() => go('forgot')} onQueue={() => go('antrian')} onLogout={askLogout} />
      )}
      {screen === 'antrian' && <AntrianScreen queue={queue} online={online} onToggleOnline={changeOnline} onRetry={retryQueue} onNavigate={tab} />}
      {screen === 'notif' && <NotifikasiScreen notifs={notifs} onOpen={openNotif} onNavigate={tab} />}
      {screen === 'koreksi' && koreksiGroup && koreksiTx && (
        <KoreksiScreen key={koreksiTx.id} group={koreksiGroup} tx={koreksiTx} online={online} onNavigate={tab} onSave={onSaveKoreksi}
          onCancel={() => setStack((s) => s.slice(0, -1))} />
      )}
      <DialogModal visible={!!inviteNotif && inviteId !== null} icon={'\u2709\uFE0E'} title="Undangan Grup Keuangan" onClose={() => setInviteId(null)}
        lines={inviteNotif ? [
          `${inviteNotif.invite.from} mengundang kamu`, 'untuk bergabung ke grup:', inviteNotif.invite.groupName,
          `Kode ${inviteNotif.invite.code} · ${inviteNotif.invite.members.length} anggota aktif`,
        ] : []}
        primary={{ label: 'Terima', onPress: acceptInvite }} secondary={{ label: 'Tolak', onPress: declineInvite }} />
      <DialogModal visible={!!remind} icon="!" tone={c.amber} title="Kirim Pengingat Tagihan" onClose={() => setRemind(null)}
        lines={remind ? [`Kirim notifikasi pengingat ke ${reminderSummary(remind.people).to}`, `(Kurang bayar ${remind.people.length > 1 ? 'total ' : ''}${rupiah(reminderSummary(remind.people).total)})`] : []}
        primary={{ label: 'Kirim Notifikasi Pengingat', onPress: sendReminder }} secondary={{ label: 'Batal', onPress: () => setRemind(null) }} />
      <DialogModal visible={logoutAsk} icon="!" tone={c.amber} title="Ada Data Belum Terkirim" onClose={() => setLogoutAsk(false)}
        lines={[`${queueStats(queue).unsent} data masih di antrian offline.`, 'Jika keluar sekarang, data ini bisa hilang.']}
        primary={{ label: 'Kembali', onPress: () => setLogoutAsk(false) }} secondary={{ label: 'Tetap Keluar', onPress: doLogout }} />
      <CreateGroupModal visible={createOpen} groups={groups} onClose={() => setCreateOpen(false)} onCreate={onCreate} />
      <JoinGroupModal visible={joinOpen} onClose={() => setJoinOpen(false)} onJoin={onJoin} />
      <InviteModal visible={!!invite} groups={groups} groupId={invite?.groupId} onClose={() => setInvite(null)}
        onInvited={onInvited} />
      <AlertModal visible={!!alert} title={alert?.title} lines={alert?.lines} onClose={closeAlert} />
      <Toast message={toast.message} id={toast.id} />
    </View>
  );
}
