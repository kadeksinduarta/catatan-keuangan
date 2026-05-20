import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Geist } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
});

export default function TambahPengeluaran({ onLogout }) {
  const router = useRouter();

  // Form State
  const [tanggal, setTanggal] = useState("");
  const [no, setNo] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [hargaRaw, setHargaRaw] = useState(""); // Nilai angka murni dalam bentuk string
  const [kategori, setKategori] = useState("kebutuhan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNo, setLoadingNo] = useState(true);

  // Set default tanggal ke hari ini dan ambil No urut otomatis saat komponen dimuat
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTanggal(today);

    async function fetchAutoIncrementNo() {
      try {
        const res = await fetch("/api/expenses");
        const data = await res.json();
        
        if (data.success && Array.isArray(data.expenses)) {
          // No urut adalah total transaksi + 1
          const nextNo = data.expenses.length + 1;
          setNo(nextNo.toString());
        } else {
          // Jika API gagal (misal 401), gunakan fallback localStorage agar aplikasi tidak macet
          console.warn("Menggunakan fallback localStorage untuk nomor urut otomatis...");
          const localData = JSON.parse(localStorage.getItem("catatan_keuangan") || "[]");
          setNo((localData.length + 1).toString());
          if (data.error) {
            setError(data.error);
          }
        }
      } catch (err) {
        console.error("Gagal mendapatkan nomor urut otomatis:", err);
        // Fallback
        const localData = JSON.parse(localStorage.getItem("catatan_keuangan") || "[]");
        setNo((localData.length + 1).toString());
        setError("Gagal terhubung ke Google Sheets. Menggunakan basis nomor lokal sementara.");
      } finally {
        setLoadingNo(false);
      }
    }

    fetchAutoIncrementNo();
  }, []);

  // Format ke Rupiah
  const formatToRupiah = (value) => {
    if (!value) return "";
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(clean));
  };

  const handleHargaChange = (e) => {
    const val = e.target.value;
    const numericVal = val.replace(/[^0-9]/g, "");
    setHargaRaw(numericVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validasi
    if (!tanggal) { setLoading(false); return setError("Tanggal pengeluaran wajib diisi."); }
    if (!no) { setLoading(false); return setError("Nomor transaksi belum terhitung."); }
    if (!namaBarang.trim()) { setLoading(false); return setError("Nama barang wajib diisi."); }
    if (!hargaRaw) { setLoading(false); return setError("Harga barang wajib diisi."); }
    if (!kategori) { setLoading(false); return setError("Kategori wajib dipilih."); }

    const newExpense = {
      tanggal,
      no: parseInt(no, 10),
      nama_barang: namaBarang.trim(),
      harga: parseInt(hargaRaw, 10),
      kategori,
    };

    try {
      // 1. Simpan ke Google Sheets melalui Proxy API Route
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirim data ke Google Sheets");
      }

      // 2. Simpan juga ke localStorage sebagai cadangan lokal (Local Cache)
      const localData = JSON.parse(localStorage.getItem("catatan_keuangan") || "[]");
      localData.push({ ...newExpense, id: Date.now().toString() });
      localData.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.no - a.no);
      localStorage.setItem("catatan_keuangan", JSON.stringify(localData));

      // Redirect kembali ke halaman utama
      router.push("/");
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err.message || "Gagal menyimpan pengeluaran. Harap periksa koneksi internet atau konfigurasi hak akses Google Apps Script."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${geistSans.className} min-h-screen bg-zinc-50/50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 pb-12`}>
      {/* Header */}
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
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Tambah Pengeluaran</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Dashboard Button */}
            <Link href="/" legacyBehavior>
              <a className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer shadow-sm h-10">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </a>
            </Link>

            {/* Rekap Button */}
            <Link href="/rekap" legacyBehavior>
              <a className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer shadow-sm h-10">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Rekap
              </a>
            </Link>

            {/* Tambah Button (Primary, Active/Disabled since we are on it) */}
            <Link href="/tambah" legacyBehavior>
              <a className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-95 h-10 opacity-60 cursor-default">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-start rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
            <svg className="mr-3 mt-0.5 inline h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 md:p-10">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              Form Transaksi
            </span>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Isi detail pengeluaran belanja Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Baris Pertama: Tanggal dan No */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="tanggal" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Tanggal
                </label>
                <input
                  type="date"
                  id="tanggal"
                  name="tanggal"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950/50"
                  required
                />
              </div>

              <div>
                <label htmlFor="no" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  No. Transaksi (Otomatis)
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    id="no"
                    name="no"
                    value={loadingNo ? "Mengitung..." : no}
                    readOnly
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-zinc-400 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-500"
                    required
                  />
                  {loadingNo && (
                    <div className="absolute right-3 top-3.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nama Barang */}
            <div>
              <label htmlFor="nama_barang" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nama Barang
              </label>
              <input
                type="text"
                id="nama_barang"
                name="nama_barang"
                value={namaBarang}
                placeholder="e.g. Kopi Susu, Listrik, Buku"
                onChange={(e) => setNamaBarang(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950/50"
                required
              />
            </div>

            {/* Harga */}
            <div>
              <label htmlFor="harga" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Harga
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  id="harga"
                  name="harga"
                  value={formatToRupiah(hargaRaw)}
                  placeholder="Rp 0"
                  onChange={handleHargaChange}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-semibold text-zinc-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950/50"
                  required
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Kategori
              </label>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setKategori("kebutuhan")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                    kategori === "kebutuhan"
                      ? "border-emerald-500 bg-emerald-50/40 text-emerald-700 shadow-md ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${kategori === "kebutuhan" ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-zinc-950" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"} transition-all`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="mt-2 text-sm font-semibold">Kebutuhan</span>
                  <span className="mt-0.5 text-[10px] opacity-75">Primer & Mendesak</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori("keinginan")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                    kategori === "keinginan"
                      ? "border-indigo-500 bg-indigo-50/40 text-indigo-700 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-indigo-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${kategori === "keinginan" ? "bg-indigo-500 text-white dark:bg-indigo-400 dark:text-zinc-950" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"} transition-all`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="mt-2 text-sm font-semibold">Keinginan</span>
                  <span className="mt-0.5 text-[10px] opacity-75">Tersier & Hiburan</span>
                </button>
              </div>
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-1/3 rounded-xl border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || loadingNo}
                className={`w-2/3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 transition-all dark:from-indigo-500 dark:to-indigo-600 ${loading || loadingNo ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Pengeluaran"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Logout Bottom Card */}
        <button
          onClick={onLogout}
          className="mt-6 w-full flex items-center justify-between rounded-3xl border border-rose-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-rose-900/30 dark:bg-zinc-900 group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Keluar dari Akun</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Kunci kembali aplikasi dan kembali ke halaman login.</p>
            </div>
          </div>
          <div className="text-zinc-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </main>
    </div>
  );
}
