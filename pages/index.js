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

// Helper component: OverviewCard
function OverviewCard({ title, value, icon, gradient, loading }) {
  return (
    <div className={`relative h-32 rounded-[28px] ${gradient} text-white overflow-hidden shadow-md`}>
      {/* Folder Tab Glass Overlay */}
      <div 
        className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/10"
        style={{ clipPath: "polygon(0 38%, 44% 38%, 52% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      
      {/* Exposed Tab Area Content (Top Left) */}
      <div className="absolute top-2.5 left-3.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">{title}</span>
      </div>

      {/* Main Glass Content Area */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] px-4 pb-3.5 flex flex-col justify-end pointer-events-none">
        <span className="text-lg font-black tracking-tight leading-none">
          {loading ? "..." : value}
        </span>
      </div>
    </div>
  );
}

export default function Home({ onLogout }) {
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
    <div className={`${geistSans.className} min-h-screen bg-zinc-50/50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 pb-12`}>
      {/* Navbar */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/profile.jpg"
              alt="Profile"
              className="h-12 w-12 rounded-full object-cover border border-zinc-200 shadow-sm"
            />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Selamat Pagi, Sindu</h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Minggu Ini · {weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Rekap Button */}
            <Link href="/rekap" legacyBehavior>
              <a className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer shadow-sm h-10">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Rekap
              </a>
            </Link>

            {/* Tambah Pengeluaran Button */}
            <Link href="/tambah" legacyBehavior>
              <a className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-95 h-10">
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

        {/* Activity Overview Section */}
        <section>
          <h2 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Activity Overview</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <OverviewCard
              title="Total Pengeluaran"
              value={formatToRupiah(totalMingguIni)}
              gradient="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/10"
              loading={loading}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <OverviewCard
              title="Kebutuhan"
              value={formatToRupiah(totalKebutuhan)}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/10"
              loading={loading}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" />
                </svg>
              }
            />
            <OverviewCard
              title="Keinginan"
              value={formatToRupiah(totalKeinginan)}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/10"
              loading={loading}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.373-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <OverviewCard
              title="Transaksi"
              value={`${thisWeekExpenses.length} Transaksi`}
              gradient="bg-gradient-to-br from-pink-500 to-rose-600 shadow-rose-500/10"
              loading={loading}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Riwayat Pengeluaran (Daftar Transaksi) */}
        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Riwayat Pengeluaran</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Menampilkan pengeluaran dalam minggu ini</p>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 self-start rounded-full border border-zinc-200/80 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:self-center">
              {["semua", "kebutuhan", "keinginan"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    filter === f
                      ? f === "semua" ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-sm"
                      : f === "kebutuhan" ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-indigo-500 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-zinc-200/60 bg-white px-4 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-7 w-7 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-bold text-zinc-900 dark:text-zinc-50">Belum Ada Pengeluaran</h3>
                <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
                  {filter === "semua" ? "Minggu yang hemat! Mulai catat jika ada pengeluaran baru." : `Tidak ada pengeluaran "${filter}" minggu ini.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((item, index) => {
                  const isKebutuhan = item.kategori === "kebutuhan";
                  return (
                    <div 
                      key={item.id || index}
                      className="flex items-center justify-between rounded-[22px] border border-zinc-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon Box */}
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          isKebutuhan 
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                            : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                        }`}>
                          {isKebutuhan ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{item.nama_barang}</h3>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · <span className="capitalize">{item.kategori}</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Price Pill */}
                      <div className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow-sm ${
                        isKebutuhan 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                      }`}>
                        {formatToRupiah(Number(item.harga))}
                      </div>
                    </div>
                  );
                })}

                {/* See All link */}
                <div className="pt-2 text-center">
                  <Link href="/rekap" legacyBehavior>
                    <a className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Lihat Semua Rekap
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Logout (Bottom Card) */}
        <section className="mt-8">
          <button
            onClick={onLogout}
            className="w-full mt-3 flex items-center justify-between rounded-3xl border border-rose-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-rose-900/30 dark:bg-zinc-900 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center gap-4 z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Keluar dari Akun
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Kunci kembali aplikasi dan kembali ke halaman login.
                </p>
              </div>
            </div>
            
            <div className="text-zinc-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors z-10">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
