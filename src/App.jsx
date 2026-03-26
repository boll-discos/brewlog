import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://pzidzjhgferwctbugkoa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aWR6amhnZmVyd2N0YnVna29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDA5OTEsImV4cCI6MjA4OTI3Njk5MX0.hZ_obS8UZ0NFKbx2a6OSFwS8A5MZmrJf0k0qjUl9NEs";
const sb = createClient(SUPA_URL, SUPA_KEY);

const todayStr = () => new Date().toISOString().split("T")[0];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const dayName = (ds) => DAYS[new Date(ds + "T12:00:00").getDay()];
const BEER_TYPES = [
  {emoji:"🍺",name:"Lager"},{emoji:"🍻",name:"IPA"},{emoji:"🥃",name:"Stout"},
  {emoji:"🌾",name:"Wheat"},{emoji:"🍋",name:"Sour"},{emoji:"🌿",name:"Pale Ale"},
  {emoji:"🍂",name:"Porter"},{emoji:"✨",name:"Other"},
];
const AVATARS = ["🍺","🍻","🥃","🌊","🔥","💀","👑","🦅","🐺","🎯","⚡","🏆"];
const XP_PER_BEER = 10;
const LEVELS = [
  {min:0,label:"Rookie Sipper",icon:"🌱"},
  {min:100,label:"Casual Drinker",icon:"🍺"},
  {min:300,label:"Bar Regular",icon:"🍻"},
  {min:600,label:"Hop Head",icon:"🔥"},
  {min:1000,label:"Brew Master",icon:"⚡"},
  {min:2000,label:"Legendary Pint",icon:"👑"},
];
const getLevel = (xp) => [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0];
const getLevelPct = (xp) => {
  const cur = [...LEVELS].reverse().find(l => xp >= l.min);
  const next = LEVELS[LEVELS.findIndex(l => l.min > xp)];
  if (!next) return 100;
  return Math.round(((xp - (cur?.min || 0)) / (next.min - (cur?.min || 0))) * 100);
};
const BADGES = [
  {id:"first",  icon:"🎉",label:"First Sip",    desc:"Log your first beer",    check:(e)=>e>=1},
  {id:"ten",    icon:"🔟",label:"Ten Down",      desc:"Log 10 beers",           check:(e)=>e>=10},
  {id:"fifty",  icon:"🌟",label:"Half Century",  desc:"Log 50 beers",           check:(e)=>e>=50},
  {id:"streak3",icon:"🔥",label:"Hat Trick",     desc:"3-day streak",           check:(_,s)=>s>=3},
  {id:"streak7",icon:"💥",label:"Week Warrior",  desc:"7-day streak",           check:(_,s)=>s>=7},
  {id:"friday", icon:"🎶",label:"TGIF",          desc:"Log a beer on Friday",   check:(_,__,e)=>e.some(x=>new Date(x.date+"T12:00:00").getDay()===5)},
  {id:"variety",icon:"🌈",label:"Variety Pack",  desc:"Try 5 different styles", check:(_,__,e)=>new Set(e.map(x=>x.beer_type)).size>=5},
  {id:"bignight",icon:"🌙",label:"Big Night",    desc:"5+ beers in one day",    check:(_,__,e)=>{const d={};e.forEach(x=>{d[x.date]=(d[x.date]||0)+1;});return Object.values(d).some(v=>v>=5);}},
];
const genCode = () => "BREW-" + Math.random().toString(36).slice(2,6).toUpperCase();
const calcStreak = (entries) => {
  const dm = {};
  entries.forEach(e => { dm[e.date] = true; });
  let s = 0, d = new Date();
  while (dm[d.toISOString().split("T")[0]]) { s++; d.setDate(d.getDate() - 1); }
  return s;
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Syne:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --a:#f59e0b;--a2:rgba(245,158,11,0.12);--a3:rgba(245,158,11,0.35);
  --g:#34d399;--b:#60a5fa;--p:#f472b6;--r:#f87171;
  --bg:#080810;--s:#12121e;--s2:#1c1c2e;--br:rgba(255,255,255,0.07);
  --mu:rgba(240,240,248,0.42);--tx:#f0f0f8;
}
body{background:var(--bg);font-family:'DM Sans',system-ui,sans-serif;color:var(--tx);}
.syne{font-family:'Syne',sans-serif;}
.card{background:var(--s);border:1px solid var(--br);border-radius:16px;padding:18px;}
.ptrack{height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;}
.pfill{height:100%;background:linear-gradient(90deg,var(--a),#fbbf24);border-radius:3px;transition:width .6s cubic-bezier(.4,0,.2,1);box-shadow:0 0 8px rgba(245,158,11,0.4);}
.input{width:100%;background:var(--s2);border:1.5px solid var(--br);color:var(--tx);border-radius:10px;padding:11px 14px;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;}
.input::placeholder{color:rgba(240,240,248,0.22);}
.input:focus{border-color:var(--a3);}
.btn{border:none;border-radius:10px;padding:13px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;letter-spacing:.02em;}
.btn-primary{background:var(--a);color:#000;}
.btn-primary:hover{background:#fbbf24;transform:translateY(-1px);}
.btn-ghost{background:var(--s2);color:var(--tx);border:1.5px solid var(--br);}
.btn-ghost:hover{border-color:var(--a3);}
.btn-danger{background:rgba(248,113,113,0.1);color:var(--r);border:1.5px solid rgba(248,113,113,0.2);}
.navtab{flex:1;border:none;background:none;color:var(--mu);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;transition:color .18s;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;}
.navtab.active{color:var(--a);}
.navdot{width:4px;height:4px;border-radius:50%;background:var(--a);opacity:0;transition:opacity .2s;margin-top:1px;}
.navtab.active .navdot{opacity:1;}
.logbtn{width:172px;height:172px;border-radius:50%;border:2px solid var(--a);background:radial-gradient(circle at 38% 32%,#1c1200,#080810);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;position:relative;transition:transform .15s,box-shadow .2s;outline:none;}
.logbtn::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:1px solid rgba(245,158,11,0.12);}
.logbtn::after{content:'';position:absolute;inset:-20px;border-radius:50%;border:1px solid rgba(245,158,11,0.05);}
.logbtn:hover{transform:scale(1.04);box-shadow:0 0 40px rgba(245,158,11,0.3);}
.logbtn:active{transform:scale(0.92);}
.logbtn-shine{position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 55%);pointer-events:none;}
.ring{position:absolute;inset:-10px;border-radius:50%;border:2px solid var(--a);animation:rout .75s ease-out forwards;pointer-events:none;}
@keyframes rout{0%{transform:scale(1);opacity:.7;}100%{transform:scale(2.4);opacity:0;}}
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--a);color:var(--a);padding:9px 22px;border-radius:100px;font-size:13px;font-weight:600;animation:tin .25s ease;z-index:999;box-shadow:0 4px 24px rgba(245,158,11,0.2);white-space:nowrap;pointer-events:none;}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(-6px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.badge-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:1000;display:flex;align-items:center;justify-content:center;}
.badge-modal{background:var(--s2);border:2px solid var(--g);border-radius:20px;padding:32px 40px;text-align:center;animation:bmin .4s cubic-bezier(.17,.67,.54,1.3);box-shadow:0 0 60px rgba(52,211,153,0.25),0 20px 60px rgba(0,0,0,0.6);}
@keyframes bmin{from{opacity:0;transform:scale(0.65);}to{opacity:1;transform:scale(1);}}
.typebtn{background:var(--s2);border:1.5px solid var(--br);border-radius:10px;padding:10px 4px;cursor:pointer;text-align:center;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:4px;outline:none;}
.typebtn:hover{border-color:var(--a3);background:var(--a2);}
.typebtn.sel{border-color:var(--a);background:var(--a2);}
.avbtn{width:52px;height:52px;border-radius:50%;border:2px solid var(--br);background:var(--s2);font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;outline:none;}
.avbtn:hover{border-color:var(--a3);}
.avbtn.sel{border-color:var(--a);background:var(--a2);box-shadow:0 0 12px rgba(245,158,11,0.3);}
.erow{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--br);}
.erow:last-child{border-bottom:none;}
.delbtn{background:none;border:none;color:rgba(240,80,80,0.3);cursor:pointer;padding:4px 8px;font-size:13px;border-radius:6px;transition:all .15s;flex-shrink:0;}
.delbtn:hover{color:rgba(240,80,80,0.75);background:rgba(240,80,80,0.08);}
.bar{background:linear-gradient(to top,rgba(245,158,11,0.35),var(--a));border-radius:3px 3px 0 0;min-height:3px;transition:height .5s cubic-bezier(.4,0,.2,1);}
.bar.today{background:linear-gradient(to top,rgba(52,211,153,0.4),var(--g));}
.bpill{background:var(--s2);border:1px solid var(--br);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px;transition:border-color .2s,transform .2s;}
.bpill.earned{border-color:rgba(245,158,11,0.35);background:linear-gradient(135deg,var(--s2),rgba(245,158,11,0.05));}
.bpill.earned:hover{transform:translateY(-1px);border-color:var(--a3);}
.squad-card{background:var(--s);border:1px solid var(--br);border-radius:14px;padding:16px;transition:border-color .2s,transform .2s;cursor:pointer;}
.squad-card:hover{border-color:var(--a3);transform:translateY(-1px);}
.squad-card.active-squad{border-color:var(--a);background:linear-gradient(135deg,var(--s),rgba(245,158,11,0.06));}
.lb-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--br);}
.lb-row:last-child{border-bottom:none;}
.lb-rank{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;width:28px;text-align:center;flex-shrink:0;}
.medal-1{color:#fbbf24;}.medal-2{color:#94a3b8;}.medal-3{color:#d97706;}
.tab-btn{flex:1;border:none;background:none;color:var(--mu);cursor:pointer;padding:8px 4px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border-bottom:2px solid transparent;transition:all .18s;}
.tab-btn.active{color:var(--a);border-bottom-color:var(--a);}
.err{color:var(--r);font-size:13px;padding:8px 12px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;}
.spin{width:20px;height:20px;border:2px solid var(--br);border-top-color:var(--a);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:2px;}
`;

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style><div className="spin"/>
    </div>
  );
  return <><style>{CSS}</style>{session ? <BrewApp session={session}/> : <AuthScreen/>}</>;
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("🍺");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignup() {
    if (!username.trim() || !password) return setErr("Fill in all fields.");
    if (username.length < 3) return setErr("Username must be at least 3 characters.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true); setErr("");
    const { data: existing } = await sb.from("profiles").select("id").eq("username", username.trim().toLowerCase()).single();
    if (existing) { setBusy(false); return setErr("That username is taken."); }
    const fakeEmail = username.trim().toLowerCase() + "@brewlog.app";
    const { data, error } = await sb.auth.signUp({ email: fakeEmail, password });
    if (error) { setBusy(false); return setErr(error.message); }
    await sb.from("profiles").insert({ id: data.user.id, username: username.trim().toLowerCase(), avatar_emoji: avatar });
    setBusy(false);
  }

  async function handleLogin() {
    if (!username.trim() || !password) return setErr("Fill in all fields.");
    setBusy(true); setErr("");
    const fakeEmail = username.trim().toLowerCase() + "@brewlog.app";
    const { error } = await sb.auth.signInWithPassword({ email: fakeEmail, password });
    if (error) { setBusy(false); return setErr("Wrong username or password."); }
    setBusy(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:56,marginBottom:8}}>🍺</div>
          <div className="syne" style={{fontSize:38,letterSpacing:"-0.02em"}}>BrewLog</div>
          <div style={{fontSize:13,color:"var(--mu)",marginTop:6}}>Track every pint with your crew</div>
        </div>
        <div className="card" style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:0,background:"var(--s2)",borderRadius:10,padding:4}}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                style={{flex:1,border:"none",borderRadius:8,padding:"9px",background:mode===m?"var(--a)":"transparent",color:mode===m?"#000":"var(--mu)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off"/>
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}/>
          {mode === "signup" && (
            <div>
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:10}}>Pick your avatar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {AVATARS.map(a => (
                  <button key={a} className={"avbtn" + (avatar === a ? " sel" : "")} onClick={() => setAvatar(a)}>{a}</button>
                ))}
              </div>
            </div>
          )}
          {err && <div className="err">{err}</div>}
          <button className="btn btn-primary" style={{width:"100%",marginTop:4}} onClick={mode === "login" ? handleLogin : handleSignup} disabled={busy}>
            {busy ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrewApp({ session }) {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [squads, setSquads] = useState([]);
  const [activeSquad, setActiveSquad] = useState(null);
  const [squadEntries, setSquadEntries] = useState([]);
  const [squadMembers, setSquadMembers] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [rings, setRings] = useState([]);
  const [beerType, setBeerType] = useState(BEER_TYPES[0]);
  const [note, setNote] = useState("");

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); }, []);

  useEffect(() => {
    async function init() {
      const uid = session.user.id;
      const [{ data: prof }, { data: ents }, { data: sqs }, { data: bgs }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", uid).single(),
        sb.from("entries").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        sb.from("squad_members").select("squad_id, squads(*)").eq("user_id", uid),
        sb.from("badges").select("*").eq("user_id", uid),
      ]);
      setProfile(prof);
      setEntries(ents || []);
      setSquads((sqs || []).map(s => s.squads));
      setEarnedBadges((bgs || []).map(b => b.badge_id));
      setLoading(false);
    }
    init();
  }, [session]);

  useEffect(() => {
    if (!activeSquad) return;
    async function loadSquad() {
      const { data: members } = await sb.from("squad_members")
        .select("user_id, joined_at, profiles(id,username,avatar_emoji)")
        .eq("squad_id", activeSquad.id);
      setSquadMembers(members || []);
      const memberIds = (members || []).map(m => m.user_id);
      if (memberIds.length) {
        const { data: ents } = await sb.from("entries").select("*").in("user_id", memberIds);
        setSquadEntries(ents || []);
      }
    }
    loadSquad();
  }, [activeSquad]);

  const streak = calcStreak(entries);
  const xp = entries.length * XP_PER_BEER + streak * 5;
  const level = getLevel(xp);
  const levelPct = getLevelPct(xp);
  const todayCount = entries.filter(e => e.date === todayStr()).length;
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const weekCount = entries.filter(e => e.date >= weekAgo).length;

  async function logBeer() {
    const uid = session.user.id;
    const entry = {
      user_id: uid, date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      beer_type: beerType.name, emoji: beerType.emoji,
      note: note.trim() || null,
    };
    const { data: inserted } = await sb.from("entries").insert(entry).select().single();
    if (!inserted) return;
    const next = [inserted, ...entries];
    setEntries(next);
    setNote("");
    setRings(r => [...r, Date.now()]);
    setTimeout(() => setRings(r => r.slice(1)), 900);
    const newStreak = calcStreak(next);
    for (const badge of BADGES) {
      if (!earnedBadges.includes(badge.id) && badge.check(next.length, newStreak, next)) {
        await sb.from("badges").insert({ user_id: uid, badge_id: badge.id }).catch(() => {});
        setEarnedBadges(prev => [...prev, badge.id]);
        setTimeout(() => setNewBadge(badge), 500);
        setTimeout(() => setNewBadge(null), 3500);
        return;
      }
    }
    const msgs = ["Logged! 🍺", "Cheers! 🥂", "Down the hatch! 👊", "One more for the books!"];
    showToast(msgs[Math.floor(Math.random() * msgs.length)]);
  }

  async function deleteEntry(id) {
    await sb.from("entries").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const tabs = [
    {id:"home",  icon:"🏠", label:"Home"},
    {id:"squads",icon:"👥", label:"Squads"},
    {id:"stats", icon:"📊", label:"Stats"},
    {id:"badges",icon:"🏅", label:"Badges"},
  ];

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="spin"/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",maxWidth:430,margin:"0 auto",background:"var(--bg)",position:"relative",overflowX:"hidden"}}>
      {toast && <div className="toast">{toast}</div>}
      {newBadge && (
        <div className="badge-overlay" onClick={() => setNewBadge(null)}>
          <div className="badge-modal">
            <div style={{fontSize:56,marginBottom:10}}>{newBadge.icon}</div>
            <div style={{fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--g)",marginBottom:8}}>Badge Unlocked!</div>
            <div className="syne" style={{fontSize:24,marginBottom:6}}>{newBadge.label}</div>
            <div style={{fontSize:13,color:"var(--mu)"}}>{newBadge.desc}</div>
            <div style={{fontSize:11,color:"var(--mu)",marginTop:14,opacity:.5}}>tap to dismiss</div>
          </div>
        </div>
      )}

      {view === "home" && (
        <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:36,lineHeight:1}}>{profile?.avatar_emoji || "🍺"}</div>
              <div>
                <div className="syne" style={{fontSize:22,letterSpacing:"-0.02em"}}>@{profile?.username}</div>
                <div style={{fontSize:11,color:"var(--a)",fontWeight:600,marginTop:2}}>{level.icon} {level.label}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:13}} onClick={() => sb.auth.signOut()}>Sign out</button>
          </div>
          <div>
            <div className="ptrack"><div className="pfill" style={{width:levelPct + "%"}}/></div>
            <div style={{fontSize:10,color:"var(--mu)",marginTop:4}}>{xp} XP · {levelPct}% to next level</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {label:"Today",     val:todayCount, color:"var(--a)"},
              {label:"This Week", val:weekCount,  color:"var(--b)"},
              {label:"🔥 Streak",  val:streak+"d", color:"var(--g)"},
            ].map(s => (
              <div key={s.label} className="card" style={{textAlign:"center",padding:"14px 6px"}}>
                <div className="syne" style={{fontSize:28,color:s.color,letterSpacing:"-0.02em"}}>{s.val}</div>
                <div style={{fontSize:10,color:"var(--mu)",marginTop:3,letterSpacing:"0.07em",textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:10}}>Select Style</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {BEER_TYPES.map(t => (
                <button key={t.name} className={"typebtn" + (beerType.name === t.name ? " sel" : "")} onClick={() => setBeerType(t)}>
                  <span style={{fontSize:20}}>{t.emoji}</span>
                  <span style={{fontSize:10,color:beerType.name===t.name?"var(--a)":"var(--mu)",fontWeight:600}}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
          <input className="input" placeholder="Add a note... venue, occasion, vibe" value={note} onChange={e => setNote(e.target.value)} maxLength={80}/>
          <div style={{display:"flex",justifyContent:"center",paddingTop:4,position:"relative"}}>
            <div style={{position:"relative"}}>
              {rings.map(r => <div key={r} className="ring"/>)}
              <button className="logbtn" onClick={logBeer}>
                <div className="logbtn-shine"/>
                <span style={{fontSize:50,filter:"drop-shadow(0 2px 14px rgba(245,158,11,0.55))",lineHeight:1}}>🍺</span>
                <span className="syne" style={{fontSize:16,color:"var(--a)",letterSpacing:"0.04em",marginTop:2}}>LOG IT</span>
                <span style={{fontSize:11,color:"var(--mu)"}}>+{XP_PER_BEER} XP</span>
              </button>
            </div>
          </div>
          {entries.length > 0 && (
            <div className="card">
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:12}}>Recent</div>
              {entries.slice(0, 5).map(e => (
                <div key={e.id} className="erow">
                  <span style={{fontSize:22,flexShrink:0}}>{e.emoji || "🍺"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600}}>{e.beer_type}</div>
                    <div style={{fontSize:11,color:"var(--mu)"}}>{e.time} · {dayName(e.date)}</div>
                    {e.note && <div style={{fontSize:11,color:"rgba(245,158,11,0.6)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{e.note}"</div>}
                  </div>
                  <button className="delbtn" onClick={() => deleteEntry(e.id)}>x</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "squads" && (
        <SquadsView session={session} squads={squads} setSquads={setSquads}
          activeSquad={activeSquad} setActiveSquad={setActiveSquad}
          squadMembers={squadMembers} squadEntries={squadEntries}
          profile={profile} showToast={showToast}/>
      )}
      {view === "stats" && <StatsView entries={entries} deleteEntry={deleteEntry}/>}
      {view === "badges" && <BadgesView earnedBadges={earnedBadges} streak={streak} xp={xp} level={level} levelPct={levelPct}/>}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(8,8,16,0.96)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--br)",display:"flex",zIndex:100}}>
        {tabs.map(t => (
          <button key={t.id} className={"navtab" + (view === t.id ? " active" : "")} onClick={() => setView(t.id)}>
            <span style={{fontSize:19}}>{t.icon}</span>
            <span>{t.label}</span>
            <div className="navdot"/>
          </button>
        ))}
      </div>
    </div>
  );
}

function SquadsView({ session, squads, setSquads, activeSquad, setActiveSquad, squadMembers, squadEntries, profile, showToast }) {
  const [subview, setSubview] = useState("list");
  const [squadName, setSquadName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [lbTab, setLbTab] = useState("month");

  async function createSquad() {
    if (!squadName.trim()) return setErr("Enter a squad name.");
    setBusy(true); setErr("");
    const code = genCode();
    const { data, error } = await sb.from("squads").insert({ name: squadName.trim(), invite_code: code, created_by: session.user.id }).select().single();
    if (error) { setBusy(false); return setErr(error.message); }
    await sb.from("squad_members").insert({ squad_id: data.id, user_id: session.user.id });
    setSquads(prev => [...prev, data]);
    setSquadName("");
    setBusy(false);
    showToast("Squad created! 🎉");
    setSubview("list");
  }

  async function joinSquad() {
    if (!joinCode.trim()) return setErr("Enter an invite code.");
    setBusy(true); setErr("");
    const { data: squad } = await sb.from("squads").select("*").eq("invite_code", joinCode.trim().toUpperCase()).single();
    if (!squad) { setBusy(false); return setErr("Squad not found. Check the code."); }
    const { error } = await sb.from("squad_members").insert({ squad_id: squad.id, user_id: session.user.id });
    if (error) { setBusy(false); return setErr("You are already in this squad!"); }
    setSquads(prev => [...prev, squad]);
    setJoinCode("");
    setBusy(false);
    showToast("Joined " + squad.name + "! 🍻");
    setSubview("list");
  }

  async function leaveSquad(squadId) {
    await sb.from("squad_members").delete().eq("squad_id", squadId).eq("user_id", session.user.id);
    setSquads(prev => prev.filter(s => s.id !== squadId));
    if (activeSquad?.id === squadId) setActiveSquad(null);
    showToast("Left squad.");
  }

  const buildLb = () => {
    const now = new Date();
    const monthStart = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01";
    return squadMembers.map(m => {
      const uid = m.user_id;
      const ents = squadEntries.filter(e => e.user_id === uid);
      const monthEnts = ents.filter(e => e.date >= monthStart);
      const s = calcStreak(ents);
      const dm = {};
      ents.forEach(e => { dm[e.date] = (dm[e.date] || 0) + 1; });
      const bigNight = Math.max(...Object.values(dm), 0);
      return { uid, username: m.profiles?.username, avatar: m.profiles?.avatar_emoji || "🍺", allTime: ents.length, month: monthEnts.length, streak: s, bigNight, xp: ents.length * XP_PER_BEER + s * 5 };
    });
  };

  const lb = buildLb().sort((a, b) => {
    if (lbTab === "month") return b.month - a.month;
    if (lbTab === "alltime") return b.allTime - a.allTime;
    if (lbTab === "streak") return b.streak - a.streak;
    if (lbTab === "bignight") return b.bigNight - a.bigNight;
    return 0;
  });

  const lbTabs = [{id:"month",label:"Month"},{id:"alltime",label:"All Time"},{id:"streak",label:"Streak"},{id:"bignight",label:"Big Night"}];

  if (subview === "leaderboard" && activeSquad) return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="btn btn-ghost" style={{padding:"8px 12px",fontSize:13}} onClick={() => setSubview("list")}>Back</button>
        <div>
          <div className="syne" style={{fontSize:22}}>{activeSquad.name}</div>
          <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>Code: <span style={{color:"var(--a)",fontWeight:700,letterSpacing:"0.1em"}}>{activeSquad.invite_code}</span></div>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid var(--br)"}}>
        {lbTabs.map(t => <button key={t.id} className={"tab-btn" + (lbTab === t.id ? " active" : "")} onClick={() => setLbTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="card">
        {lb.length === 0 ? <div style={{textAlign:"center",color:"var(--mu)",padding:"30px 0"}}>No members yet</div>
          : lb.map((u, i) => {
            const isMe = u.uid === session.user.id;
            const val = lbTab==="month" ? u.month+" 🍺" : lbTab==="alltime" ? u.allTime+" 🍺" : lbTab==="streak" ? u.streak+"d 🔥" : u.bigNight+" 🌙";
            return (
              <div key={u.uid} className="lb-row" style={{background:isMe?"rgba(245,158,11,0.05)":"transparent",borderRadius:8,margin:"0 -4px",padding:"12px 4px"}}>
                <div className={"lb-rank" + (i===0?" medal-1":i===1?" medal-2":i===2?" medal-3":"")}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
                </div>
                <div style={{fontSize:26,flexShrink:0}}>{u.avatar}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:isMe?"var(--a)":"var(--tx)"}}>@{u.username}{isMe?" (you)":""}</div>
                  <div style={{fontSize:11,color:"var(--mu)"}}>{getLevel(u.xp).label}</div>
                </div>
                <div className="syne" style={{fontSize:20,color:i===0?"var(--a)":"var(--tx)"}}>{val}</div>
              </div>
            );
          })}
      </div>
      <button className="btn btn-danger" onClick={() => { if (confirm("Leave this squad?")) leaveSquad(activeSquad.id); }}>Leave Squad</button>
    </div>
  );

  if (subview === "create") return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="btn btn-ghost" style={{padding:"8px 12px",fontSize:13}} onClick={() => { setSubview("list"); setErr(""); }}>Back</button>
        <div className="syne" style={{fontSize:22}}>Create Squad</div>
      </div>
      <div className="card" style={{display:"flex",flexDirection:"column",gap:12}}>
        <input className="input" placeholder="Squad name (e.g. Friday Crew)" value={squadName} onChange={e => setSquadName(e.target.value)} maxLength={40}/>
        {err && <div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={createSquad} disabled={busy}>{busy ? "Creating..." : "Create Squad"}</button>
      </div>
    </div>
  );

  if (subview === "join") return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="btn btn-ghost" style={{padding:"8px 12px",fontSize:13}} onClick={() => { setSubview("list"); setErr(""); }}>Back</button>
        <div className="syne" style={{fontSize:22}}>Join a Squad</div>
      </div>
      <div className="card" style={{display:"flex",flexDirection:"column",gap:12}}>
        <input className="input" placeholder="Invite code (e.g. BREW-4X9K)" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={10} autoCapitalize="characters"/>
        {err && <div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={joinSquad} disabled={busy}>{busy ? "Joining..." : "Join Squad"}</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div className="syne" style={{fontSize:32,letterSpacing:"-0.02em"}}>Squads</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button className="btn btn-primary" onClick={() => { setSubview("create"); setErr(""); }}>+ Create</button>
        <button className="btn btn-ghost" onClick={() => { setSubview("join"); setErr(""); }}>Enter Code</button>
      </div>
      {squads.length === 0 ? (
        <div className="card" style={{textAlign:"center",padding:"48px 20px",color:"var(--mu)"}}>
          <div style={{fontSize:40,marginBottom:14}}>👥</div>
          No squads yet. Create one or enter an invite code.
        </div>
      ) : squads.map(sq => (
        <div key={sq.id} className={"squad-card" + (activeSquad?.id === sq.id ? " active-squad" : "")}
          onClick={() => { setActiveSquad(sq); setSubview("leaderboard"); }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>{sq.name}</div>
              <div style={{fontSize:12,color:"var(--mu)",marginTop:3}}>
                Code: <span style={{color:"var(--a)",fontWeight:700,letterSpacing:"0.1em"}}>{sq.invite_code}</span>
              </div>
            </div>
            <div style={{fontSize:22}}>🏆</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsView({ entries, deleteEntry }) {
  const [tab, setTab] = useState("charts");
  const streak = calcStreak(entries);
  const xp = entries.length * XP_PER_BEER + streak * 5;
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const weekCount = entries.filter(e => e.date >= weekAgo).length;
  const dayMap = {};
  entries.forEach(e => { dayMap[e.date] = (dayMap[e.date] || 0) + 1; });
  const dowMap = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
  entries.forEach(e => { dowMap[new Date(e.date + "T12:00:00").getDay()]++; });
  const monthMap = {};
  entries.forEach(e => { const k = e.date.slice(0, 7); monthMap[k] = (monthMap[k] || 0) + 1; });
  const monthEntries = Object.entries(monthMap).sort((a, b) => b[0].localeCompare(a[0]));
  const peakDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  const avgMonth = monthEntries.length ? (entries.length / monthEntries.length).toFixed(1) : 0;
  const typeMap = {};
  entries.forEach(e => { const k = (e.emoji || "🍺") + " " + e.beer_type; typeMap[k] = (typeMap[k] || 0) + 1; });
  const typeEntries = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div className="syne" style={{fontSize:32,letterSpacing:"-0.02em"}}>Stats</div>
      <div style={{display:"flex",borderBottom:"1px solid var(--br)"}}>
        {[{id:"charts",label:"Charts"},{id:"history",label:"History"}].map(t => (
          <button key={t.id} className={"tab-btn" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "charts" && (<>
        {entries.length === 0 ? (
          <div className="card" style={{textAlign:"center",padding:"52px 20px",color:"var(--mu)"}}>
            <div style={{fontSize:40,marginBottom:14}}>📊</div>No data yet!
          </div>
        ) : (<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[
              {label:"Total Beers",val:entries.length,icon:"🍺",color:"var(--a)"},
              {label:"Avg / Month",val:avgMonth,       icon:"📅",color:"var(--b)"},
              {label:"Streak",     val:streak+"d",     icon:"🔥",color:"var(--g)"},
              {label:"Total XP",   val:xp,             icon:"⚡",color:"var(--p)"},
            ].map(s => (
              <div key={s.label} className="card">
                <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
                <div className="syne" style={{fontSize:32,color:s.color,letterSpacing:"-0.02em"}}>{s.val}</div>
                <div style={{fontSize:11,color:"var(--mu)",marginTop:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          {peakDay && (
            <div className="card" style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:32}}>🏆</div>
              <div>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:3}}>Peak Day Ever</div>
                <div style={{fontSize:15,fontWeight:700}}>{dayName(peakDay[0])} · {peakDay[0]}</div>
                <div className="syne" style={{fontSize:26,color:"var(--a)"}}>{peakDay[1]} beers</div>
              </div>
            </div>
          )}
          <div className="card">
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:16}}>By Day of Week</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:5,height:88}}>
              {DAYS.map((d, i) => {
                const max = Math.max(...Object.values(dowMap), 1);
                const isToday = new Date().getDay() === i;
                return (
                  <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%"}}>
                    <div style={{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}}>
                      <div className={"bar" + (isToday ? " today" : "")} style={{width:"100%",height:((dowMap[i]/max)*100)+"%"}}/>
                    </div>
                    <div style={{fontSize:9,color:isToday?"var(--g)":"var(--mu)",fontWeight:isToday?700:400}}>{d}</div>
                    {dowMap[i] > 0 && <div style={{fontSize:9,color:"var(--a)",fontWeight:700}}>{dowMap[i]}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          {typeEntries.length > 0 && (
            <div className="card">
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:14}}>By Style</div>
              {typeEntries.map(([type, count]) => (
                <div key={type} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                    <span>{type}</span><span style={{color:"var(--a)",fontWeight:700}}>{count}</span>
                  </div>
                  <div className="ptrack"><div className="pfill" style={{width:((count/entries.length)*100)+"%"}}/></div>
                </div>
              ))}
            </div>
          )}
          {monthEntries.length > 0 && (
            <div className="card">
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--mu)",marginBottom:14}}>Monthly History</div>
              {monthEntries.slice(0, 8).map(([k, count]) => {
                const [y, m] = k.split("-");
                const label = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1] + " '" + y.slice(2);
                return (
                  <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontSize:12,color:"var(--mu)",width:48,flexShrink:0}}>{label}</div>
                    <div style={{flex:1,height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:((count/Math.max(...monthEntries.map(x=>x[1])))*100)+"%",background:"linear-gradient(90deg,rgba(245,158,11,0.45),var(--a))",borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:13,color:"var(--a)",fontWeight:700,width:22,textAlign:"right"}}>{count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}
      </>)}
      {tab === "history" && (<>
        {entries.length === 0 ? (
          <div className="card" style={{textAlign:"center",padding:"52px 20px",color:"var(--mu)"}}>
            <div style={{fontSize:40,marginBottom:14}}>📋</div>Nothing yet!
          </div>
        ) : (
          <div className="card">
            {entries.map(e => (
              <div key={e.id} className="erow">
                <span style={{fontSize:24,flexShrink:0}}>{e.emoji || "🍺"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600}}>{e.beer_type}</div>
                  <div style={{fontSize:11,color:"var(--mu)"}}>{dayName(e.date)} · {e.date} · {e.time}</div>
                  {e.note && <div style={{fontSize:11,color:"rgba(245,158,11,0.6)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{e.note}"</div>}
                </div>
                <button className="delbtn" onClick={() => deleteEntry(e.id)}>x</button>
              </div>
            ))}
          </div>
        )}
      </>)}
    </div>
  );
}

function BadgesView({ earnedBadges, streak, xp, level, levelPct }) {
  const getNextLevel = (xp) => LEVELS[LEVELS.findIndex(l => l.min > xp)] || null;
  return (
    <div style={{padding:"28px 20px 110px",display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <div className="syne" style={{fontSize:32,letterSpacing:"-0.02em"}}>Badges</div>
        <div style={{fontSize:13,color:"var(--mu)",marginTop:4}}>{earnedBadges.length} / {BADGES.length} unlocked</div>
      </div>
      <div className="ptrack"><div className="pfill" style={{width:((earnedBadges.length/BADGES.length)*100)+"%"}}/></div>
      <div className="card" style={{background:"linear-gradient(135deg,var(--s),rgba(245,158,11,0.07))",border:"1px solid rgba(245,158,11,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:44}}>{level.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--a)",marginBottom:3}}>Current Level</div>
            <div className="syne" style={{fontSize:20}}>{level.label}</div>
            <div style={{fontSize:12,color:"var(--mu)",marginTop:2}}>{xp} XP</div>
          </div>
        </div>
        <div style={{marginTop:14}}>
          <div className="ptrack"><div className="pfill" style={{width:levelPct+"%"}}/></div>
          {getNextLevel(xp) && <div style={{fontSize:11,color:"var(--mu)",marginTop:5}}>Next: {getNextLevel(xp).label} at {getNextLevel(xp).min} XP</div>}
        </div>
      </div>
      {BADGES.map(b => {
        const earned = earnedBadges.includes(b.id);
        return (
          <div key={b.id} className={"bpill" + (earned ? " earned" : "")}>
            <div style={{fontSize:30,filter:earned?"none":"grayscale(1) opacity(0.28)",flexShrink:0}}>{b.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:earned?"var(--tx)":"rgba(240,240,248,0.3)"}}>{b.label}</div>
              <div style={{fontSize:12,color:"var(--mu)",marginTop:2}}>{b.desc}</div>
            </div>
            {earned && <div style={{fontSize:16,flexShrink:0}}>✅</div>}
          </div>
        );
      })}
    </div>
  );
}
