import { useState, useEffect } from "react";
import "@/styles/globals.css";
import PasswordGate from "@/components/PasswordGate";

export default function App({ Component, pageProps }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem("catatan_keuangan_auth");
    if (authStatus === "true") {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem("catatan_keuangan_auth", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("catatan_keuangan_auth");
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <PasswordGate onSuccess={handleLoginSuccess} />;
  }

  return <Component {...pageProps} onLogout={handleLogout} />;
}
