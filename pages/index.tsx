import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Lock, User, Eye, EyeOff, AlertCircle, Waves, ArrowRight, ShieldCheck, Droplet, ChartNoAxesColumnIncreasing } from "lucide-react";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ApiError {
  message: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);
  const [error, setError] = useState<string>("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = async (response: GoogleCredentialResponse): Promise<void> => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const apiResponse = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data: LoginResponse | ApiError = await apiResponse.json().catch(
        () => ({ message: "Response dari server tidak valid" }),
      );

      if (!apiResponse.ok) {
        setError((data as ApiError).message || "Login Google gagal");
        return;
      }

      const loginData = data as LoginResponse;
      if (!loginData.token || !loginData.user) {
        setError("Data login Google tidak lengkap");
        return;
      }

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      await router.push("/pool/read");
    } catch (googleError: unknown) {
      setError(googleError instanceof Error ? googleError.message : "Terjadi kesalahan koneksi");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  const isGoogleConfigured =
    googleClientId.length > 0 && !googleClientId.startsWith("replace-with");

  const setupGoogleButton = (): void => {
    if (!isGoogleConfigured || !window.google || !googleButtonRef.current) return;

    const containerWidth = Math.min(
      400,
      Math.max(240, Math.floor(googleButtonRef.current.clientWidth || 360)),
    );

    googleButtonRef.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleLogin,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: containerWidth,
    });
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberUsername(true);
    }
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/pool/read");
    }
    setupGoogleButton();
  }, [router, isGoogleConfigured]);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data: LoginResponse | ApiError = await response.json().catch(
        () => ({ message: "Response dari server tidak valid" }),
      );

      if (!response.ok) {
        setError((data as ApiError).message || "Login gagal");
        return;
      }

      const loginData = data as LoginResponse;

      // Validate and store token
      if (loginData.token && loginData.user) {
        if (rememberUsername) localStorage.setItem("rememberedUsername", username);
        else localStorage.removeItem("rememberedUsername");
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        console.log("Login berhasil!", { user: loginData.user });
        await router.push("/pool/read");
      } else {
        setError("Data login tidak lengkap");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan koneksi");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={setupGoogleButton} />
      <div className="login-scenery" aria-hidden="true" />
      <div className="login-orbit login-orbit-left" aria-hidden="true" />
      <div className="login-orbit login-orbit-right" aria-hidden="true" />
      <div className="login-floating login-floating-water" aria-hidden="true"><Droplet size={30} /></div>
      <div className="login-floating login-floating-chart" aria-hidden="true"><ChartNoAxesColumnIncreasing size={30} /></div>
      <div className="login-shell">
        <div className="login-brand"><span className="login-brand-icon"><Waves aria-hidden="true" size={36} /></span><span>SIMONIKA</span></div>
        <section className="login-card" aria-labelledby="login-title">
          <header className="login-heading">
            <span className="login-eyebrow">SELAMAT DATANG KEMBALI</span>
            <h1 id="login-title">Masuk ke SIMONIKA</h1>
            <p>Pantau kolam Anda, mulai dari sini.</p>
          </header>
          {error && <div className="login-error" role="alert" id="login-error"><AlertCircle size={20} aria-hidden="true" /><p>{error}</p></div>}
          <form onSubmit={handleLogin} className="login-form" aria-busy={isLoading}>
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <div className="login-input-wrap">
                <User size={20} aria-hidden="true" />
                <input id="username" name="username" type="text" autoComplete="username" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} aria-describedby={error ? "login-error" : undefined} required />
              </div>
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <Lock size={20} aria-hidden="true" />
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={error ? "login-error" : undefined} required />
                <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
            </div>
            <div className="login-options">
              <label className="login-remember"><input type="checkbox" checked={rememberUsername} onChange={(e) => setRememberUsername(e.target.checked)} /><span>Ingat username</span></label>
              <button type="button" className="login-recovery" aria-expanded={showRecoveryHelp} aria-controls="recovery-help" onClick={() => setShowRecoveryHelp(!showRecoveryHelp)}>Lupa password?</button>
            </div>
            {showRecoveryHelp && <p className="login-help" id="recovery-help" role="status">Hubungi administrator SIMONIKA untuk bantuan mengatur ulang password Anda.</p>}
            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? <><span className="login-spinner" aria-hidden="true" />Memproses...</> : <>Masuk<ArrowRight size={20} aria-hidden="true" /></>}
            </button>
            <div className="login-divider" aria-hidden="true"><span>atau</span></div>
            <div className="login-google-wrap" aria-busy={isGoogleLoading}>
              {isGoogleConfigured ? (
                <div ref={googleButtonRef} className="login-google-button" />
              ) : (
                <button
                  type="button"
                  className="login-google-fallback"
                  onClick={() =>
                    setError(
                      "Kredensial Google OAuth (NEXT_PUBLIC_GOOGLE_CLIENT_ID) belum diisi di .env.local",
                    )
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              )}
              {isGoogleLoading && <span className="login-google-loading">Memproses login Google...</span>}
            </div>
            <span className="login-sr-only" role="status">{isLoading ? "Sedang memproses login" : ""}</span>
          </form>
          <div className="login-note"><ShieldCheck size={16} aria-hidden="true" /><span>Gunakan akun yang diberikan administrator.</span></div>
        </section>
        <footer className="login-footer">SIMONIKA · Monitoring kolam dalam satu tempat</footer>
      </div>
    </main>
  );
};

export default LoginPage;
