import { useState, useEffect } from "react";

// ── helpers ────────────────────────────────────────────────────────────────
const DB = {
  users: [
    { id: 1, name: "John Banda", email: "john@farm.zm", password: "pass123", role: "customer", avatar: "JB", location: "Lusaka" },
    { id: 2, name: "Green Valley Farms", email: "gvf@supplier.zm", password: "pass123", role: "supplier", avatar: "GV", location: "Chisamba", products: ["Maize", "Soybeans", "Groundnuts"] },
    { id: 3, name: "Swift Cargo Ltd", email: "swift@transport.zm", password: "pass123", role: "transport", avatar: "SC", location: "Kabwe", truckType: "3-ton pickup", available: true },
  ],
  products: [
    { id: 1, name: "Hybrid Maize Seed (SC403)", supplierId: 2, category: "Seeds", price: 285, unit: "25kg bag", stock: 120, season: "Nov–Jan", predictedAvail: "Oct 2026", predictedPrice: 310, demand: "High", img: "🌽" },
    { id: 2, name: "Soybean Seed (Hernon 147)", supplierId: 2, category: "Seeds", price: 320, unit: "25kg bag", stock: 80, season: "Nov–Dec", predictedAvail: "Oct 2026", predictedPrice: 340, demand: "Medium", img: "🫘" },
    { id: 3, name: "D-Compound Fertilizer", supplierId: 2, category: "Fertilizer", price: 450, unit: "50kg bag", stock: 200, season: "All year", predictedAvail: "Now", predictedPrice: 470, demand: "High", img: "🧪" },
    { id: 4, name: "Urea (Nitrogen Top Dressing)", supplierId: 2, category: "Fertilizer", price: 380, unit: "50kg bag", stock: 150, season: "All year", predictedAvail: "Now", predictedPrice: 395, demand: "Medium", img: "⚗️" },
    { id: 5, name: "Groundnut Seed (Chalimbana)", supplierId: 2, category: "Seeds", price: 220, unit: "20kg bag", stock: 60, season: "Nov–Dec", predictedAvail: "Sep 2026", predictedPrice: 250, demand: "Low", img: "🥜" },
    { id: 6, name: "Tomato Seedlings (Money Maker)", supplierId: 2, category: "Seedlings", price: 150, unit: "tray of 50", stock: 40, season: "Apr–Jun", predictedAvail: "Mar 2027", predictedPrice: 165, demand: "High", img: "🍅" },
  ],
  orders: [
    { id: 1, customerId: 1, productId: 1, qty: 4, total: 1140, status: "Delivered", date: "2026-04-12", transportId: 3 },
    { id: 2, customerId: 1, productId: 3, qty: 2, total: 900, status: "In Transit", date: "2026-05-18", transportId: 3 },
  ],
  deliveries: [
    { id: 1, transportId: 3, orderId: 1, from: "Chisamba", to: "Lusaka", distance: "110 km", fee: 250, status: "Completed", date: "2026-04-14" },
    { id: 2, transportId: 3, orderId: 2, from: "Chisamba", to: "Lusaka", distance: "110 km", fee: 250, status: "In Progress", date: "2026-05-20" },
  ],
  cropData: [
    { name: "Maize", soil: "Loamy, well-drained", season: "Nov–Jan", spacing: "75cm × 25cm", fertilizer: "D-Compound + Urea", disease: "Streak Virus, Stalk Borer", yield: "4–8 t/ha", harvest: "Apr–May", img: "🌽" },
    { name: "Soybeans", soil: "Sandy loam, pH 6–6.5", season: "Nov–Dec", spacing: "45cm × 5cm", fertilizer: "Rhizobium inoculant", disease: "Rust, Mosaic Virus", yield: "1.5–3 t/ha", harvest: "Mar–Apr", img: "🫘" },
    { name: "Groundnuts", soil: "Sandy loam, well-drained", season: "Nov–Dec", spacing: "45cm × 15cm", fertilizer: "Low N, P-rich", disease: "Rosette, Leaf Spot", yield: "0.8–1.5 t/ha", harvest: "Mar–Apr", img: "🥜" },
    { name: "Tomatoes", soil: "Rich loam, pH 6–6.8", season: "Apr–Jun (dry)", spacing: "60cm × 45cm", fertilizer: "High K + Ca", disease: "Blight, Bacterial Wilt", yield: "20–40 t/ha", harvest: "Jul–Sep", img: "🍅" },
  ],
  weather: { temp: 22, humidity: 58, rain: "3 days", condition: "Partly Cloudy", wind: "14 km/h", advisory: "Rain expected in 3 days — delay fertilizer application until after rains." },
  marketPrices: [
    { crop: "Maize", price: "K850/50kg", change: "+3.2%", trend: "up" },
    { crop: "Soybeans", price: "K1,200/50kg", change: "+1.8%", trend: "up" },
    { crop: "Groundnuts", price: "K1,800/50kg", change: "-0.5%", trend: "down" },
    { crop: "Wheat", price: "K920/50kg", change: "+2.1%", trend: "up" },
    { crop: "Cassava", price: "K420/50kg", change: "0.0%", trend: "flat" },
  ],
};

const formatK = (n) => `K${Number(n).toLocaleString()}`;

// ── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const roleConfig = {
    customer: { label: "Customer", icon: "🛒", desc: "Buy seeds, fertilizer & produce", color: "#4CAF50" },
    supplier: { label: "Supplier / Producer", icon: "🌾", desc: "List products & manage inventory", color: "#8D6E40" },
    transport: { label: "Transporter", icon: "🚚", desc: "Deliver orders to customers", color: "#1976D2" },
  };

  const handleLogin = () => {
    const user = DB.users.find(u => u.email === email && u.password === password && u.role === role);
    if (user) { onLogin(user); }
    else { setError("Invalid credentials or wrong role selected."); }
  };

  const handleRegister = () => {
    if (!name || !email || !password) { setError("Please fill all fields."); return; }
    const newUser = { id: Date.now(), name, email, password, role, avatar: name.slice(0,2).toUpperCase(), location: "Zambia" };
    DB.users.push(newUser);
    onLogin(newUser);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 40%, #4a7c3f 70%, #8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Crimson Pro', Georgia, serif", padding: "20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        .auth-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: border 0.2s; }
        .auth-input:focus { border-color: #7CB342; }
        .auth-input::placeholder { color: rgba(255,255,255,0.4); }
        .auth-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #4CAF50, #2E7D32); border: none; border-radius: 8px; color: #fff; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; transition: transform 0.1s, opacity 0.2s; letter-spacing: 0.5px; }
        .auth-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .role-card { flex: 1; padding: 14px 10px; border: 2px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; text-align: center; transition: all 0.2s; background: rgba(0,0,0,0.2); }
        .role-card.active { border-color: #7CB342; background: rgba(124,179,66,0.15); }
        .role-card:hover { border-color: rgba(124,179,66,0.6); }
      `}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌱</div>
          <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px", fontFamily: "'Crimson Pro', serif" }}>AgriConnect</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Zambia's Agricultural Marketplace</p>
        </div>

        <div style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)", borderRadius: 16, padding: 32, border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 6, background: tab === t ? "rgba(124,179,66,0.8)" : "transparent", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "background 0.2s" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Role Selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>I am a…</p>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(roleConfig).map(([key, cfg]) => (
                <div key={key} className={`role-card${role === key ? " active" : ""}`} onClick={() => setRole(key)}>
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

          {error && <p style={{ color: "#FF7043", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12, textAlign: "center" }}>{error}</p>}

          <button className="auth-btn" style={{ marginTop: 20 }} onClick={tab === "login" ? handleLogin : handleRegister}>
            {tab === "login" ? "Sign In to AgriConnect" : "Create Account"}
          </button>

          {tab === "login" && (
            <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textAlign: "center", marginBottom: 6 }}>Demo accounts (password: pass123)</p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                {DB.users.map(u => (
                  <button key={u.id} onClick={() => { setEmail(u.email); setPassword("pass123"); setRole(u.role); }} style={{ padding: "4px 10px", background: "rgba(124,179,66,0.2)", border: "1px solid rgba(124,179,66,0.4)", borderRadius: 4, color: "#a5d6a7", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {u.avatar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Layout Shell ───────────────────────────────────────────────────────────
function Shell({ user, onLogout, children, activeTab, setActiveTab }) {
  const navItems = user.role === "customer"
    ? [["dashboard","📊","Dashboard"],["market","🛒","Market"],["crops","🌾","Crops"],["weather","🌤","Weather"],["community","💬","Community"]]
    : user.role === "supplier"
    ? [["dashboard","📊","Dashboard"],["inventory","📦","Inventory"],["orders","📋","Orders"],["market","📈","Prices"],["community","💬","Community"]]
    : [["dashboard","📊","Dashboard"],["deliveries","🚚","Deliveries"],["map","🗺","Route Map"],["earnings","💰","Earnings"],["community","💬","Community"]];

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
        input[type=text], input[type=email], input[type=number], select { padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; }
        input:focus, select:focus { border-color: #4CAF50; }
      `}</style>

      {/* Top Bar */}
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
        {/* Sidebar */}
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
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2E7D32" }}>{DB.weather.temp}°C</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{DB.weather.condition}</div>
            <div style={{ fontSize: 11, color: "#8BC34A", marginTop: 6, fontStyle: "italic" }}>Rain in {DB.weather.rain}</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "28px 28px", overflowY: "auto", minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── CUSTOMER VIEWS ─────────────────────────────────────────────────────────
function CustomerDashboard({ user }) {
  const myOrders = DB.orders.filter(o => o.customerId === user.id);
  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, color: "#1B4332", marginBottom: 6 }}>Good morning, {user.name.split(" ")[0]} 👋</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Here's what's happening on your farm today.</p>

      {/* Advisory Banner */}
      <div style={{ background: "linear-gradient(135deg,#FFF8E1,#FFF3CD)", border: "1px solid #FFD54F", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#E65100" }}>Farming Advisory</div>
          <div style={{ fontSize: 13, color: "#5D4037" }}>{DB.weather.advisory}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Orders", val: myOrders.filter(o=>o.status!=="Delivered").length, icon: "📦", color: "#E3F2FD" },
          { label: "Total Spent", val: formatK(myOrders.reduce((a,b)=>a+b.total,0)), icon: "💰", color: "#F3E5F5" },
          { label: "Orders This Season", val: myOrders.length, icon: "🛒", color: "#E8F5E9" },
          { label: "Saved Products", val: 3, icon: "❤️", color: "#FFF3E0" },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ background: s.color }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1B4332" }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Recent Orders */}
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Recent Orders</h3>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Product","Qty","Total","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myOrders.map(o => {
                const prod = DB.products.find(p=>p.id===o.productId);
                return (
                  <tr key={o.id}>
                    <td>{prod?.img} {prod?.name}</td>
                    <td>{o.qty}</td>
                    <td style={{ fontWeight: 600 }}>{formatK(o.total)}</td>
                    <td><span className="badge" style={{ background: o.status==="Delivered"?"#E8F5E9":"#FFF8E1", color: o.status==="Delivered"?"#2E7D32":"#F57F17" }}>{o.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Market Prices */}
        <div className="card">
          <h3 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: "#1B4332", marginBottom: 16 }}>Today's Market Prices</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DB.marketPrices.map((m,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FBF7", borderRadius: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{m.crop}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1B4332" }}>{m.price}</div>
                  <div style={{ fontSize: 11, color: m.trend==="up"?"#2E7D32":m.trend==="down"?"#C62828":"#888" }}>{m.trend==="up"?"↑":m.trend==="down"?"↓":"→"} {m.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerMarket({ user }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [ordered, setOrdered] = useState(false);

  const cats = ["All", ...new Set(DB.products.map(p=>p.category))];
  const filtered = DB.products.filter(p =>
    (cat==="All"||p.category===cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (prod) => {
    setCart(c => {
      const ex = c.find(i=>i.id===prod.id);
      return ex ? c.map(i=>i.id===prod.id?{...i,qty:i.qty+1}:i) : [...c,{...prod,qty:1}];
    });
  };

  const total = cart.reduce((a,b)=>a+b.price*b.qty,0);

  const placeOrder = () => {
    cart.forEach(item => {
      DB.orders.push({ id: Date.now()+Math.random(), customerId: user.id, productId: item.id, qty: item.qty, total: item.price*item.qty, status: "Pending", date: new Date().toISOString().split("T")[0], transportId: null });
    });
    setCart([]);
    setOrdered(true);
    setTimeout(()=>setOrdered(false),3000);
  };

  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Agricultural Marketplace 🛒</h2>
      {ordered && <div style={{ background:"#E8F5E9", border:"1px solid #4CAF50", borderRadius:10, padding:"12px 18px", marginBottom:16, color:"#2E7D32", fontWeight:600 }}>✅ Order placed successfully! Transport will be assigned shortly.</div>}

      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <input type="text" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, minWidth:200 }} />
        <div style={{ display:"flex", gap:8 }}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ padding:"8px 16px", borderRadius:20, border:"1.5px solid", borderColor:cat===c?"#4CAF50":"#ddd", background:cat===c?"#4CAF50":"#fff", color:cat===c?"#fff":"#555", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
          {filtered.map(p => {
            const supplier = DB.users.find(u=>u.id===p.supplierId);
            return (
              <div key={p.id} className="card" style={{ position:"relative", overflow:"hidden" }}>
                <div style={{ fontSize:42, marginBottom:10, textAlign:"center", background:"#F9FBF7", borderRadius:10, padding:"16px", marginBottom:14 }}>{p.img}</div>
                <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>{p.category}</div>
                <div style={{ fontWeight:700, fontSize:16, color:"#1B4332", marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>by {supplier?.name}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontWeight:700, fontSize:20, color:"#2E7D32" }}>{formatK(p.price)}</div>
                  <div style={{ fontSize:12, color:"#888" }}>per {p.unit}</div>
                </div>
                <div style={{ background:"#FFF8E1", borderRadius:6, padding:"8px 10px", marginBottom:12, fontSize:12 }}>
                  <span style={{ color:"#E65100", fontWeight:600 }}>AI Prediction:</span> <span style={{ color:"#5D4037" }}>Est. price {formatK(p.predictedPrice)} by {p.predictedAvail}. Demand: </span>
                  <span style={{ color: p.demand==="High"?"#C62828":p.demand==="Medium"?"#E65100":"#2E7D32", fontWeight:600 }}>{p.demand}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <span className="badge" style={{ background:"#E8F5E9", color:"#2E7D32" }}>Stock: {p.stock}</span>
                  <span className="badge" style={{ background:"#E3F2FD", color:"#1565C0" }}>Season: {p.season}</span>
                </div>
                <button className="btn-primary" style={{ width:"100%", marginTop:12 }} onClick={()=>addToCart(p)}>Add to Cart</button>
              </div>
            );
          })}
        </div>

        {/* Cart */}
        <div className="card" style={{ position:"sticky", top:20, height:"fit-content" }}>
          <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>Your Cart ({cart.length})</h3>
          {cart.length === 0 ? (
            <div style={{ textAlign:"center", color:"#aaa", padding:"30px 0", fontSize:14 }}>Cart is empty.<br/>Browse products and add items.</div>
          ) : (
            <>
              {cart.map(item=>(
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{item.img} {item.name}</div>
                    <div style={{ fontSize:12, color:"#888" }}>×{item.qty} @ {formatK(item.price)}</div>
                  </div>
                  <div style={{ fontWeight:700, color:"#2E7D32" }}>{formatK(item.price*item.qty)}</div>
                </div>
              ))}
              <div style={{ borderTop:"2px solid #1B4332", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700 }}>Total</span>
                <span style={{ fontWeight:700, fontSize:18, color:"#1B4332" }}>{formatK(total)}</span>
              </div>
              <button className="btn-primary" style={{ width:"100%", marginTop:14 }} onClick={placeOrder}>Place Order & Request Delivery</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CropsPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:6 }}>Crop Knowledge Center 🌾</h2>
      <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Comprehensive planting guides for Zambian conditions.</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        {DB.cropData.map((c,i)=>(
          <div key={i} className="card" style={{ cursor:"pointer", border: selected?.name===c.name?"2px solid #4CAF50":"2px solid transparent", transition:"all 0.2s" }} onClick={()=>setSelected(c)}>
            <div style={{ fontSize:48, textAlign:"center", marginBottom:10 }}>{c.img}</div>
            <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, fontWeight:600, textAlign:"center", color:"#1B4332" }}>{c.name}</div>
            <div style={{ fontSize:12, color:"#888", textAlign:"center", marginTop:4 }}>Season: {c.season}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="card" style={{ border:"1px solid #C8E6C9" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <span style={{ fontSize:52 }}>{selected.img}</span>
            <div>
              <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:26, color:"#1B4332" }}>{selected.name} Growing Guide</h3>
              <p style={{ color:"#888", fontSize:13 }}>Recommended for Zambian climate conditions</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {[
              ["Soil Type","🌍",selected.soil],["Best Season","📅",selected.season],
              ["Spacing","📏",selected.spacing],["Fertilizer","🧪",selected.fertilizer],
              ["Common Diseases","🔬",selected.disease],["Expected Yield","📊",selected.yield],
              ["Harvest Time","🌾",selected.harvest],
            ].map(([label,icon,val])=>(
              <div key={label} style={{ background:"#F9FBF7", borderRadius:10, padding:"14px" }}>
                <div style={{ fontSize:11, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>{icon} {label}</div>
                <div style={{ fontSize:14, color:"#333", fontWeight:500 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherPage() {
  const w = DB.weather;
  const forecast = [
    { day:"Today", icon:"⛅", hi:22, lo:15, rain:10 },
    { day:"Thu", icon:"🌧", hi:20, lo:14, rain:80 },
    { day:"Fri", icon:"🌧", hi:18, lo:13, rain:75 },
    { day:"Sat", icon:"⛅", hi:21, lo:14, rain:30 },
    { day:"Sun", icon:"☀️", hi:25, lo:16, rain:5 },
    { day:"Mon", icon:"☀️", hi:27, lo:17, rain:5 },
    { day:"Tue", icon:"⛅", hi:24, lo:15, rain:15 },
  ];
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Weather & Climate 🌤</h2>
      <div style={{ background:"linear-gradient(135deg,#1B4332,#2D6A4F)", borderRadius:16, padding:28, marginBottom:20, color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:72, fontWeight:700, fontFamily:"'Crimson Pro',serif" }}>{w.temp}°C</div>
            <div style={{ fontSize:20, opacity:0.8 }}>{w.condition}</div>
            <div style={{ fontSize:14, opacity:0.6, marginTop:4 }}>Lusaka, Zambia</div>
          </div>
          <div style={{ textAlign:"right", display:"flex", flexDirection:"column", gap:8 }}>
            {[["💧","Humidity",`${w.humidity}%`],["💨","Wind",w.wind],["🌧","Rain in",w.rain]].map(([ic,label,val])=>(
              <div key={label} style={{ background:"rgba(255,255,255,0.1)", borderRadius:8, padding:"8px 14px", display:"flex", gap:8, alignItems:"center" }}>
                <span>{ic}</span><span style={{ fontSize:13 }}>{label}: <strong>{val}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {forecast.map((f,i)=>(
          <div key={i} className="card" style={{ flex:1, textAlign:"center", padding:16 }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>{f.day}</div>
            <div style={{ fontSize:28, marginBottom:6 }}>{f.icon}</div>
            <div style={{ fontWeight:700, fontSize:16, color:"#1B4332" }}>{f.hi}°</div>
            <div style={{ fontSize:12, color:"#aaa" }}>{f.lo}°</div>
            <div style={{ fontSize:11, color:"#1565C0", marginTop:4 }}>💧{f.rain}%</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ background:"#FFF8E1", border:"1px solid #FFD54F" }}>
        <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#E65100", marginBottom:12 }}>⚠️ Farming Advisory</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"🌧", msg:"Rain expected Thursday & Friday — delay fertilizer top-dressing until Saturday.", severity:"warning" },
            { icon:"🌱", msg:"Ideal soil moisture after rains. Good window to plant late-season vegetables.", severity:"good" },
            { icon:"🦟", msg:"High humidity increases armyworm risk. Inspect maize fields Wednesday morning.", severity:"danger" },
          ].map((a,i)=>(
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px", background:a.severity==="good"?"#E8F5E9":a.severity==="danger"?"#FFEBEE":"#FFF3E0", borderRadius:8 }}>
              <span>{a.icon}</span><span style={{ fontSize:13 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunityPage({ user }) {
  const [posts, setPosts] = useState([
    { id:1, author:"Joseph M.", role:"customer", text:"Anyone know a good supplier for SC403 seed in Chisamba area? Season starting soon.", time:"2h ago", likes:5 },
    { id:2, author:"Green Valley Farms", role:"supplier", text:"We have SC403 and Soybean seed back in stock. Order before end of May for early bird discount.", time:"5h ago", likes:12 },
    { id:3, author:"Agri Expert", role:"expert", text:"Reminder: apply D-Compound at planting time and Urea top dressing 6 weeks after emergence for best maize yields.", time:"1d ago", likes:28 },
  ]);
  const [newPost, setNewPost] = useState("");
  const post = () => {
    if (!newPost.trim()) return;
    setPosts(p=>[{ id:Date.now(), author:user.name, role:user.role, text:newPost, time:"Just now", likes:0 },...p]);
    setNewPost("");
  };
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Community & Expert Support 💬</h2>
      <div className="card" style={{ marginBottom:20 }}>
        <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Share a tip, ask a question, or post an update..." style={{ width:"100%", border:"1.5px solid #e0e0e0", borderRadius:8, padding:"12px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:14, resize:"vertical", minHeight:80, outline:"none" }} />
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
          <button className="btn-primary" onClick={post}>Post to Community</button>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {posts.map(p=>(
          <div key={p.id} className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background: p.role==="supplier"?"#E8F5E9":p.role==="transport"?"#E3F2FD":p.role==="expert"?"#FFF3E0":"#F3E5F5", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#1B4332" }}>{p.author.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{p.author}</div>
                  <div style={{ fontSize:11, color:"#888" }}>
                    <span className="badge" style={{ background:p.role==="expert"?"#FFF3E0":"#F1F8E9", color:p.role==="expert"?"#E65100":"#2E7D32", marginRight:4 }}>{p.role}</span>
                    {p.time}
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize:14, color:"#333", lineHeight:1.6 }}>{p.text}</p>
            <div style={{ marginTop:10, fontSize:12, color:"#888" }}>❤️ {p.likes} likes</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SUPPLIER VIEWS ─────────────────────────────────────────────────────────
function SupplierDashboard({ user }) {
  const myProducts = DB.products.filter(p=>p.supplierId===user.id);
  const myOrders = DB.orders.filter(o=>myProducts.find(p=>p.id===o.productId));
  const revenue = myOrders.reduce((a,b)=>a+b.total,0);
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Supplier Dashboard 🌾</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Products Listed", val:myProducts.length, icon:"📦", color:"#E8F5E9" },
          { label:"Total Revenue", val:formatK(revenue), icon:"💰", color:"#FFF8E1" },
          { label:"Active Orders", val:myOrders.filter(o=>o.status!=="Delivered").length, icon:"📋", color:"#E3F2FD" },
          { label:"Avg Rating", val:"4.8 ★", icon:"⭐", color:"#FFF3E0" },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{ background:s.color }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#1B4332" }}>{s.val}</div>
            <div style={{ fontSize:12, color:"#666" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>My Product Performance</h3>
        <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Product","Category","Price","Stock","Demand","Predicted Price"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myProducts.map(p=>(
              <tr key={p.id}>
                <td>{p.img} {p.name}</td>
                <td>{p.category}</td>
                <td style={{ fontWeight:600 }}>{formatK(p.price)}</td>
                <td>{p.stock} units</td>
                <td><span className="badge" style={{ background:p.demand==="High"?"#FFEBEE":p.demand==="Medium"?"#FFF8E1":"#E8F5E9", color:p.demand==="High"?"#C62828":p.demand==="Medium"?"#E65100":"#2E7D32" }}>{p.demand}</span></td>
                <td style={{ color:"#1565C0", fontWeight:600 }}>{formatK(p.predictedPrice)} ({p.predictedAvail})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplierInventory({ user }) {
  const myProducts = DB.products.filter(p=>p.supplierId===user.id);
  const [form, setForm] = useState({ name:"", category:"Seeds", price:"", unit:"", stock:"", season:"" });
  const [added, setAdded] = useState(false);
  const submit = () => {
    if (!form.name||!form.price) return;
    DB.products.push({ id:Date.now(), ...form, price:+form.price, stock:+form.stock, supplierId:user.id, predictedAvail:"TBD", predictedPrice:+form.price*1.05, demand:"Medium", img:"📦" });
    setAdded(true); setForm({name:"",category:"Seeds",price:"",unit:"",stock:"",season:""});
    setTimeout(()=>setAdded(false),2500);
  };
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Inventory Management 📦</h2>
      {added && <div style={{ background:"#E8F5E9", border:"1px solid #4CAF50", borderRadius:10, padding:"12px 18px", marginBottom:16, color:"#2E7D32", fontWeight:600 }}>✅ Product added successfully!</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
        <div className="card">
          <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>Current Inventory</h3>
          <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Product","Price","Stock","Season","Predicted Price"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myProducts.map(p=>(
                <tr key={p.id}>
                  <td>{p.img} {p.name}</td>
                  <td>{formatK(p.price)}</td>
                  <td style={{ color:p.stock<50?"#C62828":"#2E7D32", fontWeight:600 }}>{p.stock}</td>
                  <td>{p.season}</td>
                  <td style={{ color:"#1565C0", fontWeight:600 }}>{formatK(p.predictedPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background:"#F9FBF7" }}>
          <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>Add New Product</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input type="text" placeholder="Product name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ width:"100%" }} />
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ width:"100%" }}>
              {["Seeds","Fertilizer","Seedlings","Equipment","Produce"].map(c=><option key={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Price (ZMW)" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} style={{ width:"100%" }} />
            <input type="text" placeholder="Unit (e.g. 50kg bag)" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} style={{ width:"100%" }} />
            <input type="number" placeholder="Stock quantity" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} style={{ width:"100%" }} />
            <input type="text" placeholder="Season (e.g. Nov–Jan)" value={form.season} onChange={e=>setForm(f=>({...f,season:e.target.value}))} style={{ width:"100%" }} />
            <button className="btn-primary" onClick={submit}>Add to Inventory</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TRANSPORT VIEWS ────────────────────────────────────────────────────────
function TransportDashboard({ user }) {
  const myDeliveries = DB.deliveries.filter(d=>d.transportId===user.id);
  const earnings = myDeliveries.filter(d=>d.status==="Completed").reduce((a,b)=>a+b.fee,0);
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Transport Dashboard 🚚</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Deliveries", val:myDeliveries.length, icon:"📦", color:"#E3F2FD" },
          { label:"Total Earnings", val:formatK(earnings), icon:"💰", color:"#E8F5E9" },
          { label:"In Progress", val:myDeliveries.filter(d=>d.status==="In Progress").length, icon:"🚛", color:"#FFF8E1" },
          { label:"Rating", val:"4.9 ★", icon:"⭐", color:"#FFF3E0" },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{ background:s.color }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#1B4332" }}>{s.val}</div>
            <div style={{ fontSize:12, color:"#666" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:20 }}>
        <div className="card">
          <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>My Deliveries</h3>
          <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Order","Route","Distance","Fee","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myDeliveries.map(d=>(
                <tr key={d.id}>
                  <td>#ORD-{d.orderId}</td>
                  <td>{d.from} → {d.to}</td>
                  <td>{d.distance}</td>
                  <td style={{ fontWeight:600 }}>{formatK(d.fee)}</td>
                  <td><span className="badge" style={{ background:d.status==="Completed"?"#E8F5E9":"#FFF8E1", color:d.status==="Completed"?"#2E7D32":"#F57F17" }}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background:"#F9FBF7" }}>
          <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:12 }}>Vehicle Info</h3>
          {[["Truck Type",user.truckType||"3-ton Pickup"],["Status",user.available?"Available":"Busy"],["Location",user.location],["License","ZMB-4521-T"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #eee" }}>
              <span style={{ fontSize:13, color:"#888" }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop:14, padding:"12px", background:"#E8F5E9", borderRadius:8 }}>
            <div style={{ fontSize:12, color:"#2E7D32", fontWeight:600 }}>🔔 New Delivery Request</div>
            <div style={{ fontSize:12, color:"#555", marginTop:4 }}>Chisamba → Lusaka (110km) — K250 fee</div>
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <button className="btn-primary" style={{ flex:1, padding:"8px" }}>Accept</button>
              <button className="btn-outline" style={{ flex:1, padding:"8px" }}>Decline</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportDeliveries({ user }) {
  const pending = DB.orders.filter(o=>!o.transportId || o.status==="Pending");
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Available Deliveries 🚚</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
        {pending.map(o=>{
          const prod = DB.products.find(p=>p.id===o.productId);
          const customer = DB.users.find(u=>u.id===o.customerId);
          return (
            <div key={o.id} className="card" style={{ border:"1.5px solid #E3F2FD" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontWeight:700, color:"#1B4332", fontSize:15 }}>Order #{o.id}</span>
                <span className="badge" style={{ background:"#E3F2FD", color:"#1565C0" }}>{o.status}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13, color:"#555" }}>
                <div>📦 {prod?.img} {prod?.name} × {o.qty}</div>
                <div>👤 Customer: {customer?.name}</div>
                <div>📍 From: Chisamba → To: {customer?.location}</div>
                <div>📅 Order date: {o.date}</div>
                <div style={{ fontWeight:700, color:"#2E7D32", fontSize:15 }}>Delivery fee: K250</div>
              </div>
              <button className="btn-primary" style={{ width:"100%", marginTop:14 }} onClick={()=>{ o.transportId=user.id; o.status="In Transit"; alert("Delivery accepted! Navigate to Chisamba to pick up the order."); }}>Accept Delivery</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Market Prices (shared) ─────────────────────────────────────────────────
function MarketPricesPage() {
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:6 }}>Live Market Prices 📈</h2>
      <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Current commodity prices across Zambian markets.</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:24 }}>
        {DB.marketPrices.map((m,i)=>(
          <div key={i} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:"#1B4332" }}>{m.crop}</div>
              <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Zambian national average</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:700, color:"#2E7D32" }}>{m.price}</div>
              <div style={{ fontSize:13, color:m.trend==="up"?"#2E7D32":m.trend==="down"?"#C62828":"#888", fontWeight:600 }}>{m.trend==="up"?"↑":m.trend==="down"?"↓":"→"} {m.change}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ background:"#F9FBF7" }}>
        <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>AI Price Predictions (Next Season)</h3>
        <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Seed/Product","Current Price","Predicted Price","Availability","Demand","Advice"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {DB.products.map(p=>(
              <tr key={p.id}>
                <td>{p.img} {p.name}</td>
                <td>{formatK(p.price)}</td>
                <td style={{ fontWeight:600, color:"#1565C0" }}>{formatK(p.predictedPrice)}</td>
                <td>{p.predictedAvail}</td>
                <td><span className="badge" style={{ background:p.demand==="High"?"#FFEBEE":p.demand==="Medium"?"#FFF8E1":"#E8F5E9", color:p.demand==="High"?"#C62828":p.demand==="Medium"?"#E65100":"#2E7D32" }}>{p.demand}</span></td>
                <td style={{ fontSize:12, color:"#666" }}>{p.demand==="High"?"Buy early — prices rising":"Buy when needed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Earnings for Transport ─────────────────────────────────────────────────
function EarningsPage({ user }) {
  const myDeliveries = DB.deliveries.filter(d=>d.transportId===user.id);
  const total = myDeliveries.reduce((a,b)=>a+b.fee,0);
  const completed = myDeliveries.filter(d=>d.status==="Completed");
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Earnings 💰</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Earned", val:formatK(total), icon:"💰", color:"#E8F5E9" },
          { label:"This Month", val:formatK(250), icon:"📅", color:"#FFF8E1" },
          { label:"Deliveries Done", val:completed.length, icon:"✅", color:"#E3F2FD" },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{ background:s.color }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, color:"#1B4332" }}>{s.val}</div>
            <div style={{ fontSize:13, color:"#666" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#1B4332", marginBottom:16 }}>Earnings History</h3>
        <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Delivery","Route","Date","Fee","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myDeliveries.map(d=>(
              <tr key={d.id}>
                <td>#DEL-{d.id}</td>
                <td>{d.from} → {d.to}</td>
                <td>{d.date}</td>
                <td style={{ fontWeight:600, color:"#2E7D32" }}>{formatK(d.fee)}</td>
                <td><span className="badge" style={{ background:d.status==="Completed"?"#E8F5E9":"#FFF8E1", color:d.status==="Completed"?"#2E7D32":"#F57F17" }}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Supplier Orders ────────────────────────────────────────────────────────
function SupplierOrders({ user }) {
  const myProducts = DB.products.filter(p=>p.supplierId===user.id);
  const myOrders = DB.orders.filter(o=>myProducts.find(p=>p.id===o.productId));
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Incoming Orders 📋</h2>
      <div className="card">
        <table className="tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Order ID","Product","Qty","Total","Date","Status","Transport"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myOrders.map(o=>{
              const prod = DB.products.find(p=>p.id===o.productId);
              const transporter = DB.users.find(u=>u.id===o.transportId);
              return (
                <tr key={o.id}>
                  <td style={{ fontWeight:600 }}>#ORD-{o.id}</td>
                  <td>{prod?.img} {prod?.name}</td>
                  <td>{o.qty}</td>
                  <td style={{ fontWeight:600 }}>{formatK(o.total)}</td>
                  <td>{o.date}</td>
                  <td><span className="badge" style={{ background:o.status==="Delivered"?"#E8F5E9":o.status==="In Transit"?"#E3F2FD":"#FFF8E1", color:o.status==="Delivered"?"#2E7D32":o.status==="In Transit"?"#1565C0":"#F57F17" }}>{o.status}</span></td>
                  <td style={{ fontSize:12, color:"#888" }}>{transporter?.name||"Unassigned"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Route Map Placeholder ──────────────────────────────────────────────────
function RouteMapPage() {
  return (
    <div>
      <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:28, color:"#1B4332", marginBottom:20 }}>Route Map 🗺</h2>
      <div className="card" style={{ textAlign:"center", padding:"60px 20px", background:"linear-gradient(135deg,#F1F8E9,#E8F5E9)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🗺️</div>
        <h3 style={{ fontFamily:"'Crimson Pro',serif", fontSize:22, color:"#1B4332", marginBottom:8 }}>Live Route Navigation</h3>
        <p style={{ color:"#666", fontSize:14, maxWidth:400, margin:"0 auto", lineHeight:1.6 }}>GPS-based live routing, turn-by-turn navigation, and real-time delivery tracking would be integrated here via a maps API such as Google Maps or OpenStreetMap.</p>
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:24 }}>
          {[["📍","Current Job","Chisamba → Lusaka"],["📦","Cargo","D-Compound ×2"],["⏱","ETA","~1h 45min"]].map(([ic,label,val])=>(
            <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
              <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:600, marginTop:4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => { if (user) setActiveTab("dashboard"); }, [user]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  const renderContent = () => {
    if (user.role === "customer") {
      if (activeTab === "dashboard") return <CustomerDashboard user={user} />;
      if (activeTab === "market") return <CustomerMarket user={user} />;
      if (activeTab === "crops") return <CropsPage />;
      if (activeTab === "weather") return <WeatherPage />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    if (user.role === "supplier") {
      if (activeTab === "dashboard") return <SupplierDashboard user={user} />;
      if (activeTab === "inventory") return <SupplierInventory user={user} />;
      if (activeTab === "orders") return <SupplierOrders user={user} />;
      if (activeTab === "market") return <MarketPricesPage />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    if (user.role === "transport") {
      if (activeTab === "dashboard") return <TransportDashboard user={user} />;
      if (activeTab === "deliveries") return <TransportDeliveries user={user} />;
      if (activeTab === "map") return <RouteMapPage />;
      if (activeTab === "earnings") return <EarningsPage user={user} />;
      if (activeTab === "community") return <CommunityPage user={user} />;
    }
    return <div>Coming soon</div>;
  };

  return (
    <Shell user={user} onLogout={() => setUser(null)} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}
