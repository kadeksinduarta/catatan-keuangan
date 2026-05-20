import { useState, useEffect } from "react";
import Link from "next/link";
import { Geist } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"] });

// Helper: Dapatkan awal minggu (Minggu jam 00:00)
function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Dapatkan key unik minggu dalam format "YYYY-Wmm"
function getWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const ws = getWeekStart(d);
  const year = ws.getFullYear();
  // Hitung week number berdasarkan hari pertama tahun
  const startOfYear = new Date(year, 0, 1);
  const diff = ws - startOfYear;
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

// Helper: Label minggu yang mudah dibaca
function getWeekLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const ws = getWeekStart(d);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const opts = { day: "numeric", month: "short" };
  return `${ws.toLocaleDateString("id-ID", opts)} – ${we.toLocaleDateString("id-ID", { ...opts, year: "numeric" })}`;
}

// Apakah minggu ini?
function isCurrentWeek(dateStr) {
  return getWeekKey(dateStr) === getWeekKey(new Date().toISOString().split("T")[0]);
}

export default function Rekap() {
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/expenses");
        const data = await res.json();
        if (data.success && Array.isArray(data.expenses)) {
          setAllExpenses(data.expenses);
        } else {
          if (data.error) setError(data.error);
          const stored = localStorage.getItem("catatan_keuangan");
          if (stored) setAllExpenses(JSON.parse(stored));
        }
      } catch {
        setError("Gagal terhubung ke API.");
        const stored = localStorage.getItem("catatan_keuangan");
        if (stored) setAllExpenses(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatToRupiah = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

  // Kelompokkan data per minggu
  const weeklyMap = {};
  allExpenses.forEach((item) => {
    const key = getWeekKey(item.tanggal);
    if (!weeklyMap[key]) {
      weeklyMap[key] = { key, label: getWeekLabel(item.tanggal), total: 0, kebutuhan: 0, keinginan: 0, count: 0, isCurrent: isCurrentWeek(item.tanggal), sampleDate: item.tanggal };
    }
    weeklyMap[key].total += Number(item.harga);
    weeklyMap[key].count += 1;
    if (item.kategori === "kebutuhan") weeklyMap[key].kebutuhan += Number(item.harga);
    else weeklyMap[key].keinginan += Number(item.harga);
  });

  // Urutkan dari terbaru ke terlama
  const weeks = Object.values(weeklyMap).sort((a, b) => b.key.localeCompare(a.key));

  // Statistik
  const grandTotal = weeks.reduce((acc, w) => acc + w.total, 0);
  const highestWeek = weeks.length > 0 ? weeks.reduce((max, w) => (w.total > max.total ? w : max), weeks[0]) : null;
  const lowestWeek = weeks.length > 0 ? weeks.reduce((min, w) => (w.total < min.total ? w : min), weeks[0]) : null;
  const maxTotal = highestWeek ? highestWeek.total : 1;

  return (
    <div className={`${geistSans.className} min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}>
      {/* Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" legacyBehavior>
              <a className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Rekapitulasi Mingguan</h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Perbandingan pengeluaran antar minggu</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-start rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            <svg className="mr-2.5 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : weeks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold">Belum Ada Data</h3>
            <p className="mt-1 text-xs text-zinc-400">Mulai catat pengeluaran untuk melihat rekapitulasi.</p>
          </div>
        ) : (
          <>
            {/* Statistik Ringkasan */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              {/* Grand Total */}
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Semua Minggu</span>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{formatToRupiah(grandTotal)}</span>
                </div>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{weeks.length} minggu tercatat</div>
              </div>

              {/* Minggu Terboros */}
              {highestWeek && (
                <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm dark:border-rose-900/40 dark:from-rose-950/20 dark:to-zinc-900">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                    <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                    Pengeluaran Tertinggi
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{formatToRupiah(highestWeek.total)}</span>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{highestWeek.label}</div>
                </div>
              )}

              {/* Minggu Terhemat */}
              {lowestWeek && (
                <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-zinc-900">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                    <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    Pengeluaran Terendah
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{formatToRupiah(lowestWeek.total)}</span>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{lowestWeek.label}</div>
                </div>
              )}
            </section>

            {/* Daftar Minggu dengan Bar Chart */}
            <section>
              <h2 className="text-lg font-bold tracking-tight mb-1">Riwayat Per Minggu</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">Diurutkan dari minggu terbaru</p>

              <div className="space-y-3">
                {weeks.map((week, idx) => {
                  const barWidth = maxTotal > 0 ? Math.max((week.total / maxTotal) * 100, 4) : 4;
                  const prevWeek = weeks[idx + 1];
                  const diff = prevWeek ? week.total - prevWeek.total : null;

                  return (
                    <div
                      key={week.key}
                      className={`rounded-2xl border p-5 transition-all ${
                        week.isCurrent
                          ? "border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-950/20"
                          : week === highestWeek
                          ? "border-rose-200/80 bg-rose-50/20 dark:border-rose-900/30 dark:bg-rose-950/10"
                          : week === lowestWeek
                          ? "border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/30 dark:bg-emerald-950/10"
                          : "border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{week.label}</span>
                          {week.isCurrent && (
                            <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">Minggu Ini</span>
                          )}
                          {week === highestWeek && !week.isCurrent && (
                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">Tertinggi</span>
                          )}
                          {week === lowestWeek && !week.isCurrent && weeks.length > 1 && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">Terendah</span>
                          )}
                        </div>
                        <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">{formatToRupiah(week.total)}</span>
                      </div>

                      {/* Bar Progress */}
                      <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            week === highestWeek
                              ? "bg-gradient-to-r from-rose-400 to-rose-500"
                              : week === lowestWeek && weeks.length > 1
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : "bg-gradient-to-r from-indigo-400 to-indigo-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>

                      {/* Detail */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                            Kebutuhan: {formatToRupiah(week.kebutuhan)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
                            Keinginan: {formatToRupiah(week.keinginan)}
                          </span>
                          <span>{week.count} transaksi</span>
                        </div>
                        {diff !== null && (
                          <span className={`font-medium ${diff > 0 ? "text-rose-500" : diff < 0 ? "text-emerald-500" : "text-zinc-400"}`}>
                            {diff > 0 ? "+" : ""}{formatToRupiah(Math.abs(diff))} vs sebelumnya
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
