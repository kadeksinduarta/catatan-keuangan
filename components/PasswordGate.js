import { useState } from "react";

export default function PasswordGate({ onSuccess, className = "" }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setShake(false);

    if (password === "hemat22") {
      onSuccess();
    } else {
      setError("Password salah! Silakan coba lagi.");
      setShake(true);
      // Reset shake after animation duration (0.5s)
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-radial from-zinc-50 to-zinc-200 px-4 dark:from-zinc-900 dark:to-black ${className}`}>
      {/* Glow Effect behind the Card */}
      <div className="absolute h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5"></div>
      
      <div className={`relative w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all dark:border-zinc-800/80 dark:bg-zinc-900/90 md:p-10 ${
        shake ? "animate-bounce" : ""
      }`}>
        <div className="mb-8 text-center">
          {/* Animated Lock Icon Container */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/10">
            <svg
              className="h-8 w-8 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Akses Terproteksi
          </h1>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Halaman ini dilindungi sandi. Silakan masukkan password untuk melanjutkan.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-950">
            <svg
              className="mr-2 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Password Keamanan
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                placeholder="Masukkan password..."
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-4 pr-11 text-zinc-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950/50"
                required
              />
              
              {/* Show/Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 transition-all dark:from-indigo-500 dark:to-indigo-600"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] text-zinc-400 dark:text-zinc-600">
          Sesi Anda akan tersimpan secara lokal pada browser ini.
        </div>
      </div>
    </div>
  );
}
