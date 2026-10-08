 import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useApp } from "../store";

export default function AuthModal() {
  const { authOpen, setAuthOpen, login, signup, googleLogin } = useApp();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const hasGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => { if (authOpen) { setMode(authOpen.mode || "login"); setErr(""); } }, [authOpen]);
  if (!authOpen) return null;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      mode === "login" ? await login(f.email, f.password) : await signup(f.name, f.email, f.password);
      setF({ name: "", email: "", password: "" });
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };

  return (
    <div className="overlay" onClick={() => setAuthOpen(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="close" onClick={() => setAuthOpen(null)} aria-label="Close">×</button>
        <h2>{mode === "login" ? "Welcome back" : "Join FootFlex"}</h2>
        <p className="muted">{authOpen.reason || (mode === "signup" ? "New accounts start with ৳10,000 demo balance." : "Log in to shop your next pair.")}</p>

        {hasGoogle ? (
          <div className="google-wrap">
            <GoogleLogin onSuccess={(r) => googleLogin(r.credential).catch((x) => setErr(x.message))} onError={() => setErr("Google sign-in was cancelled.")} theme="filled_black" shape="pill" width="320" />
          </div>
        ) : (
          <p className="note">Google login is off. Set <code>VITE_GOOGLE_CLIENT_ID</code> in Client/.env</p>
        )}
        <div className="or"><span>or use email</span></div>

        <form onSubmit={submit}>
          {mode === "signup" && <input placeholder="Full name" value={f.name} onChange={set("name")} required />}
          <input type="email" placeholder="Email" value={f.email} onChange={set("email")} required />
          <input type="password" placeholder="Password (min 6 characters)" value={f.password} onChange={set("password")} required minLength={6} />
          {err && <p className="error">{err}</p>}
          <button className="btn solid full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <p className="switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>{mode === "login" ? "Sign up" : "Log in"}</button>
        </p>
      </div>
    </div>
  );
}
