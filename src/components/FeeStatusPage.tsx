// FeeStatusPage.tsx
// Shared by StudentPortal and ParentPortal
// Shows fee groups, payment history, fines, with search

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, CheckCircle, AlertTriangle, Clock, CreditCard,
  ChevronDown, ChevronRight, Banknote, Receipt, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface FeeStatusPageProps {
  rollNo: number;
  studentName: string;
}

const PKR = (n: number | null | undefined) => `Rs ${(n ?? 0).toLocaleString('en-PK')}`;

export const FeeStatusPage: React.FC<FeeStatusPageProps> = ({ rollNo, studentName }) => {
  const [feeGroups,    setFeeGroups]    = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [violations,   setViolations]   = useState<any[]>([]);
  const [student,      setStudent]      = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [expanded,     setExpanded]     = useState<number | null>(null);
  const [activeTab,    setActiveTab]    = useState<'fees' | 'history' | 'fines'>('fees');

  useEffect(() => { loadAll(); }, [rollNo]);

  const loadAll = async () => {
    setLoading(true);
    const [fgRes, txRes, stuRes, vioRes] = await Promise.all([
      supabase.from('fee_groups').select('*').eq('student_roll', rollNo).order('due_date'),
      supabase.from('fee_transactions').select('*').eq('student_roll_link', String(rollNo)).order('payment_date', { ascending: false }),
      supabase.from('students').select('total_package, paid_amount').eq('roll_no', rollNo).single(),
      supabase.from('violations').select('*, disciplinary_rules(rule_name)').eq('entity_roll', String(rollNo)).order('created_at', { ascending: false }),
    ]);
    setFeeGroups(fgRes.data || []);
    setTransactions(txRes.data || []);
    setStudent(stuRes.data);
    setViolations(vioRes.data || []);
    setLoading(false);
  };

  const filtered = feeGroups.filter(g =>
    !search || g.fees_group?.toLowerCase().includes(search.toLowerCase()) || g.fees_code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount  = feeGroups.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPaid    = feeGroups.reduce((s, g) => s + (g.paid || 0), 0);
  const totalBalance = feeGroups.reduce((s, g) => s + (g.balance || 0), 0);
  const totalFines   = violations.filter(v => !v.is_paid).reduce((s, v) => s + (v.fine_amount || 0), 0);
  const paidCount    = feeGroups.filter(g => g.status === 'Paid').length;
  const paidPct      = feeGroups.length > 0 ? Math.round((paidCount / feeGroups.length) * 100) : 0;

  const TABS = [
    { id: 'fees',    label: 'Fee Groups',       count: feeGroups.length },
    { id: 'history', label: 'Payment History',  count: transactions.length },
    { id: 'fines',   label: 'Fines',            count: violations.length },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-[#2D3494] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { l: 'Total Package', v: PKR(totalAmount),   color: 'text-slate-900',   bg: 'bg-slate-50', icon: CreditCard },
          { l: 'Paid',          v: PKR(totalPaid),     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { l: 'Balance Due',   v: PKR(totalBalance),  color: 'text-rose-600',    bg: 'bg-rose-50',  icon: AlertTriangle },
          { l: 'Fines',         v: PKR(totalFines),    color: 'text-amber-600',   bg: 'bg-amber-50', icon: Clock },
        ].map(({ l, v, color, bg, icon: Icon }) => (
          <div key={l} className={cn('rounded-[2rem] p-5 border border-slate-100 shadow-sm', bg)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</p>
            </div>
            <p className={cn('text-xl font-black', color)}>{v}</p>
          </div>
        ))}
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-slate-800">Fee Clearance Progress</p>
          <p className="text-sm font-black text-[#2D3494]">{paidPct}%</p>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${paidPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: paidPct === 100 ? '#10b981' : 'linear-gradient(90deg,#1a3bcc,#2952e3)' }} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-[10px] text-slate-400 font-medium">{paidCount} of {feeGroups.length} fees cleared</p>
          <p className="text-[10px] font-black" style={{ color: totalBalance > 0 ? '#e11d48' : '#10b981' }}>
            {totalBalance > 0 ? `${PKR(totalBalance)} remaining` : 'Fully cleared ✓'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('flex-1 py-2.5 rounded-xl text-xs font-black transition-all',
              activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
            {t.label}
            {t.count > 0 && <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black', activeTab === t.id ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500')}>{t.count}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── FEE GROUPS ── */}
        {activeTab === 'fees' && (
          <motion.div key="fees" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fee type..."
                className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm" />
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-medium text-sm">No fee groups found</p>
              </div>
            ) : (
              filtered.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('bg-white rounded-[2rem] border overflow-hidden shadow-sm transition-all',
                    g.status === 'Paid' ? 'border-emerald-100' : g.status === 'Partial' ? 'border-amber-100' : 'border-slate-100')}>

                  {/* Row header */}
                  <button onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors">
                    {/* Status icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      g.status === 'Paid' ? 'bg-emerald-50' : g.status === 'Partial' ? 'bg-amber-50' : 'bg-rose-50')}>
                      {g.status === 'Paid'
                        ? <CheckCircle size={18} className="text-emerald-600" />
                        : g.status === 'Partial'
                        ? <Clock size={18} className="text-amber-600" />
                        : <AlertTriangle size={18} className="text-rose-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-800 text-sm">{g.fees_group}</p>
                        {g.fees_code && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{g.fees_code}</span>}
                        <span className={cn('text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-widest',
                          g.status === 'Paid' ? 'bg-emerald-50 text-emerald-700'
                            : g.status === 'Partial' ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700')}>
                          {g.status || 'Unpaid'}
                        </span>
                      </div>
                      {g.due_date && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Due: {new Date(g.due_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-slate-700">{PKR(g.amount)}</p>
                      {(g.balance || 0) > 0 && <p className="text-[10px] font-black text-rose-600">{PKR(g.balance)} due</p>}
                      {g.status === 'Paid'  && <p className="text-[10px] font-black text-emerald-600">Cleared ✓</p>}
                    </div>

                    <motion.div animate={{ rotate: expanded === g.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                    </motion.div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expanded === g.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 border-t border-slate-50">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            {[
                              { l: 'Total Amount',  v: PKR(g.amount),      c: 'text-slate-800' },
                              { l: 'Discount',      v: PKR(g.discount||0), c: 'text-blue-600' },
                              { l: 'Paid',          v: PKR(g.paid||0),     c: 'text-emerald-600' },
                              { l: 'Balance',       v: PKR(g.balance||0),  c: (g.balance||0) > 0 ? 'text-rose-600' : 'text-emerald-600' },
                            ].map(({ l, v, c }) => (
                              <div key={l} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                                <p className={cn('text-sm font-black', c)}>{v}</p>
                              </div>
                            ))}
                          </div>
                          {g.fine > 0 && (
                            <div className="mt-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100 flex items-center gap-2">
                              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                              <p className="text-xs font-bold text-amber-700">Late fine applied: {PKR(g.fine)}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── PAYMENT HISTORY ── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <Receipt size={32} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-sm">No payment history yet</p>
              </div>
            ) : (
              transactions.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-blue-100 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    {t.payment_method === 'Cash'
                      ? <Banknote size={18} className="text-emerald-600" />
                      : <CreditCard size={18} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-800 text-sm">{PKR(Number(t.amount_paid))}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t.payment_method}</span>
                      {t.receipt_serial && <span className="text-[9px] font-mono text-slate-400">{t.receipt_serial}</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(t.payment_date).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      {t.collected_by && ` · Received by ${t.collected_by}`}
                    </p>
                    {t.discount_amount > 0 && (
                      <p className="text-[10px] text-blue-600 font-bold mt-0.5">Discount applied: {PKR(t.discount_amount)} · Ref: {t.discount_reference || '—'}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                      <CheckCircle size={11} /> Locked
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── FINES ── */}
        {activeTab === 'fines' && (
          <motion.div key="fines" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {totalFines > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 flex items-center gap-4">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-black text-amber-800">Total Outstanding Fines</p>
                  <p className="text-xl font-black text-amber-600">{PKR(totalFines)}</p>
                </div>
              </div>
            )}
            {violations.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <CheckCircle size={32} className="text-emerald-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-sm">No fines or violations — keep it up! 🎉</p>
              </div>
            ) : (
              violations.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('bg-white rounded-[2rem] border shadow-sm p-5 flex items-center gap-4', v.is_paid ? 'border-slate-100' : 'border-rose-100')}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', v.is_paid ? 'bg-emerald-50' : 'bg-rose-50')}>
                    {v.is_paid ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">{(v.disciplinary_rules as any)?.rule_name || v.rule_key?.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {v.violation_date && new Date(v.violation_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {v.logged_by && ` · Logged by ${v.logged_by}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-black', v.is_paid ? 'text-slate-400' : 'text-rose-600')}>{PKR(v.fine_amount)}</p>
                    <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full', v.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                      {v.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};