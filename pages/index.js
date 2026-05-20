import { useState, useEffect } from "react";
import Link from "next/link";
import { Geist } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"] });

// Helper: Dapatkan awal minggu (Minggu jam 00:00) dari suatu tanggal
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Minggu, 1 = Senin, ...
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Dapatkan akhir minggu (Sabtu jam 23:59:59)
function getWeekEnd(date) {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Helper: Apakah suatu tanggal berada di minggu yang sama dengan "sekarang"?
function isThisWeek(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  return date >= weekStart && date <= weekEnd;
}

// Helper: Dapatkan minggu kemarin (minggu sebelumnya)
function isLastWeek(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const weekStart = getWeekStart(lastWeekDate);
  const weekEnd = getWeekEnd(lastWeekDate);
  return date >= weekStart && date <= weekEnd;
}

export default function Home() {
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExpenses() {
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
      } catch (err) {
        setError("Gagal terhubung ke API. Menampilkan data cadangan lokal.");
        const stored = localStorage.getItem("catatan_keuangan");
        if (stored) setAllExpenses(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  const formatToRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // Hanya data minggu ini
  const thisWeekExpenses = allExpenses.filter((item) => isThisWeek(item.tanggal));
  // Data minggu lalu (untuk perbandingan)
  const lastWeekExpenses = allExpenses.filter((item) => isLastWeek(item.tanggal));

  const totalMingguIni = thisWeekExpenses.reduce((acc, cur) => acc + Number(cur.harga), 0);
  const totalMingguLalu = lastWeekExpenses.reduce((acc, cur) => acc + Number(cur.harga), 0);
  const selisih = totalMingguIni - totalMingguLalu;

  const totalKebutuhan = thisWeekExpenses
    .filter((i) => i.kategori === "kebutuhan")
    .reduce((acc, cur) => acc + Number(cur.harga), 0);
  const totalKeinginan = thisWeekExpenses
    .filter((i) => i.kategori === "keinginan")
    .reduce((acc, cur) => acc + Number(cur.harga), 0);

  const filteredExpenses = thisWeekExpenses.filter((item) => {
    if (filter === "semua") return true;
    return item.kategori === filter;
  });

  // Label rentang minggu ini
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const weekLabel = `${weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className={`${geistSans.className} min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}>
      {/* Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Catatan Keuangan</h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Minggu Ini · {weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/rekap" legacyBehavior>
              <a className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Rekap
              </a>
            </Link>
            <Link href="/tambah" legacyBehavior>
              <a className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-95">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-start rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            <svg className="mr-2.5 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1"><span className="font-semibold block mb-0.5">Pemberitahuan API:</span>{error}</div>
          </div>
        )}

        {/* Kartu Ringkasan */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Minggu Ini */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-zinc-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              Total Minggu Ini
            </span>
            <div className="mt-2">
              <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
                {loading ? "..." : formatToRupiah(totalMingguIni)}
              </span>
            </div>
            {!loading && (
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${selisih > 0 ? "text-rose-500" : selisih < 0 ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                {selisih > 0 ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                ) : selisih < 0 ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-400"></span>
                )}
                {selisih === 0
                  ? "Sama dengan minggu lalu"
                  : `${selisih > 0 ? "+" : ""}${formatToRupiah(Math.abs(selisih))} vs minggu lalu`}
              </div>
            )}
          </div>

          {/* Total Kebutuhan */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Kebutuhan</span>
            <div className="mt-2">
              <span className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 md:text-3xl">
                {loading ? "..." : formatToRupiah(totalKebutuhan)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              Primer & mendesak minggu ini
            </div>
          </div>

          {/* Total Keinginan */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Keinginan</span>
            <div className="mt-2">
              <span className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 md:text-3xl">
                {loading ? "..." : formatToRupiah(totalKeinginan)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
              Tersier & hiburan minggu ini
            </div>
          </div>
        </section>

        {/* Tabel Transaksi Minggu Ini */}
        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Pengeluaran Minggu Ini</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{weekLabel} · Reset otomatis setiap Minggu 00:00</p>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 self-start rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:self-center">
              {["semua", "kebutuhan", "keinginan"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    filter === f
                      ? f === "semua" ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-sm"
                      : f === "kebutuhan" ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-indigo-500 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">Belum Ada Pengeluaran Minggu Ini</h3>
                <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
                  {filter === "semua" ? "Minggu yang hemat! Mulai catat jika ada pengeluaran baru." : `Tidak ada pengeluaran "${filter}" minggu ini.`}
                </p>
                {filter === "semua" && (
                  <Link href="/tambah" legacyBehavior>
                    <a className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95 dark:bg-indigo-950/40 dark:text-indigo-400">
                      Catat Pengeluaran
                    </a>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400">
                      <th className="px-6 py-4 text-center">No</th>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Nama Barang</th>
                      <th className="px-6 py-4 text-center">Kategori</th>
                      <th className="px-6 py-4 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 text-sm">
                    {filteredExpenses.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-zinc-50/50 transition-colors dark:hover:bg-zinc-800/20">
                        <td className="px-6 py-4 text-center font-medium text-zinc-400 dark:text-zinc-500">{item.no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                          {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{item.nama_barang}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {item.kategori === "kebutuhan" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Kebutuhan</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">Keinginan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                          {formatToRupiah(Number(item.harga))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
