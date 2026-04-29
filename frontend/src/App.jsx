import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ═══════════════════════════════════════
//  BACKEND API URL
//  Change this if your backend runs on a different port
// ═══════════════════════════════════════
const API = "http://localhost:8000";

// ═══════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════
const PC = {
  Instagram: { color: "#E1306C", light: "#FFF0F5", grad: ["#f09433", "#dc2743", "#cc2366"] },
  Facebook:  { color: "#1877F2", light: "#EEF4FF", grad: ["#1877F2", "#42A5F5"] },
  LinkedIn:  { color: "#0A66C2", light: "#EBF4FF", grad: ["#0A66C2", "#1E88E5"] },
  YouTube:   { color: "#FF0000", light: "#FFF0F0", grad: ["#FF0000", "#FF6B6B"] },
  TikTok:    { color: "#2DD4CF", light: "#F0FFFE", grad: ["#2DD4CF", "#06B6D4"] },
};
const PIE_COLS = ["#E1306C", "#1877F2", "#0A66C2", "#FF0000", "#2DD4CF"];
const PLATFORM_NAMES = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok"];

// ═══════════════════════════════════════
//  REUSABLE COMPONENTS
// ═══════════════════════════════════════
function Ava({ platform, size = 36 }) {
  const p = PC[platform] || { grad: ["#7C3AED", "#A78BFA"] };
  const label = platform ? platform.slice(0, 2).toUpperCase() : "??";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${p.grad[0]},${p.grad[p.grad.length - 1]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 900, fontSize: size * 0.32,
    }}>{label}</div>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 99,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function KCard({ icon, value, label, color, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "18px 20px",
      border: "1.5px solid #F0EDF8", boxShadow: `0 2px 14px ${color}0e`,
      display: "flex", flexDirection: "column", gap: 5,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -14, right: -14, width: 56, height: 56, borderRadius: "50%", background: color + "18" }} />
      <span style={{ fontSize: 19 }}>{icon}</span>
      <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</div>}
    </div>
  );
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1F2937", borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>
          {p.name}: {Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "#9CA3AF", fontSize: 13 }}>
      <span>⏳</span> {text}
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", color: "#DC2626", fontSize: 13 }}>
      ⚠️ {message}
    </div>
  );
}

// ═══════════════════════════════════════
//  PAGE 1 — OVERVIEW
// ═══════════════════════════════════════
function OverviewPage({ filter }) {
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const platform = filter === "All" ? "" : `?platform=${filter}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/api/analytics/overview${platform}`).then(r => r.json()),
      fetch(`${API}/api/analytics/timeseries${platform}`).then(r => r.json()),
      fetch(`${API}/api/analytics/platforms`).then(r => r.json()),
      fetch(`${API}/api/analytics/content-types${platform}`).then(r => r.json()),
    ])
      .then(([ov, ts, pl, ct]) => {
        setOverview(ov.data);
        setTimeseries(ts.data || []);
        setPlatforms(pl.data || []);
        setContentTypes(ct.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to backend. Make sure the server is running on port 8000.");
        setLoading(false);
      });
  }, [filter]);

  if (loading) return <LoadingSpinner text="Fetching analytics from backend..." />;
  if (error) return <ErrorBox message={error} />;
  if (!overview) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 11 }}>
        <KCard icon="👥" value={overview.total_followers}  label="Total Followers"  color="#7C3AED" sub="Across all platforms" />
        <KCard icon="❤️" value={overview.total_likes}      label="Total Likes"      color="#E1306C" sub={`${overview.avg_likes} avg/post`} />
        <KCard icon="💬" value={overview.total_comments}   label="Comments"         color="#F59E0B" sub="All platforms" />
        <KCard icon="🔁" value={overview.total_shares}     label="Shares"           color="#10B981" sub="All platforms" />
        <KCard icon="🔖" value={overview.total_saves}      label="Saves"            color="#3B82F6" sub="Saved by users" />
        <KCard icon="📈" value={`${overview.engagement_rate}%`} label="Eng. Rate"  color="#8B5CF6" sub="(likes+cmts+shares)/impressions" />
        <KCard icon="▶️" value={overview.total_views}      label="Video Views"      color="#FF0000" sub="YT + TikTok + Reels" />
        <KCard icon="🎯" value={overview.total_reach}      label="Total Reach"      color="#0A66C2" sub="Unique accounts" />
      </div>

      <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: "1.5px solid #F0EDF8" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 14 }}>📊 Engagement Trend — Last 100 Days</div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={timeseries} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.28} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.18} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF0000" stopOpacity={0.15} /><stop offset="100%" stopColor="#FF0000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={9} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="likes" name="Likes" stroke="#7C3AED" fill="url(#gL)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="reach" name="Reach" stroke="#10B981" fill="url(#gR)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="views" name="Video Views" stroke="#FF0000" fill="url(#gV)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: "1.5px solid #F0EDF8" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14 }}>🌐 Platform Share</div>
          <ResponsiveContainer width="100%" height={185}>
            <PieChart>
              <Pie data={platforms} dataKey="engagement" nameKey="name" cx="50%" cy="50%"
                outerRadius={76} innerRadius={32}
                label={({ name, percent }) => `${name.slice(0, 2)} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {platforms.map((_, i) => <Cell key={i} fill={PIE_COLS[i]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: "1.5px solid #F0EDF8" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14 }}>🎬 Best Content Format</div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={contentTypes} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip content={<TT />} />
              <Bar dataKey="avgEng" name="Avg Engagement" radius={[0, 6, 6, 0]} fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  PAGE 2 — PLATFORMS
// ═══════════════════════════════════════
function PlatformsPage() {
  const [sel, setSel] = useState("Instagram");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/platforms/${sel}`)
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false); })
      .catch(() => { setError("Could not load platform data."); setLoading(false); });
  }, [sel]);

  const p = PC[sel] || PC.Instagram;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PLATFORM_NAMES.map(name => {
          const ap = PC[name];
          const active = sel === name;
          return (
            <button key={name} onClick={() => setSel(name)} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "10px 16px", borderRadius: 14,
              cursor: "pointer", border: "none", transition: "all .15s",
              background: active ? ap.color : "#fff",
              boxShadow: active ? `0 4px 18px ${ap.color}40` : "0 1px 4px rgba(0,0,0,.06)",
              outline: active ? "none" : `2px solid ${ap.color}28`,
            }}>
              <Ava platform={name} size={26} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: active ? "#fff" : "#111827" }}>{name}</div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && <LoadingSpinner text={`Loading ${sel} data...`} />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && data && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: `2px solid ${p.color}30`, boxShadow: `0 4px 24px ${p.color}10` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <Ava platform={sel} size={50} />
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#111827" }}>{sel}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{data.handle}</div>
              <Chip label={`via ${data.api_source}`} color={p.color} bg={p.light} />
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: p.color }}>{data.followers?.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>followers</div>
              <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>+{data.growth} this week</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 18 }}>
            {[["❤️", data.likes, p.color], ["💬", data.comments, "#F59E0B"], ["🔁", data.shares, "#10B981"],
              ["▶️", data.views, "#FF0000"], ["📈", `${data.engagement_rate}%`, "#8B5CF6"], ["🎯", data.reach, "#3B82F6"]
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: c }}>{typeof v === "number" ? v.toLocaleString() : v}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>30-day engagement trend</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={data.timeseries || []} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="platG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={p.color} stopOpacity={0.3} /><stop offset="100%" stopColor={p.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="engagement" name="Engagement" stroke={p.color} fill="url(#platG)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  PAGE 3 — INSIGHTS
// ═══════════════════════════════════════
function InsightsPage() {
  const [hours, setHours] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/analytics/best-hours`).then(r => r.json()),
      fetch(`${API}/api/analytics/hashtags`).then(r => r.json()),
    ])
      .then(([h, t]) => {
        setHours(h.data || []);
        setTags(t.data || []);
        setLoading(false);
      })
      .catch(() => { setError("Could not load insights data."); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner text="Loading insights..." />;
  if (error) return <ErrorBox message={error} />;

  const bestH = hours.length ? hours.reduce((bi, h, i) => h.engagement > hours[bi].engagement ? i : bi, 0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: "1.5px solid #F0EDF8" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 14 }}>⏰ Best Hours to Post</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hours} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <Tooltip content={<TT />} />
            <Bar dataKey="engagement" name="Avg Engagement" radius={[4, 4, 0, 0]}>
              {hours.map((_, i) => <Cell key={i} fill={i === bestH ? "#7C3AED" : i === bestH - 1 || i === bestH + 1 ? "#A78BFA" : "#E5E7EB"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#fff", borderRadius: 20, padding: 22, border: "1.5px solid #F0EDF8" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 14 }}>#️⃣ Hashtag Performance</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tags.map((t, i) => (
            <div key={t.tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 155 }}>{t.tag}</div>
              <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 99, height: 7, overflow: "hidden" }}>
                <div style={{
                  width: `${(t.reach / (tags[0]?.reach || 1)) * 100}%`, height: "100%",
                  background: `hsl(${250 - i * 20},70%,58%)`, borderRadius: 99, transition: "width .6s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", minWidth: 75, textAlign: "right" }}>{t.reach?.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", minWidth: 44, textAlign: "right" }}>{t.posts}p</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  PAGE 4 — PACKAGES
// ═══════════════════════════════════════
function PackagesPage() {
  const [billing, setBilling] = useState("monthly");
  const [chosen, setChosen] = useState("Pro");

  const plans = [
    { name: "Starter", icon: "🌱", color: "#10B981", light: "#ECFDF5", monthly: 0, annual: 0, features: ["2 platforms", "500 posts/month", "1 user", "Basic reports", "Email alerts"] },
    { name: "Pro", icon: "⚡", color: "#7C3AED", light: "#F5F0FF", monthly: 9, annual: 7, popular: true, features: ["All 5 platforms", "5,000 posts/month", "3 users", "Advanced analytics", "AI insights", "Hashtag tracker", "Best-time suggestions", "Priority email"] },
    { name: "Business", icon: "🏢", color: "#1877F2", light: "#EEF4FF", monthly: 19, annual: 15, features: ["All 5 platforms", "25,000 posts/month", "10 users", "Full analytics", "API access", "Custom reports", "Competitor tracking", "Live chat"] },
    { name: "Enterprise", icon: "🚀", color: "#E1306C", light: "#FFF0F5", monthly: 49, annual: 39, features: ["All 5 platforms", "Unlimited posts", "Unlimited users", "Custom dashboards", "Dedicated API", "SLA guarantee", "Onboarding call", "Account manager"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "linear-gradient(135deg,#7C3AED,#A78BFA)", borderRadius: 18, padding: "18px 24px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900 }}>💸 Save up to 94% vs competitors</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 3 }}>Hootsuite €159/mo · Brandwatch €800/mo · Our Pro plan: €9/mo</div>
        </div>
        <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,.15)", borderRadius: 99, padding: 4 }}>
          {["monthly", "annual"].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{ padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "none", background: billing === b ? "#fff" : "transparent", color: billing === b ? "#7C3AED" : "#fff" }}>
              {b === "annual" ? "Annual (−20%)" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
        {plans.map(pl => {
          const price = billing === "annual" ? pl.annual : pl.monthly;
          const active = chosen === pl.name;
          return (
            <div key={pl.name} onClick={() => setChosen(pl.name)} style={{ background: "#fff", borderRadius: 20, padding: 20, cursor: "pointer", transition: "all .2s", border: active ? `2.5px solid ${pl.color}` : "1.5px solid #F0EDF8", boxShadow: active ? `0 4px 28px ${pl.color}25` : "0 1px 4px rgba(0,0,0,.04)", position: "relative" }}>
              {pl.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: pl.color, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 12px", borderRadius: 99 }}>⭐ Most Popular</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: pl.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{pl.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{pl.name}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: pl.color }}>{price === 0 ? "Free" : `€${price}`}</span>
                {price > 0 && <span style={{ fontSize: 12, color: "#9CA3AF" }}>/mo</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                {pl.features.map(f => (<div key={f} style={{ display: "flex", gap: 6, fontSize: 12, color: "#374151" }}><span style={{ color: pl.color, fontWeight: 900 }}>✓</span>{f}</div>))}
              </div>
              <button style={{ width: "100%", padding: "9px", borderRadius: 11, fontSize: 12, fontWeight: 800, cursor: "pointer", background: active ? pl.color : "transparent", color: active ? "#fff" : pl.color, border: `2px solid ${pl.color}`, transition: "all .15s" }}>
                {active ? "✓ Selected" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════
const TABS = [
  { id: "overview",  label: "Overview",  icon: "📊" },
  { id: "platforms", label: "Platforms", icon: "🌐" },
  { id: "insights",  label: "Insights",  icon: "💡" },
  { id: "packages",  label: "Packages",  icon: "💎" },
];

export default function SocialPulseApp() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1.5px solid #F0EDF8", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 14px rgba(124,58,237,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📡</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", letterSpacing: -0.5 }}>
              Social<span style={{ color: "#7C3AED" }}>Pulse</span>
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>Digital & Social Media Analytics</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {PLATFORM_NAMES.map(name => <Chip key={name} label={name} color={PC[name].color} bg={PC[name].light} />)}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 3, background: "#fff", padding: 4, borderRadius: 14, border: "1.5px solid #F0EDF8", flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", transition: "all .15s", background: tab === t.id ? "#7C3AED" : "transparent", color: tab === t.id ? "#fff" : "#6B7280" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {tab === "overview" && (
            <div style={{ display: "flex", gap: 3, background: "#fff", padding: 4, borderRadius: 14, border: "1.5px solid #F0EDF8" }}>
              {["All", ...PLATFORM_NAMES].map(pl => (
                <button key={pl} onClick={() => setFilter(pl)} style={{ padding: "5px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", transition: "all .15s", background: filter === pl ? (PC[pl]?.color || "#7C3AED") : "transparent", color: filter === pl ? "#fff" : "#6B7280" }}>
                  {pl === "All" ? "All" : pl.slice(0, 2)}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "overview"  && <OverviewPage  filter={filter} />}
        {tab === "platforms" && <PlatformsPage />}
        {tab === "insights"  && <InsightsPage />}
        {tab === "packages"  && <PackagesPage />}
      </div>

      <div style={{ textAlign: "center", padding: "22px", color: "#D1D5DB", fontSize: 11 }}>
        SocialPulse · React + Recharts frontend · FastAPI + PostgreSQL + Redis backend · Sonali Mitua · Bachelor's Thesis 2026
      </div>
    </div>
  );
}
