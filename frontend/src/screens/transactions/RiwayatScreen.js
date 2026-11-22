import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import TxDetailSheet from '../../components/TxDetailSheet';
import { canEditTx, dateLabel, dayMonth, firstName, historyList, personName, validateHapus } from '../../store';
import { c, PAD, rupiah } from '../../theme';

// 09 — Riwayat transaksi · 09b — filter Setoran (dan Pengeluaran) · 09c — detail transaksi (pencatat)
// Ketuk transaksi → sheet detail: 09c bila kamu pencatatnya/admin (Ubah Data → 09d, Hapus → 09e), selain itu 09f (read-only).
const FILTERS = [['all', 'Semua'], ['in', 'Setoran'], ['out', 'Pengeluaran']];
const GRAY = '#6B7280';

export default function RiwayatScreen({ group, user, initialTxId, online = true, onNavigate, onToast, onKoreksi, onDelete }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const [filter, setFilter] = useState('all');
  const [selId, setSelId] = useState(initialTxId ?? null); // transaksi yang dibuka di 09c/09f (bisa langsung dari Notifikasi)
  const [open, setOpen] = useState(!!initialTxId);
  const [confirmId, setConfirmId] = useState(null); // 09e
  if (!group) return null;

  const list = historyList(group, filter);
  const sel = (group.history || []).find((t) => t.id === selId);

  const editable = !!sel && canEditTx(sel, user, group);

  const onRow = (t) => {
    if (t.deleted) return; // jejak audit: tidak bisa dibuka
    setSelId(t.id);
    setOpen(true);
  };
  // Ubah Data → 09d
  const edit = () => {
    if (!online) { setOpen(false); return onToast('Kamu sedang offline. Koreksi hanya dapat dilakukan saat online.'); }
    setOpen(false); onKoreksi(group, sel);
  };
  // Hapus → 09e. Tutup sheet dulu; konfirmasi dibuka setelah animasi tutup selesai (dua Modal tidak boleh tumpang tindih di iOS).
  const askDelete = () => {
    const err = !online ? 'Kamu sedang offline. Hapus transaksi hanya dapat dilakukan saat online.' : validateHapus(group, sel);
    setOpen(false);
    if (err) return onToast(err);
    const id = sel.id;
    setTimeout(() => setConfirmId(id), 300);
  };
  const doDelete = () => {
    const t = (group.history || []).find((x) => x.id === confirmId);
    setConfirmId(null);
    if (t) onDelete(group, t);
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Riwayat transaksi</Text>
        <Text style={s.sub}>Log kronologis setoran & pengeluaran grup {group.name}.</Text>

        <View style={s.chips}>
          {FILTERS.map(([k, label]) => {
            const on = filter === k;
            return (
              <Pressable key={k} onPress={() => setFilter(k)} accessibilityRole="button"
                accessibilityState={{ selected: on }} accessibilityLabel={`Filter ${label}`}
                style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipTxt, on && s.chipTxtOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {list.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Belum ada transaksi</Text>
            <Text style={s.emptySub}>
              {filter === 'all' ? 'Setoran dan pengeluaran yang dicatat akan muncul di sini.'
                : filter === 'in' ? 'Belum ada setoran tercatat di grup ini.' : 'Belum ada pengeluaran tercatat di grup ini.'}
            </Text>
          </View>
        )}

        {list.map((t) => {
          const out = t.kind === 'out';
          const del = !!t.deleted;
          const col = del ? GRAY : out ? c.red : c.green;
          const who = firstName(personName(group, t.by));
          return (
            <Pressable key={t.id} onPress={() => onRow(t)} disabled={del} accessibilityRole={del ? 'text' : 'button'}
              accessibilityLabel={`${t.title}, ${out ? 'pengeluaran' : 'setoran'} ${rupiah(t.amount)}${del ? ', dihapus' : ''}`}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
              <View style={[s.ic, { backgroundColor: col + '33' }]}>
                <Text style={[s.icTxt, { color: del ? c.mute : col }]}>{del ? '✕' : out ? '↑' : '↓'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, del && { color: c.mute }]} numberOfLines={1}>{t.title}</Text>
                {del ? (
                  <Text style={[s.meta, { color: c.red }]} numberOfLines={1}>
                    Dihapus oleh {firstName(personName(group, t.deleted.by))} · {dayMonth(t.deleted.at)}
                  </Text>
                ) : (
                  <Text style={s.meta} numberOfLines={1}>{dateLabel(t.at)} · Oleh {who}</Text>
                )}
              </View>
              <View style={s.right}>
                <Text style={[s.amt, { color: del ? c.mute : col }]}>{del ? '' : out ? '-' : '+'}{rupiah(t.amount)}</Text>
                {!!t.edited && !del && (
                  <View style={s.badge}><Text style={s.badgeTxt}>Diedit</Text></View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <TxDetailSheet visible={open} tx={sel} group={group} readOnly={!editable} onClose={() => setOpen(false)}
        onEdit={edit} onDelete={askDelete} />
      <ConfirmDeleteModal visible={!!confirmId} onCancel={() => setConfirmId(null)} onConfirm={doDelete} />
      <BottomNav active="groups" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 14 },
  chip: { flex: 1, maxWidth: 100, height: 32, borderRadius: 16, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: c.green },
  chipTxt: { color: c.mute, fontSize: 12, fontWeight: '700' },
  chipTxtOn: { color: '#000' },
  row: { minHeight: 62, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, gap: 12 },
  ic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icTxt: { fontSize: 16 },
  title: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  amt: { fontSize: 14, fontWeight: '700' },
  badge: { marginTop: 4, height: 16, minWidth: 52, paddingHorizontal: 8, borderRadius: 8, backgroundColor: c.amber + '33', alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: c.amber, fontSize: 10, fontWeight: '700' },
  empty: { borderRadius: 12, backgroundColor: c.card, padding: 20, alignItems: 'center' },
  emptyTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  emptySub: { color: c.mute, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
