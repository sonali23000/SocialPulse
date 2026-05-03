import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";


//  BACKEND API URL


const API = "http://localhost:8000";


//  DESIGN TOKENS

const PC = {
  Instagram: { color: "#E1306C", light: "#FFF0F5", grad: ["#f09433", "#dc2743", "#cc2366"] },
  Facebook:  { color: "#1877F2", light: "#EEF4FF", grad: ["#1877F2", "#42A5F5"] },
  LinkedIn:  { color: "#0A66C2", light: "#EBF4FF", grad: ["#0A66C2", "#1E88E5"] },
  YouTube:   { color: "#FF0000", light: "#FFF0F0", grad: ["#FF0000", "#FF6B6B"] },
  TikTok:    { color: "#2DD4CF", light: "#F0FFFE", grad: ["#2DD4CF", "#06B6D4"] },
};
const PIE_COLS = ["#E1306C", "#1877F2", "#0A66C2", "#FF0000", "#2DD4CF"];
const PLATFORM_NAMES = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok"];


//  REUSABLE COMPONENTS

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


//  PAGE 1 — OVERVIEW

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

{/* ── PLATFORM SHARE ── */}
<div style={{
  background: "linear-gradient(145deg, #ffffff, #faf7ff)",
  borderRadius: 24,
  padding: "24px 24px 16px",
  border: "1.5px solid #ede9fe",
  boxShadow: "0 4px 24px rgba(124,58,237,0.07)"
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
    <span style={{
      background: "linear-gradient(135deg,#7C3AED,#a78bfa)",
      borderRadius: 10, padding: "5px 10px",
      fontSize: 15
    }}>🌐</span>
    <span style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.3px" }}>
      Platform Share
    </span>
  </div>
  <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12, marginTop: 2 }}>
    Engagement distribution across platforms
  </p>
  <ResponsiveContainer width="100%" height={210}>
    <PieChart>
      <Pie
        data={platforms}
        dataKey="engagement"
        nameKey="name"
        cx="50%" cy="50%"
        outerRadius={82}
        innerRadius={42}
        paddingAngle={3}
        label={({ name, percent }) =>
          `${name.slice(0, 2)} ${(percent * 100).toFixed(0)}%`
        }
        labelLine={false}
        fontSize={11}
        fontWeight={700}
      >
        {platforms.map((_, i) => (
          <Cell key={i} fill={PIE_COLS[i]} />
        ))}
      </Pie>
      <Tooltip content={<TT />} />
      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
      />
    </PieChart>
  </ResponsiveContainer>
</div>

{/* ── BEST CONTENT FORMAT ── */}
<div style={{
  background: "linear-gradient(145deg, #ffffff, #faf7ff)",
  borderRadius: 24,
  padding: "24px 24px 16px",
  border: "1.5px solid #ede9fe",
  boxShadow: "0 4px 24px rgba(124,58,237,0.07)"
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
    <span style={{
      background: "linear-gradient(135deg,#EC4899,#f472b6)",
      borderRadius: 10, padding: "5px 10px",
      fontSize: 15
    }}>🎬</span>
    <span style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.3px" }}>
      Best Content Format
    </span>
  </div>
  <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12, marginTop: 2 }}>
    Average engagement score by content type
  </p>
  <ResponsiveContainer width="100%" height={210}>
    <BarChart
      data={contentTypes}
      layout="vertical"
      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
      <XAxis
        type="number"
        tick={{ fontSize: 10, fill: "#9CA3AF" }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        type="category"
        dataKey="type"
        tick={{ fontSize: 11, fill: "#374151", fontWeight: 700 }}
        tickLine={false}
        axisLine={false}
        width={65}
      />
      <Tooltip content={<TT />} />
      <Bar
        dataKey="avgEng"
        name="Avg Engagement"
        radius={[0, 8, 8, 0]}
        fill="url(#barGrad)"
        maxBarSize={22}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
</div>
    </div>
  );
}


//  PAGE 2 — PLATFORMS

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


//  PAGE 3 — GROWTH TIPS

function GrowthTipsPage() {
  const tips = [
    {
      category: "🔥 Go Viral",
      color: "#FF4D4D",
      light: "#FFF0F0",
      items: [
        { title: "Hook in the first 3 seconds", desc: "On TikTok and Reels, viewers decide in 3 seconds. Start with a bold statement, a question, or something visually surprising. Never start with 'Hi guys'." },
        { title: "Use trending audio early", desc: "When a sound is trending but not yet overused (under 50K uses on TikTok), jump on it fast. Early adopters get the algorithm push." },
        { title: "Post at peak hours", desc: "Best windows: 7–9 AM, 12–2 PM, and 7–10 PM in your audience's timezone. Consistency beats occasional viral luck." },
        { title: "Reply to comments with a video", desc: "On TikTok, replying to a comment with a video doubles your content output and keeps the algorithm feeding your profile." },
      ]
    },
    {
      category: "📈 Grow Your Reach",
      color: "#7C3AED",
      light: "#F5F0FF",
      items: [
        { title: "Use 3–5 niche hashtags, not 30 generic ones", desc: "#makeup has 50M posts. #koreanglassskinroutine has 80K. Niche tags put you in front of people who actually care." },
        { title: "Collaborate with creators at your level", desc: "Don't only aim for big names. Creators with similar follower counts have loyal, engaged audiences. A shoutout swap can bring 500–2000 new followers." },
        { title: "Cross-post strategically", desc: "Post on TikTok first, wait 24h, then share the same video to Instagram Reels and YouTube Shorts. Each platform treats it as fresh content." },
        { title: "Engage within the first 30 minutes", desc: "Right after posting, reply to every comment and like other posts in your niche. This signals activity to the algorithm and boosts distribution." },
      ]
    },
    {
      category: "🌊 Ride Trends",
      color: "#0EA5E9",
      light: "#F0F9FF",
      items: [
        { title: "Check TikTok Creative Center weekly", desc: "TikTok's own Creative Center shows trending sounds, hashtags and content formats by country. Visit it every Monday to plan your week." },
        { title: "Put your own spin on trends", desc: "Don't just copy a trend — add your niche to it. A makeup artist doing the 'get ready with me' trend while reacting to a viral story gets double the algorithm love." },
        { title: "Use Google Trends for content ideas", desc: "Search your niche on Google Trends and filter by 'past 7 days'. Rising topics there often haven't hit social media yet — you can be first." },
        { title: "React or duet trending content", desc: "Duets and Stitches on TikTok borrow reach from the original video. React to something with 1M+ views and you inherit part of that audience." },
      ]
    },
    {
      category: "💄 Beauty & Makeup Creator Tips",
      color: "#EC4899",
      light: "#FFF0F8",
      items: [
        { title: "Before & after is king", desc: "Side-by-side transformation videos consistently outperform tutorials in reach. Show the before clearly, then the dramatic after. Keep it under 30 seconds." },
        { title: "Use product names in captions", desc: "People search for specific products. 'Charlotte Tilbury Flawless Filter dupe' will get found; 'my fave base' will not." },
        { title: "POV and GRWM formats have built-in audiences", desc: "\"POV: doing my makeup for a 5-star dinner\" or \"GRWM for a first date\" tap into emotional storytelling which gets shared more than how-to content." },
        { title: "Tag brands — even without a deal", desc: "Tagging brands gets their attention and sometimes a reshare to their audience. Many brand deals start from an organic tag that impressed their team." },
      ]
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
        borderRadius: 24, padding: "28px 28px",
        color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: 24, top: 12, fontSize: 72, opacity: 0.15 }}>🚀</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Creator Growth Hub</div>
        <div style={{ fontSize: 13, opacity: 0.85, maxWidth: 520, lineHeight: 1.6 }}>
          Practical tips to go viral, grow your reach and stay ahead of trends — built for social media creators like you.
        </div>
      </div>

      {tips.map(section => (
        <div key={section.category} style={{
          background: "#fff", borderRadius: 24,
          border: `1.5px solid ${section.light}`,
          boxShadow: `0 4px 20px ${section.color}18`,
          overflow: "hidden"
        }}>
          <div style={{
            background: section.light, padding: "14px 22px",
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: `1.5px solid ${section.color}22`
          }}>
            <span style={{ fontSize: 18 }}>{section.category.split(" ")[0]}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: section.color }}>
              {section.category.split(" ").slice(1).join(" ")}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {section.items.map((tip, i) => (
              <div key={i} style={{
                padding: "18px 22px",
                borderRight: i % 2 === 0 ? "1px solid #F3F4F6" : "none",
                borderBottom: i < 2 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    minWidth: 28, height: 28, borderRadius: 8,
                    background: section.light,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: section.color, marginTop: 1
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 5 }}>{tip.title}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{tip.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{
        background: "linear-gradient(135deg, #faf7ff, #fff0f8)",
        borderRadius: 20, padding: "18px 24px",
        border: "1.5px solid #ede9fe",
        display: "flex", alignItems: "center", gap: 14
      }}>
        <span style={{ fontSize: 32 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e1b4b", marginBottom: 3 }}>Consistency beats perfection</div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
            Posting 4× a week with average content beats posting once a week with perfect content. The algorithm rewards frequency and engagement signals — keep showing up.
          </div>
        </div>
      </div>
    </div>
  );
}


//  PAGE 4 — PACKAGES

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


//  MAIN APP

const TABS = [
  { id: "overview",  label: "Overview",  icon: "📊" },
  { id: "platforms", label: "Platforms", icon: "🌐" },
  { id: "growthtips", label: "Growth Tips", icon: "🚀" },
  { id: "packages",  label: "Packages",  icon: "💎" },
];

const CREATOR_QUOTES = [
  { text: "Consistency is more important than perfection.", author: "Gary Vee" },
  { text: "Your story is what makes people follow you, not your filter.", author: "Unknown" },
  { text: "Post with purpose. Every caption, every hashtag, every reel.", author: "Creator Mindset" },
  { text: "The algorithm rewards those who show up every day.", author: "Social Media wisdom" },
  { text: "Authenticity converts. Perfection just looks pretty.", author: "Unknown" },
  { text: "Trending audio + your niche = free reach.", author: "TikTok creators" },
  { text: "Your next video could change someone's life. Post it.", author: "Creator Mindset" },
  { text: "Engagement beats follower count every single time.", author: "Marketing truth" },
];

const BEST_POST_TIMES = [
  { hour: 7,  label: "7 AM",  note: "Morning scroll crowd ☀️" },
  { hour: 12, label: "12 PM", note: "Lunch break viewers 🍱" },
  { hour: 17, label: "5 PM",  note: "After work peak 🏃" },
  { hour: 19, label: "7 PM",  note: "Prime time audience 🌙" },
  { hour: 21, label: "9 PM",  note: "Late night scrollers 🌟" },
];

const TRENDING_TAGS = [
  "#GlowUp", "#MakeupTutorial", "#GRWM", "#SkincareTips", "#ContentCreator",
  "#ViralMakeup", "#BeautyTips", "#TikTokMakeup", "#ReelsViral", "#MakeupLooks",
];

function HeaderWidget() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("quote");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const q = setInterval(() => setQuoteIdx(i => (i + 1) % CREATOR_QUOTES.length), 6000);
    return () => clearInterval(q);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const best = BEST_POST_TIMES.reduce((prev, curr) =>
    Math.abs(curr.hour - hour) < Math.abs(prev.hour - hour) ? curr : prev
  );
  const isGoodTime = Math.abs(best.hour - hour) <= 1;
  const q = CREATOR_QUOTES[quoteIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, maxWidth: 340 }}>
      <div style={{ display: "flex", gap: 3, background: "#F5F0FF", borderRadius: 10, padding: 3 }}>
        {[{ id: "quote", icon: "💬" }, { id: "posttime", icon: "⏰" }, { id: "hashtags", icon: "🔥" }].map(tb => (
          <button key={tb.id} onClick={() => setActiveTab(tb.id)} style={{
            border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 13,
            cursor: "pointer", transition: "all .15s",
            background: activeTab === tb.id ? "#7C3AED" : "transparent",
            color: activeTab === tb.id ? "#fff" : "#9CA3AF",
          }}>{tb.icon}</button>
        ))}
      </div>

      {activeTab === "quote" && (
        <div style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", borderRadius: 14, padding: "10px 14px", maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, fontStyle: "italic" }}>"{q.text}"</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 4, textAlign: "right" }}>— {q.author}</div>
        </div>
      )}

      {activeTab === "posttime" && (
        <div style={{ background: isGoodTime ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#F59E0B,#D97706)", borderRadius: 14, padding: "10px 14px", minWidth: 220 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>🕐 Now: {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{isGoodTime ? "✅ Great time to post!" : `⏳ Next best: ${best.label}`}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{best.note}</div>
        </div>
      )}

      {activeTab === "hashtags" && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", border: "1.5px solid #ede9fe", minWidth: 260, boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6, fontWeight: 700 }}>🔥 Trending for Beauty Creators</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {TRENDING_TAGS.map(tag => (
              <span key={tag} style={{ background: "linear-gradient(135deg,#F5F0FF,#FFF0F8)", color: "#7C3AED", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid #ede9fe" }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialPulseApp() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState("app"); // "app" | "sign in" | "Get started"
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
        <HeaderWidget />
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
        {tab === "growthtips" && <GrowthTipsPage />}
        {tab === "packages"  && <PackagesPage />}
      </div>

      <Footer />
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const footerSections = [
    { title: "Product", links: ["Overview", "Platforms", "Growth Tips", "Packages"] },
    { title: "Platforms", links: ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn"] },
    { title: "Project", links: ["About", "Tech Stack", "GitHub", "Documentation"] },
  ];
  return (
    <footer style={{ background: "#0F0D1A", color: "#9CA3AF", marginTop: 60, padding: "48px 24px 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 44 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>📡</span>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                Social<span style={{ color: "#A78BFA" }}>Pulse</span>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6B7280", maxWidth: 260, margin: 0 }}>
              Real-time analytics for creators and brands — track your growth across all platforms.
            </p>
          </div>
          {footerSections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                {sec.title}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {sec.links.map(link => (
                  <li key={link}>
                    <span style={{ fontSize: 13, color: "#6B7280", cursor: "pointer" }}
                      onMouseEnter={e => e.target.style.color = "#A78BFA"}
                      onMouseLeave={e => e.target.style.color = "#6B7280"}>
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: "#1F1B2E", marginBottom: 22 }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#4B5563" }}>
  Copyright © {year} SocialPulse. All Rights Reserved.
</div>
          
        </div>
      </div>
    </footer>
  );
}
