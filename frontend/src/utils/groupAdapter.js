// Adapter data grup antara format backend MySQL dan format UI FinLife
import { GROUP_COLORS, initialsOf } from '../store';

const MEMBER_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444'];

/**
 * Normalisasi objek grup dari backend Express/MySQL agar kompatibel
 * dengan semua layar frontend (Dashboard, GroupList, GroupDetail, Status, Riwayat).
 */
export function adaptBackendGroup(bg) {
  if (!bg) return null;
  const name = bg.nama_grup || bg.name || 'Grup';
  const code = bg.kode_undangan || bg.code || 'GRP';
  const balance = parseFloat(
    bg.saldo_grup !== undefined
      ? bg.saldo_grup
      : bg.balance !== undefined
      ? bg.balance
      : 0
  );

  const colors = GROUP_COLORS || ['#00E676', '#00B0FF', '#FFD600', '#F59E0B', '#EC4899', '#8B5CF6'];
  const numId = parseInt(String(bg.id).replace(/\D/g, ''), 10) || 0;
  const color = bg.color || colors[numId % colors.length];

  // Susun daftar anggota (people)
  let people = [];
  if (Array.isArray(bg.members)) {
    people = bg.members.map((m, idx) => ({
      id: m.id_user || m.id,
      name: m.nama || m.name || m.username || 'Anggota',
      username: m.username || `user_${m.id}`,
      color: m.color || MEMBER_COLORS[idx % MEMBER_COLORS.length],
      setor: parseFloat(m.total_setoran || m.setor || 0),
      wajib: parseFloat(m.total_kewajiban || m.wajib || 0),
      n: m.n || 0,
      peran: m.peran || 'anggota',
    }));
  } else if (Array.isArray(bg.people)) {
    people = bg.people;
  }

  const unpaid = people.filter((p) => (p.setor || 0) < (p.wajib || 0)).length;

  return {
    id: String(bg.id),
    name,
    nama_grup: name,
    code,
    kode_undangan: code,
    balance,
    saldo_grup: balance,
    color,
    initials: bg.initials || (initialsOf ? initialsOf(name) : name.slice(0, 2).toUpperCase()),
    admin: bg.admin || bg.id_pembuat,
    people,
    members: people.length || (typeof bg.members === 'number' ? bg.members : 1),
    unpaid,
    expenses: bg.expenses || [],
    history: bg.history || [],
  };
}
