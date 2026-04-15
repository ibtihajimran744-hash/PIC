import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, Star, Zap, Medal, Crown, Shield } from 'lucide-react';
import { supabase } from '../services/supabase';
import { cn } from '../lib/utils';

interface LeaderEntry {
  roll_no: number;
  full_name: string;
  class_section: string;
  total_xp: number;
  current_badge: string;
  gender: string;
}

const BADGE_COLOR: Record<string, string> = {
  '🏆 Legend':    'from-yellow-400 to-amber-500',
  '💎 Elite':     'from-cyan-400 to-blue-500',
  '🥇 Champion':  'from-violet-400 to-purple-500',
  '🥈 Scholar':   'from-slate-300 to-slate-400',
  '🥉 Newcomer':  'from-orange-300 to-amber-400',
};

const RANK_STYLE = (rank: number) => {
  if (rank === 1) return { bg: 'bg-amber-400',   text: 'text-white', glow: 'shadow-amber-200' };
  if (rank === 2) return { bg: 'bg-slate-300',    text: 'text-white', glow: 'shadow-slate-200' };
  if (rank === 3) return { bg: 'bg-orange-400',   text: 'text-white', glow: 'shadow-orange-200' };
  return           { bg: 'bg-slate-100',           text: 'text-slate-500', glow: '' };
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={14} className="text-amber-500" />;
  if (rank === 2) return <Medal size={14} className="text-slate-400" />;
  if (rank === 3) return <Medal size={14} className="text-orange-400" />;
  return <span className="text-xs font-black text-slate-400">#{rank}</span>;
};

// Top-3 podium card
const PodiumCard = ({ entry, rank }: { entry: LeaderEntry; rank: number }) => {
  const heights = ['h-28', 'h-20', 'h-16'];
  const sizes   = ['w-16 h-16', 'w-14 h-14', 'w-12 h-12'];
  const labels  = ['1st', '2nd', '3rd'];
  const crowns  = ['text-amber-400', 'text-slate-400', 'text-orange-400'];
  const order   = [1, 0, 2]; // center = 1st, left = 2nd, right = 3rd
  const pos     = rank - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: pos * 0.1 }}
      className="flex flex-col items-center gap-1.5"
      style={{ order: order[pos] }}
    >
      {/* Crown */}
      {rank === 1 && <Crown size={20} className="text-amber-400 mb-1" />}

      {/* Avatar */}
      <div className={cn(
        'rounded-full flex items-center justify-center font-black text-white shadow-lg border-4',
        sizes[pos],
        rank === 1 ? 'border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500 text-lg' :
        rank === 2 ? 'border-slate-300 bg-gradient-to-br from-slate-400 to-slate-500' :
                    'border-orange-400 bg-gradient-to-br from-orange-400 to-amber-500'
      )}>
        {entry.full_name.charAt(0)}
      </div>

      {/* Name */}
      <p className={cn(
        'font-black text-slate-900 text-center leading-tight',
        rank === 1 ? 'text-sm' : 'text-xs'
      )} style={{ maxWidth: 80 }}>
        {entry.full_name.split(' ')[0]}
      </p>

      {/* XP */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full px-2 py-0.5 shadow-sm">
        <Zap size={10} className="text-amber-500" />
        <span className="text-[10px] font-black text-slate-700">{entry.total_xp} XP</span>
      </div>

      {/* Podium base */}
      <div className={cn(
        'w-full rounded-t-xl flex items-center justify-center text-white font-black text-sm mt-1 min-w-[64px]',
        heights[pos],
        rank === 1 ? 'bg-gradient-to-b from-amber-400 to-amber-500' :
        rank === 2 ? 'bg-gradient-to-b from-slate-300 to-slate-400' :
                    'bg-gradient-to-b from-orange-400 to-orange-500'
      )}>
        {labels[pos]}
      </div>
    </motion.div>
  );
};

export const Leaderboard: React.FC<{ currentRollNo?: number }> = ({ currentRollNo }) => {
  const [entries,   setEntries]   = useState<LeaderEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all' | 'class'>('all');
  const [myEntry,   setMyEntry]   = useState<{ rank: number; entry: LeaderEntry } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('students')
        .select('roll_no, full_name, class_section, total_xp, current_badge, gender')
        .eq('status', 'Active')
        .order('total_xp', { ascending: false });

      const list = (data || []) as LeaderEntry[];
      setEntries(list);

      if (currentRollNo) {
        const idx = list.findIndex(e => e.roll_no === currentRollNo);
        if (idx !== -1) setMyEntry({ rank: idx + 1, entry: list[idx] });
      }
      setLoading(false);
    };
    load();
  }, [currentRollNo]);

  const filtered = entries.filter(e =>
    !search ||
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    String(e.roll_no).includes(search) ||
    e.class_section?.toLowerCase().includes(search.toLowerCase())
  );

  const top3   = filtered.slice(0, 3);
  const rest   = filtered.slice(3);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
          <Trophy size={20} className="text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Campus Leaderboard</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time XP rankings</p>
        </div>
      </div>

      {/* My rank strip (if logged in student) */}
      {myEntry && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#2D3494] rounded-2xl px-4 py-3 text-white">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
            {myEntry.entry.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate">You · {myEntry.entry.full_name.split(' ')[0]}</p>
            <p className="text-[10px] text-white/60 font-bold">{myEntry.entry.class_section}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-black">#{myEntry.rank}</p>
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-amber-300" />
              <p className="text-[10px] font-black text-amber-300">{myEntry.entry.total_xp} XP</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-[#2D3494] rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading rankings...</p>
        </div>
      ) : (
        <>
          {/* ── PODIUM (top 3) ── */}
          {!search && top3.length >= 3 && (
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 p-4 pb-0 overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">🏆 Top Performers</p>
              <div className="flex items-end justify-center gap-3">
                {top3.map((e, i) => (
                  <PodiumCard key={e.roll_no} entry={e} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* ── RANK LIST ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Column headers */}
            <div className="grid gap-2 px-4 py-3 border-b border-slate-50 bg-slate-50/80"
              style={{ gridTemplateColumns: '40px 1fr auto' }}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rank</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">XP / Badge</p>
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((entry, i) => {
                const rank   = entries.findIndex(e => e.roll_no === entry.roll_no) + 1;
                const rs     = RANK_STYLE(rank);
                const isMe   = entry.roll_no === currentRollNo;
                const badgeGradient = BADGE_COLOR[entry.current_badge] || 'from-slate-300 to-slate-400';

                return (
                  <motion.div
                    key={entry.roll_no}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={cn(
                      'grid gap-3 px-4 py-3.5 items-center transition-colors',
                      isMe ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'
                    )}
                    style={{ gridTemplateColumns: '40px 1fr auto' }}
                  >
                    {/* Rank badge */}
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0',
                      rs.bg, rs.glow && `shadow-md ${rs.glow}`
                    )}>
                      {rank <= 3
                        ? <RankIcon rank={rank} />
                        : <span className={cn('text-[11px] font-black', rs.text)}>{rank}</span>
                      }
                    </div>

                    {/* Student info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn(
                          'text-sm font-black truncate',
                          isMe ? 'text-[#2D3494]' : 'text-slate-900'
                        )}>
                          {entry.full_name}
                          {isMe && <span className="ml-1 text-[9px] text-[#2D3494] font-black">(you)</span>}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                        {entry.class_section} · #{entry.roll_no}
                      </p>
                    </div>

                    {/* XP + Badge — RIGHT SIDE — always visible */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* XP pill */}
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                        <Zap size={10} className="text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] font-black text-amber-700 whitespace-nowrap">
                          {(entry.total_xp || 0).toLocaleString()} XP
                        </span>
                      </div>

                      {/* Badge pill */}
                      <div className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 bg-gradient-to-r text-white',
                        badgeGradient
                      )}>
                        <span className="text-[10px] font-black whitespace-nowrap leading-none">
                          {entry.current_badge || '🥉 Newcomer'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-medium text-sm">No students found</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            {entries.length} active students ranked
          </p>
        </>
      )}
    </div>
  );
};