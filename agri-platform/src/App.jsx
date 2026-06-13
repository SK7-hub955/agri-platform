import React, { useState, useEffect } from "react";
import { api, getToken, setToken } from "./api";

const AUTH_HERO_IMAGE = "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1400&q=80";
const SESSION_ROLE_KEY = "agriConnectRole";
const WEATHER_STORAGE_KEY = "agriPlatformWeather";

const DEFAULT_WEATHER = {
  temp: 22,
  humidity: 58,
  rain: "4 months",
  condition: "Partly Cloudy",
  wind: "14 km/h",
  advisory: "Rain expected in 4 months.",
};

function isGmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith("@gmail.com");
}

const formatK = (n) => `K${Number(n || 0).toLocaleString()}`;

function saveActiveRole(role) {
  try {
    if (role) localStorage.setItem(SESSION_ROLE_KEY, role);
    else localStorage.removeItem(SESSION_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

function loadActiveRole() {
  try {
    return localStorage.getItem(SESSION_ROLE_KEY);
  } catch {
    return null;
  }
}

function loadSavedWeather() {
  if (typeof window === "undefined") return null;
  try {
    const payload = localStorage.getItem(WEATHER_STORAGE_KEY);
    return payload ? JSON.parse(payload) : null;
  } catch {
    return null;
  }
}

function saveWeather(weather) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weather));
  } catch {
    /* ignore */
  }
}

/* ===========================
   Shared UI Shell
   =========================== */
function Shell({ user, onLogout, children, activeTab, setActiveTab, weather }) {
  const navItems = user.role === "customer"
    ? [["dashboard","📊","Dashboard"],["market","🛒","Market"],["crops","🌾","Crops"],["weather","🌤","Weather"],["community","💬","Community"]]
    : user.role === "supplier"
    ? [["dashboard","📊","Dashboard"],["inventory","📦","Inventory"],["orders","📋","Orders"],["market","📈","Prices"],["community","💬","Community"]]
    : [["dashboard","📊","Dashboard"],["deliveries","🚚","Deliveries"],["map","🗺","Route Map"],["earnings","💰","Earnings"],["community","💬","Community"]];

  const weatherText = weather?.condition || DEFAULT_WEATHER.condition;
  const temperature = weather?.temp != null ? weather.temp : DEFAULT_WEATHER.temp;
  const rainText = weather?.rain || DEFAULT_WEATHER.rain;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F4ED", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .btn-primary { padding: 10px 20px; background: linear-gradient(135deg,#4CAF50,#2E7D32); border: none; border-radius: 8px; color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.88; }
        .btn-outline { padding: 10px 20px; background: transparent; border: 1.5px solid #4CAF50; border-radius: 8px; color: #2E7D32; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; font-size: 14px; }
        .tbl td, .tbl th { padding: 12px 14px; border-bottom: 1px solid #f0f0f0; text-align: left; font-size: 13px; }
        .tbl th { font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 12px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
        .nav-item:hover { background: rgba(76,175,80,0.1); }
        .nav-item.active { background: rgba(76,175,80,0.15); }
        .stat-card { background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        input[type=text], input[type=email], input[type=number], select, textarea { padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; }
        input:focus, select:focus, textarea:focus { border-color: #4CAF50; }
      `}</style>

      <div style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌱</span>
          <span style={{ color: "#fff", fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700 }}>AgriConnect</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "capitalize" }}>{user.role} · {user.location}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{user.avatar}</div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div style={{ width: 200, background: "#fff", minHeight: "calc(100vh - 60px)", padding: "20px 12px", borderRight: "1px solid #eee", position: "sticky", top: 60, height: "calc(100vh - 60px)", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map(([key, icon, label]) => (
              <div key={key} className={`nav-item${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)} style={{ flexDirection: "row", justifyContent: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? "#2E7D32" : "#555" }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: "14px", background: "#F1F8E9", borderRadius: 10, border: "1px solid #C8E6C9" }}>
            <div style={{ fontSize: 11, color: "#558B2F", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Weather</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2E7D32" }}>{temperature}°C</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{weatherText}</div>
            <div style={{ fontSize: 11, color: "#8BC34A", marginTop: 6, fontStyle: "italic" }}>Rain in {rainText}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "28px 28px", overflowY: "auto", minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Auth Screen
   =========================== */
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("customer");
  const [selectedRoles, setSelectedRoles] = useState(["customer"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [stage, setStage] = useState("auth");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const roleConfig = {
    customer: { label: "Customer", icon: "🛒", desc: "Buy seeds, fertilizer & produce", color: "#4CAF50" },
    supplier: { label: "Supplier / Producer", icon: "🌾", desc: "List products & manage inventory", color: "#8D6E40" },
    transport: { label: "Transporter", icon: "🚚", desc: "Deliver orders to customers", color: "#1976D2" },
  };

  const resetAuthState = () => {
    setError("");
    setMessage("");
  };

  const handleLogin = async () => {
    resetAuthState();
    if (!email || !password) { setError("Please provide email and password."); return; }
    setBusy(true);
    try {
      const data = await api.login({ email, password, role });
      if (data.requiresVerification) {
        setVerificationEmail(data.email || email);
        setStage("verify");
        setMessage(data.message || "Enter the verification code sent to your Gmail.");
        return;
      }
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    resetAuthState();
    if (!name || !email || !password) { setError("Please fill all fields."); return; }
    if (!isGmail(email)) { setError("Please use a Gmail address to register."); return; }
    if (selectedRoles.length === 0) { setError("Select at least one role."); return; }
    setBusy(true);
    try {
      const data = await api.register({ name, email, password, roles: selectedRoles });
      if (data.requiresVerification) {
        setVerificationEmail(data.email || email);
        setStage("verify");
        setMessage(data.message || "A verification code has been sent to your Gmail.");
      } else {
        setMessage(data.message || "Roles added successfully! You can now login.");
        setTimeout(() => { setTab("login"); setStage("auth"); }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    resetAuthState();
    if (!verificationCode.trim()) { setError("Enter the verification code."); return; }
    setBusy(true);
    try {
      const data = await api.verify({ email: verificationEmail || email, code: verificationCode });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    resetAuthState();
    setBusy(true);
    try {
      const data = await api.resend(verificationEmail || email);
      setMessage(data.message || "A new verification code has been sent to your Gmail.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, rgba(18,45,19,0.9), rgba(14,32,15,0.94)), url('${AUTH_HERO_IMAGE}') center/cover no-repeat`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body, html, #root { min-height: 100%; }
        .auth-input { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; color: #fff; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: border 0.2s, transform 0.2s; }
        .auth-input:focus { border-color: #A5D6A7; transform: translateY(-1px); }
        .auth-input::placeholder { color: rgba(255,255,255,0.72); }
        .auth-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #7CB342, #2E7D32); border: none; border-radius: 14px; color: #fff; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer; transition: transform 0.2s, opacity 0.2s; letter-spacing: 0.5px; box-shadow: 0 18px 40px rgba(0,0,0,0.16); }
        .auth-btn:hover { opacity: 0.94; transform: translateY(-2px); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .role-card { flex: 1; padding: 16px 12px; border: 1.5px solid rgba(255,255,255,0.16); border-radius: 16px; cursor: pointer; text-align: center; transition: all 0.25s; background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); min-width: 110px; }
        .role-card.active { border-color: rgba(193,255,193,0.9); background: rgba(255,255,255,0.14); box-shadow: 0 18px 40px rgba(46,125,50,0.16); }
        .role-card:hover { transform: translateY(-2px); border-color: rgba(193,255,193,0.7); }
        .auth-panel { background: rgba(255,255,255,0.08); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.18); border-radius: 28px; box-shadow: 0 28px 90px rgba(0,0,0,0.24); }
        .auth-hero { height: 170px; border-radius: 22px; background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.45)), url('${AUTH_HERO_IMAGE}') center/cover no-repeat; display: flex; flex-direction: column; justify-content: flex-end; padding: 22px; margin-bottom: 24px; }
        .auth-hero small { color: #DCE775; letter-spacing: 1px; text-transform: uppercase; font-size: 11px; margin-bottom: 8px; display: block; }
        .auth-hero h1 { color: #fff; font-size: 28px; line-height: 1.05; margin: 0; }
        .auth-note { color: rgba(255,255,255,0.78); font-size: 12px; line-height: 1.5; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div className="auth-panel" style={{ padding: 32 }}>
          <div className="auth-hero">
            <small>Built for modern African agriculture</small>
            <h1>Grow better. Buy smarter. Trade with confidence.</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 700, letterSpacing: "-0.6px", fontFamily: "'Crimson Pro', serif" }}>AgriConnect</div>
              <p className="auth-note" style={{ marginTop: 8 }}>Secure marketplace, verified Gmail sign-up, and one account for all farm roles.</p>
            </div>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28 }}>🌾</div>
          </div>
          <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 6, marginBottom: 28 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setStage("auth"); setError(""); setMessage(""); }} style={{ flex: 1, minWidth: 120, padding: "12px 0", border: "none", borderRadius: 16, background: tab === t ? "rgba(193,255,193,0.18)" : "transparent", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "background 0.2s, transform 0.2s", boxShadow: tab === t ? "0 12px 24px rgba(40,80,0,0.16)" : "none" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>I am a…</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(roleConfig).map(([key, cfg]) => (
                <div key={key} className={`role-card${(tab === "register" ? selectedRoles.includes(key) : role === key) ? " active" : ""}`} onClick={() => {
                  if (tab === "register") {
                    setSelectedRoles(prev => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
                  } else {
                    setRole(key);
                  }
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{cfg.icon}</div>
                  <div style={{ color: "#fff", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{cfg.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tab === "register" && <input className="auth-input" placeholder="Full Name / Business Name" value={name} onChange={e => setName(e.target.value)} />}
            <input className="auth-input" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
            <input className="auth-input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          </div>

          {message && <p style={{ color: "#B2FF59", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12, textAlign: "center" }}>{message}</p>}
          {error && <p style={{ color: "#FF7043", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12, textAlign: "center" }}>{error}</p>}

          {stage === "verify" ? (
            <div style={{ marginTop: 16, padding: "18px", background: "rgba(255,255,255,0.08)", borderRadius: 12 }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Enter the verification code sent to {verificationEmail || email}.</p>
              <input className="auth-input" placeholder="Verification code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
              <button className="auth-btn" style={{ marginTop: 20 }} onClick={handleVerify} disabled={busy}>{busy ? "Verifying…" : "Verify Account"}</button>
              <button className="auth-btn" style={{ marginTop: 10, background: "rgba(255,255,255,0.12)", color: "#fff" }} onClick={handleResend} disabled={busy}>Resend Code</button>
            </div>
          ) : (
            <>
              <button className="auth-btn" style={{ marginTop: 20 }} onClick={tab === "login" ? handleLogin : handleRegister} disabled={busy}>
                {busy ? "Please wait…" : tab === "login" ? "Sign In to AgriConnect" : "Create Account"}
              </button>
              {tab === "register" && (
                <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textAlign: "center", margin: 0 }}>Select one or more roles. Verification will be sent to Gmail.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Customer Market (with cart)
   =========================== */
function CustomerMarket() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cart, setCart] = useState([]);
  const [ordered, setOrdered] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    let mounted = true;
    api.getProducts()
      .then(d => { if (mounted) setProducts(d.products || []); })
      .catch(e => { if (mounted) setLoadError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const cats = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (prod) => {
    setCart(c => {
      const ex = c.find(i => i.id === prod.id);
      return ex ? c.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...prod, qty: 1 }];
    });
  };

  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderError(null);
    try {
      await api.placeOrder(cart.map(item => ({ productId: item.id, qty: item.qty })));
      setCart([]);
      setOrdered(true);
      setTimeout(() => setOrdered(false), 3000);
    } catch (err) {
      setOrderError(err.message);
    }
  };

  const filtered = products
    .filter(p => (cat === "All" || p.category === cat))
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Agricultural Marketplace 🛒</h2>
      {ordered && <div style={{ background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#2E7D32", fontWeight: 600 }}>✅ Order placed successfully! Transport will be assigned shortly.</div>}
      {orderError && <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#C62828", fontWeight: 600 }}>{orderError}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "8px 16px", borderRadius: 20, border: "1.5px solid", borderColor: cat === c ? "#4CAF50" : "#ddd", background: cat === c ? "#4CAF50" : "#fff", color: cat === c ? "#fff" : "#555", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{c}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ color: "#666", marginBottom: 16 }}>Loading products…</div>}
      {loadError && <div style={{ color: "#C62828", marginBottom: 16 }}>Could not load products: {loadError}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ position: "relative", overflow: "hidden", minHeight: 360, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ borderRadius: 22, overflow: "hidden", minHeight: 190, marginBottom: 18, position: "relative", background: `url(${p.image}) center/cover no-repeat` }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.48))" }} />
                <div style={{ position: "absolute", left: 16, top: 16, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.92)", color: "#2E7D32", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" }}>{p.category}</div>
                <div style={{ position: "absolute", left: 16, bottom: 16, right: 16, color: "#fff", fontSize: 18, fontWeight: 700, textShadow: "0 3px 14px rgba(0,0,0,0.48)" }}>{p.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>by {p.supplierName || 'Local supplier'}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "#2E7D32" }}>{formatK(p.price)}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>per {p.unit}</div>
                </div>
                <div style={{ background: "#F1F8E9", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: "#4F6228" }}>
                  <span style={{ fontWeight: 700, color: "#2E7D32" }}>Forecast:</span> Estimated {formatK(p.predictedPrice)} by {p.predictedAvail}. Demand: <span style={{ color: p.demand === "High" ? "#C62828" : p.demand === "Medium" ? "#E65100" : "#2E7D32", fontWeight: 700 }}>{p.demand}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <span className="badge" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Stock: {p.stock}</span>
                  <span className="badge" style={{ background: "#E3F2FD", color: "#1565C0" }}>Season: {p.season}</span>
                </div>
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => addToCart(p)}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ position: "sticky", top: 20, height: "fit-content" }}>
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Your Cart ({cart.length})</h3>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0", fontSize: 14 }}>Cart is empty.<br />Browse products and add items.</div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.img} {item.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>×{item.qty} @ {formatK(item.price)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "#2E7D32" }}>{formatK(item.price * item.qty)}</div>
                </div>
              ))}
              <div style={{ borderTop: "2px solid #1B4332", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: "#1B4332" }}>{formatK(total)}</span>
              </div>
              <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={placeOrder} disabled={cart.length === 0}>Place Order & Request Delivery</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Customer Dashboard
   =========================== */
function CustomerDashboard({ user, weather }) {
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getCustomerOrders()
      .then(d => { if (mounted) setMyOrders(d.orders || []); })
      .catch(() => { if (mounted) setMyOrders([]); });
    return () => { mounted = false; };
  }, []);

  const advisory = weather?.advisory || DEFAULT_WEATHER.advisory;

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, color: "#1B4332", marginBottom: 6 }}>Good morning, {user.name.split(" ")[0]} 👋</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Here's what's happening on your farm today.</p>

      <div style={{ background: "linear-gradient(135deg,#FFF8E1,#FFF3CD)", border: "1px solid #FFD54F", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#E65100" }}>Farming Advisory</div>
          <div style={{ fontSize: 13, color: "#5D4037" }}>{advisory}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Orders", val: myOrders.filter(o => o.status !== "Delivered").length, icon: "📦", color: "#E3F2FD" },
          { label: "Total Spent", val: formatK(myOrders.reduce((a, b) => a + b.total, 0)), icon: "💰", color: "#F3E5F5" },
          { label: "Orders This Season", val: myOrders.length, icon: "🛒", color: "#E8F5E9" },
          { label: "Saved Products", val: 3, icon: "❤️", color: "#FFF3E0" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.color }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1B4332" }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Recent Orders</h3>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Product", "Qty", "Total", "Status"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myOrders.map(o => (
                <tr key={o.id}>
                  <td>{o.productImg} {o.productName}</td>
                  <td>{o.qty}</td>
                  <td style={{ fontWeight: 600 }}>{formatK(o.total)}</td>
                  <td><span className="badge" style={{ background: o.status === "Delivered" ? "#E8F5E9" : "#FFF8E1", color: o.status === "Delivered" ? "#2E7D32" : "#F57F17" }}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <LivePricesDashboardWidget />
      </div>
    </div>
  );
}

/* ===========================
   Crops Page
   =========================== */
function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getCrops()
      .then(d => { if (mounted) setCrops(d.crops || []); })
      .catch(() => { if (mounted) setCrops([]); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 6 }}>Crop Knowledge Center 🌾</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Comprehensive planting guides for Zambian conditions.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {crops.map((c, i) => (
          <div key={i} className="card" style={{ cursor: "pointer", border: selected?.name === c.name ? "2px solid #4CAF50" : "2px solid transparent", transition: "all 0.2s" }} onClick={() => setSelected(c)}>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 10 }}>{c.img}</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, fontWeight: 600, textAlign: "center", color: "#1B4332" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "#888", textAlign: "center", marginTop: 4 }}>Season: {c.season}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 12 }}>{selected.name} — Guide</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div><strong>Soil</strong>: {selected.soil}</div>
              <div><strong>Spacing</strong>: {selected.spacing}</div>
              <div><strong>Fertilizer</strong>: {selected.fertilizer}</div>
            </div>
            <div>
              <div><strong>Diseases</strong>: {selected.disease}</div>
              <div><strong>Yield</strong>: {selected.yield}</div>
              <div><strong>Harvest</strong>: {selected.harvest}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Weather Page
   =========================== */
function WeatherPage({ weather, status }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 6 }}>Weather Overview 🌤</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Live weather at your current location using Open-Meteo.</p>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1B4332' }}>{weather?.temp ?? 'N/A'}°C</div>
            <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{weather?.condition || 'Weather unavailable'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Source</div>
            <div style={{ fontWeight: 700, color: '#2E7D32' }}>{weather?.source || 'Fallback data'}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>Wind</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1B4332' }}>{weather?.wind || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{weather?.windDirection || ''}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>Humidity</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1B4332' }}>{weather?.humidity != null ? `${weather.humidity}%` : 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{weather?.precipitationProbability != null ? `Rain chance ${weather.precipitationProbability}%` : ''}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>Advisory</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{weather?.advisory || 'No advisory available'}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{status.error || 'Using current location weather data.'}</div>
        </div>
      </div>
      {status.error && (
        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: '#FFF3E0', color: '#795548', fontSize: 13 }}>
          {status.error}
        </div>
      )}
    </div>
  );
}

/* ===========================
   Community Page
   =========================== */
function CommunityPage({ user }) {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getPosts()
      .then(d => { if (mounted) setPosts(d.posts || []); })
      .catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, []);

  const post = async () => {
    if (!newPost.trim()) return;
    setError(null);
    try {
      const data = await api.addPost({ text: newPost.trim(), role: user?.role });
      setPosts(prev => [data.post, ...prev]);
      setNewPost("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Community & Expert Support 💬</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share a tip, ask a question, or post an update..." style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, resize: "vertical", minHeight: 80, outline: "none" }} />
        {error && <div style={{ color: "#C62828", fontSize: 13, marginTop: 8 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn-primary" onClick={post}>Post to Community</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map(p => (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.role === "supplier" ? "#E8F5E9" : p.role === "transport" ? "#E3F2FD" : p.role === "expert" ? "#FFF3E0" : "#F3E5F5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#1B4332" }}>{p.author.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.author}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    <span className="badge" style={{ background: p.role === "expert" ? "#FFF3E0" : "#F1F8E9", color: p.role === "expert" ? "#E65100" : "#2E7D32", marginRight: 4 }}>{p.role}</span>
                    {p.time}
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{p.text}</p>
            <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>❤️ {p.likes} likes</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===========================
   Supplier Views
   =========================== */
function SupplierDashboard() {
  const [myProducts, setMyProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getMyProducts(), api.getSupplierOrders()])
      .then(([prodData, orderData]) => {
        if (!mounted) return;
        setMyProducts(prodData.products || []);
        setMyOrders(orderData.orders || []);
      })
      .catch(() => { /* keep empty state */ });
    return () => { mounted = false; };
  }, []);

  const revenue = myOrders.reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Supplier Dashboard 🌾</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Products Listed", val: myProducts.length, icon: "📦", color: "#E8F5E9" },
          { label: "Total Revenue", val: formatK(revenue), icon: "💰", color: "#FFF8E1" },
          { label: "Active Orders", val: myOrders.filter(o => o.status !== "Delivered").length, icon: "📋", color: "#E3F2FD" },
          { label: "Avg Rating", val: "4.8 ★", icon: "⭐", color: "#FFF3E0" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.color }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1B4332" }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <LivePricesDashboardWidget />

      <div className="card">
        <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>My Product Performance</h3>
        <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Product", "Category", "Price", "Stock", "Demand", "Predicted Price"].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myProducts.map(p => (
              <tr key={p.id}>
                <td>{p.img} {p.name}</td>
                <td>{p.category}</td>
                <td style={{ fontWeight: 600 }}>{formatK(p.price)}</td>
                <td>{p.stock} units</td>
                <td><span className="badge" style={{ background: p.demand === "High" ? "#FFEBEE" : p.demand === "Medium" ? "#FFF8E1" : "#E8F5E9", color: p.demand === "High" ? "#C62828" : p.demand === "Medium" ? "#E65100" : "#2E7D32" }}>{p.demand}</span></td>
                <td style={{ color: "#1565C0", fontWeight: 600 }}>{formatK(p.predictedPrice)} ({p.predictedAvail})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplierInventory() {
  const [myProducts, setMyProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "Seeds", price: "", unit: "", stock: "", season: "" });
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = () => {
    api.getMyProducts()
      .then(d => setMyProducts(d.products || []))
      .catch(() => setMyProducts([]));
  };

  useEffect(() => { loadProducts(); }, []);

  const submit = async () => {
    if (!form.name || !form.price) return;
    setError(null);
    try {
      await api.addProduct({
        name: form.name,
        category: form.category,
        price: form.price,
        unit: form.unit,
        stock: form.stock,
        season: form.season,
      });
      setAdded(true);
      setForm({ name: "", category: "Seeds", price: "", unit: "", stock: "", season: "" });
      loadProducts();
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Inventory Management 📦</h2>
      {added && <div style={{ background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#2E7D32", fontWeight: 600 }}>✅ Product added successfully!</div>}
      {error && <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#C62828", fontWeight: 600 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Current Inventory</h3>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Product", "Price", "Stock", "Season", "Predicted Price"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myProducts.map(p => (
                <tr key={p.id}>
                  <td>{p.img} {p.name}</td>
                  <td>{formatK(p.price)}</td>
                  <td style={{ color: p.stock < 50 ? "#C62828" : "#2E7D32", fontWeight: 600 }}>{p.stock}</td>
                  <td>{p.season}</td>
                  <td style={{ color: "#1565C0", fontWeight: 600 }}>{formatK(p.predictedPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ background: "#F9FBF7" }}>
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Add New Product</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="text" placeholder="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%" }} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%" }}>
              {["Seeds", "Fertilizer", "Seedlings", "Equipment", "Produce"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Price (ZMW)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ width: "100%" }} />
            <input type="text" placeholder="Unit (e.g. 50kg bag)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ width: "100%" }} />
            <input type="number" placeholder="Stock quantity" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={{ width: "100%" }} />
            <input type="text" placeholder="Season (e.g. Nov–Jan)" value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} style={{ width: "100%" }} />
            <button className="btn-primary" onClick={submit}>Add to Inventory</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierOrders() {
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getSupplierOrders()
      .then(d => { if (mounted) setMyOrders(d.orders || []); })
      .catch(() => { if (mounted) setMyOrders([]); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Incoming Orders 📋</h2>
      <div className="card">
        <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Order ID", "Product", "Qty", "Total", "Date", "Status", "Transport"].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myOrders.map(o => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>#ORD-{o.id}</td>
                <td>{o.productImg} {o.productName}</td>
                <td>{o.qty}</td>
                <td style={{ fontWeight: 600 }}>{formatK(o.total)}</td>
                <td>{o.date}</td>
                <td><span className="badge" style={{ background: o.status === "Delivered" ? "#E8F5E9" : o.status === "In Transit" ? "#E3F2FD" : "#FFF8E1", color: o.status === "Delivered" ? "#2E7D32" : o.status === "In Transit" ? "#1565C0" : "#F57F17" }}>{o.status}</span></td>
                <td style={{ fontSize: 12, color: "#888" }}>{o.transporterName || "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===========================
   Transport Views
   =========================== */
function TransportDashboard({ user }) {
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getMyDeliveries()
      .then(d => { if (mounted) setMyDeliveries(d.deliveries || []); })
      .catch(() => { if (mounted) setMyDeliveries([]); });
    return () => { mounted = false; };
  }, []);

  const earnings = myDeliveries.filter(d => d.status === "Completed").reduce((a, b) => a + b.fee, 0);

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Transport Dashboard 🚚</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Deliveries", val: myDeliveries.length, icon: "📦", color: "#E3F2FD" },
          { label: "Total Earnings", val: formatK(earnings), icon: "💰", color: "#E8F5E9" },
          { label: "In Progress", val: myDeliveries.filter(d => d.status === "In Progress").length, icon: "🚛", color: "#FFF8E1" },
          { label: "Rating", val: "4.9 ★", icon: "⭐", color: "#FFF3E0" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.color }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1B4332" }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <LivePricesDashboardWidget />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>My Deliveries</h3>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Order", "Route", "Distance", "Fee", "Status"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myDeliveries.map(d => (
                <tr key={d.id}>
                  <td>#DEL-{d.id}</td>
                  <td>{d.from} → {d.to}</td>
                  <td>{d.distance}</td>
                  <td style={{ fontWeight: 600 }}>{formatK(d.fee)}</td>
                  <td><span className="badge" style={{ background: d.status === "Completed" ? "#E8F5E9" : "#FFF8E1", color: d.status === "Completed" ? "#2E7D32" : "#F57F17" }}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ background: "#F9FBF7" }}>
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 12 }}>Vehicle Info</h3>
          {[["Truck Type", user.truckType || "3-ton Pickup"], ["Status", user.available ? "Available" : "Busy"], ["Location", user.location], ["License", "ZMB-4521-T"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransportDeliveries() {
  const [pending, setPending] = useState([]);
  const [notice, setNotice] = useState(null);

  const load = () => {
    api.getAvailableDeliveries()
      .then(d => setPending(d.deliveries || []))
      .catch(() => setPending([]));
  };

  useEffect(() => { load(); }, []);

  const accept = async (orderId) => {
    setNotice(null);
    try {
      await api.acceptDelivery(orderId);
      setNotice("Delivery accepted! Navigate to Chisamba to pick up the order.");
      load();
    } catch (err) {
      setNotice(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Available Deliveries 🚚</h2>
      {notice && <div style={{ background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#2E7D32", fontWeight: 600 }}>{notice}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {pending.map(o => (
          <div key={o.id} className="card" style={{ border: "1.5px solid #E3F2FD" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: "#1B4332", fontSize: 15 }}>Order #{o.id}</span>
              <span className="badge" style={{ background: "#E3F2FD", color: "#1565C0" }}>{o.status}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#555" }}>
              <div>📦 {o.productImg} {o.productName} × {o.qty}</div>
              <div>👤 Customer: {o.customerName}</div>
              <div>📍 From: Chisamba → To: {o.customerLocation}</div>
              <div>📅 Order date: {o.date}</div>
              <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: 15 }}>Delivery fee: {formatK(o.deliveryFee)}</div>
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => accept(o.id)}>Accept Delivery</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===========================
   Market Prices, Earnings, Route Map
   =========================== */
function MarketPricesPage() {
  const [livePrices, setLivePrices] = useState([]);
  const [provider, setProvider] = useState('Silv Data');
  const [priceError, setPriceError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadPrices = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMarketPrices();
        if (!mounted) return;
        if (data.success && data.source === 'Silv Data' && data.prices.length > 0) {
          setLivePrices(data.prices);
          setProvider('Silv Data');
          setPriceError(null);
        } else {
          setLivePrices([]);
          setProvider(data.source || 'Silv Data');
          setPriceError(data.error || 'Silv commodity prices are currently unavailable.');
        }
      } catch (err) {
        if (mounted) {
          setLivePrices([]);
          setPriceError(err.message);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadPrices();
    api.getProducts()
      .then(d => { if (mounted) setProducts(d.products || []); })
      .catch(() => { /* ignore */ });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 6 }}>Live Market Prices 📈</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>Current commodity prices across verified sources.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "#555", padding: "8px 12px", background: "#F1F8E9", borderRadius: 10, border: "1px solid #C8E6C9" }}>
          Source: {provider}
        </div>
        {isLoading && <div style={{ fontSize: 12, color: "#666" }}>Refreshing prices…</div>}
      </div>
      {priceError && <div style={{ marginBottom: 16, color: "#C62828", fontSize: 13, padding: "12px 14px", background: "#FFEBEE", borderRadius: 12 }}><strong>Notice:</strong> {priceError}</div>}
      {livePrices.length === 0 && !isLoading ? (
        <div style={{ marginBottom: 24, padding: 18, background: "#FFF8E1", borderRadius: 14, color: "#795548" }}>
          No Silv commodity prices are available right now. Please check back later or ensure the backend is configured to fetch data from Silv.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 24 }}>
          {livePrices.map((m, i) => (
            <div key={i} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 150 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1B4332" }}>{m.crop}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{m.symbol || 'Silv commodity'}</div>
                {m.unit && <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Unit: {m.unit}</div>}
              </div>
              <div style={{ marginTop: 14, textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2E7D32" }}>{m.price}</div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: m.trend === "up" ? "#2E7D32" : m.trend === "down" ? "#C62828" : "#888", fontWeight: 600 }}>{m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.change}</span>
                  {m.source && <span style={{ fontSize: 11, color: "#555", background: "#F1F8E9", padding: "3px 8px", borderRadius: 10 }}>{m.source}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ background: "#F9FBF7" }}>
        <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>AI Price Predictions (Next Season)</h3>
        <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Seed/Product", "Current Price", "Predicted Price", "Availability", "Demand", "Advice"].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.img} {p.name}</td>
                <td>{formatK(p.price)}</td>
                <td style={{ fontWeight: 600, color: "#1565C0" }}>{formatK(p.predictedPrice)}</td>
                <td>{p.predictedAvail}</td>
                <td><span className="badge" style={{ background: p.demand === "High" ? "#FFEBEE" : p.demand === "Medium" ? "#FFF8E1" : "#E8F5E9", color: p.demand === "High" ? "#C62828" : p.demand === "Medium" ? "#E65100" : "#2E7D32" }}>{p.demand}</span></td>
                <td style={{ fontSize: 12, color: "#666" }}>{p.demand === "High" ? "Buy early — prices rising" : "Buy when needed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LivePricesDashboardWidget() {
  const [livePrices, setLivePrices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getMarketPrices();
        if (!mounted) return;
        if (data.success && data.prices.length > 0) {
          setLivePrices(data.prices.slice(0, 4));
        } else {
          setLivePrices([]);
          setError(data.error || 'Live Silv commodity data is currently unavailable.');
        }
      } catch (err) {
        if (mounted) {
          setLivePrices([]);
          setError(err.message);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#1B4332", marginBottom: 6 }}>Live Commodity Prices</h3>
          <div style={{ fontSize: 12, color: "#666" }}>Updated from Silv Data</div>
        </div>
        {isLoading && <div style={{ fontSize: 12, color: "#2E7D32" }}>Refreshing prices…</div>}
      </div>
      {error && <div style={{ marginBottom: 16, color: "#C62828", fontSize: 13, padding: "12px 14px", background: "#FFEBEE", borderRadius: 12 }}>{error}</div>}
      {livePrices.length === 0 && !isLoading ? (
        <div style={{ color: "#555", fontSize: 13, background: "#F9FBF7", borderRadius: 12, padding: 16 }}>No commodity prices are available right now.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {livePrices.map((item, index) => (
            <div key={index} style={{ background: '#F1F4ED', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332' }}>{item.crop}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{item.symbol || item.source || 'Commodity'}</div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2E7D32' }}>{item.price}</div>
                <div style={{ fontSize: 12, color: item.trend === 'up' ? '#2E7D32' : item.trend === 'down' ? '#C62828' : '#555', fontWeight: 600 }}>{item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.change}</div>
              </div>
              {item.unit && <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>Unit: {item.unit}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EarningsPage() {
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getMyDeliveries()
      .then(d => { if (mounted) setMyDeliveries(d.deliveries || []); })
      .catch(() => { if (mounted) setMyDeliveries([]); });
    return () => { mounted = false; };
  }, []);

  const total = myDeliveries.reduce((a, b) => a + b.fee, 0);
  const completed = myDeliveries.filter(d => d.status === "Completed");

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Earnings 💰</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Earned", val: formatK(total), icon: "💰", color: "#E8F5E9" },
          { label: "Completed Deliveries", val: completed.length, icon: "✅", color: "#E3F2FD" },
          { label: "Active Deliveries", val: myDeliveries.length - completed.length, icon: "🚛", color: "#FFF8E1" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.color }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1B4332" }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteMapPage() {
  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#1B4332", marginBottom: 20 }}>Route Map 🗺</h2>
      <div className="card" style={{ textAlign: "center", padding: "60px 20px", background: "linear-gradient(135deg,#F1F8E9,#E8F5E9)" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
        <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#1B4332", marginBottom: 8 }}>Live Route Navigation</h3>
        <p style={{ color: "#666", fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>GPS-based live routing, turn-by-turn navigation, and real-time delivery tracking would be integrated here via a maps API such as Google Maps or OpenStreetMap.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24 }}>
          {[["📍", "Current Job", "Chisamba → Lusaka"], ["📦", "Cargo", "D-Compound ×2"], ["⏱", "ETA", "~1h 45min"]].map(([ic, label, val]) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{ic}</div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Root App
   =========================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [weather, setWeather] = useState(() => loadSavedWeather());
  const [weatherStatus, setWeatherStatus] = useState({ loading: false, error: null });

  // Restore session from stored JWT on first load.
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    if (!token) {
      setRestoring(false);
      return;
    }
    api.me()
      .then(d => {
        if (!mounted) return;
        const savedRole = loadActiveRole();
        const restored = savedRole && d.user.roles.includes(savedRole) ? { ...d.user, role: savedRole } : d.user;
        setUser(restored);
      })
      .catch(() => {
        setToken(null);
        saveActiveRole(null);
      })
      .finally(() => { if (mounted) setRestoring(false); });
    return () => { mounted = false; };
  }, []);

  const handleLogin = (userData, token) => {
    setToken(token);
    saveActiveRole(userData.role);
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    saveActiveRole(null);
    setUser(null);
  };

  useEffect(() => {
    if (!user || typeof navigator === "undefined" || !navigator.geolocation) return;

    const handleGeoSuccess = async (position) => {
      const { latitude, longitude } = position.coords;
      setWeatherStatus({ loading: true, error: null });
      try {
        const data = await api.getWeather(latitude, longitude);
        if (data.success && data.weather) {
          setWeather(data.weather);
          saveWeather(data.weather);
        } else {
          setWeatherStatus({ loading: false, error: "Unable to load real weather data." });
        }
      } catch {
        setWeatherStatus({ loading: false, error: "Unable to load real weather data." });
      }
      setWeatherStatus(prev => ({ ...prev, loading: false }));
    };

    const handleGeoError = (err) => {
      console.warn("Geolocation error:", err.message);
      setWeatherStatus({ loading: false, error: "Location denied or unavailable. Using fallback weather." });
    };

    navigator.geolocation.getCurrentPosition(handleGeoSuccess, handleGeoError, { timeout: 15000 });
  }, [user]);

  if (restoring) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#2E7D32" }}>
        Loading AgriConnect…
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const renderContent = () => {
    if (user.role === "customer") {
      if (activeTab === "dashboard") return <CustomerDashboard user={user} weather={weather} />;
      if (activeTab === "market") return <CustomerMarket />;
      if (activeTab === "crops") return <CropsPage />;
      if (activeTab === "weather") return <WeatherPage weather={weather} status={weatherStatus} />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    if (user.role === "supplier") {
      if (activeTab === "dashboard") return <SupplierDashboard />;
      if (activeTab === "inventory") return <SupplierInventory />;
      if (activeTab === "orders") return <SupplierOrders />;
      if (activeTab === "market") return <MarketPricesPage />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    if (user.role === "transport") {
      if (activeTab === "dashboard") return <TransportDashboard user={user} />;
      if (activeTab === "deliveries") return <TransportDeliveries />;
      if (activeTab === "map") return <RouteMapPage />;
      if (activeTab === "earnings") return <EarningsPage />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    return <div>Coming soon</div>;
  };

  return (
    <Shell user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} weather={weather}>
      {renderContent()}
    </Shell>
  );
}
