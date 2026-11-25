import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, AlertTriangle, ArrowUpRight, Bug, CheckCircle2, ChevronDown, CircleHelp, Code2, Cpu, GitBranch, HeartPulse, History, LayoutDashboard, LoaderCircle, Search, Settings, ShieldCheck, Sparkles, Stethoscope, Terminal, UploadCloud, Zap } from "lucide-react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
function App() {
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Auto-detect");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [health, setHealth] = useState(null);
  useEffect(() => { fetch(API + "/api/health").then(r => r.json()).then(setHealth).catch(() => setHealth({status:"offline"})); }, []);

  async function analyze(e) {
    e.preventDefault(); setNotice(""); setReport(null); setBusy(true);
    try {
      const r = await fetch(API + "/api/analyze", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({error,code,language})});
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Analysis failed");
      setReport(data.report);
    } catch (err) { setNotice(err.message + (err.message.includes("fetch") ? " Make sure the API is running." : "")); }
    finally { setBusy(false); }
  }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Stethoscope size={19}/></div><div><b>Software Doctor</b><small>AI ENGINEERING</small></div></div>
      <div className="workspace"><div className="avatar">P</div><div><b>Personal workspace</b><small>Free plan</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav><a className="active"><LayoutDashboard/>Overview</a><a><Code2/>Projects</a><a><Activity/>Live Monitoring<span className="dot"/></a><a><AlertTriangle/>Incidents<span className="count">0</span></a><a><Stethoscope/>AI Doctor</a><a><GitBranch/>Git Investigation</a><a><ShieldCheck/>Proposed Repairs</a><a><History/>History</a></nav>
      <div className="side-bottom"><div className="credits"><div className="credit-line"><span>Free investigations</span><b>2 / 2</b></div><div className="progress"><i/></div><small>Two complimentary analyses available</small></div><a className="settings"><Settings/>Settings</a><div className="user"><div className="avatar">P</div><div><b>Developer</b><small>Local workspace</small></div><CircleHelp size={17}/></div></div>
    </aside>
    <main>
      <header><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="header-right"><div className="status"><i className={health?.status==="ok"?"online":"offline"}/>{health?.status==="ok"?"API connected":health?.status==="offline"?"API offline":"Connecting"}</div><button className="upgrade"><Zap size={14}/> Upgrade plan</button><div className="avatar">P</div></div></header>
      <div className="content">
        <section className="welcome"><div><div className="eyebrow"><span/> SOFTWARE RELIABILITY CENTER</div><h1>Good evening, developer <span>✦</span></h1><p>Find the root cause. Ship the fix with confidence.</p></div><div className="welcome-mark"><div><Stethoscope size={26}/></div><span className="orbit orbit-a"/><span className="orbit orbit-b"/></div></section>
        <section className="stats">
          <article className="stat"><div className="stat-top"><span>Open incidents</span><div className="icon red"><AlertTriangle/></div></div><strong>—</strong><small><span className="muted">Connect a project to monitor errors</span></small></article>
          <article className="stat"><div className="stat-top"><span>Projects monitored</span><div className="icon blue"><Activity/></div></div><strong>0</strong><small><span className="muted">No projects connected yet</span></small></article>
          <article className="stat"><div className="stat-top"><span>AI investigations</span><div className="icon purple"><Sparkles/></div></div><strong>2 <em>/ 2</em></strong><small><span className="good">●</span> Free investigations available</small></article>
          <article className="stat"><div className="stat-top"><span>System health</span><div className="icon green"><HeartPulse/></div></div><strong className="health-text">No data</strong><small><span className="muted">Waiting for a connected project</span></small></article>
        </section>
        <section className="grid">
          <div className="panel analyzer">
            <div className="panel-head"><div><div className="title-icon"><Bug size={17}/></div><div><h2>AI Doctor</h2><p>Analyze an error with your source code</p></div></div><span className="live-tag"><i/> READY</span></div>
            <form onSubmit={analyze}>
              <label>Error message or stack trace</label>
              <textarea required value={error} onChange={e=>setError(e.target.value)} placeholder={"Paste the error or stack trace here…\n\nExample: TypeError: Cannot read properties of undefined"} rows="5"/>
              <div className="form-row"><label>Source code <span className="optional">OPTIONAL</span></label><select value={language} onChange={e=>setLanguage(e.target.value)}><option>Auto-detect</option><option>JavaScript</option><option>TypeScript</option><option>Python</option><option>Java</option><option>C#</option><option>Other</option></select></div>
              <textarea className="code-input" value={code} onChange={e=>setCode(e.target.value)} placeholder="Paste the relevant source code to get a more grounded diagnosis…" rows="5"/>
              <div className="form-foot"><span><ShieldCheck size={14}/> Inputs are sent only to your configured AI provider</span><button disabled={busy || !error.trim()}>{busy?<><LoaderCircle className="spin"/>Analyzing…</>:<><Sparkles size={15}/> Analyze error <ArrowUpRight size={14}/></>}</button></div>
            </form>
          </div>
          <div className="panel quick">
            <div className="panel-head"><div><div className="title-icon blue-bg"><Zap size={17}/></div><div><h2>Getting started</h2><p>Set up your reliability workspace</p></div></div></div>
            <div className="steps"><div className="step done"><div><CheckCircle2/></div><section><b>Workspace created</b><p>Your local workspace is ready.</p></section></div><div className="step"><div>2</div><section><b>Run an AI investigation</b><p>Paste an error to find its likely cause.</p></section></div><div className="step"><div>3</div><section><b>Connect a project</b><p>Add monitoring to capture incidents.</p></section></div><div className="step"><div>4</div><section><b>Review a proposed repair</b><p>Inspect the patch before you apply it.</p></section></div></div>
            <div className="callout"><div><Cpu size={17}/></div><span><b>Your code stays under your control</b><small>Nothing is changed automatically. Review every repair.</small></span></div>
          </div>
        </section>
        {notice && <div className="notice"><AlertTriangle size={17}/><span>{notice}</span><button onClick={()=>setNotice("")}>Dismiss</button></div>}
        {report && <section className="panel report"><div className="panel-head"><div><div className="title-icon purple-bg"><Sparkles size={17}/></div><div><h2>Investigation report</h2><p>AI estimate · verification: Not executed</p></div></div><span className={"severity "+report.severity}>{report.severity}</span></div><h3>{report.incidentSummary}</h3><p className="root-cause">{report.rootCause}</p><div className="report-columns"><div><h4>Evidence</h4><ul>{report.evidence.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><h4>Recommended tests</h4><ul>{report.recommendedTests.map((x,i)=><li key={i}>{x}</li>)}</ul></div></div><h4>Proposed diff</h4><pre>{report.unifiedDiff || "No patch proposed. The provided context may be insufficient."}</pre><small className="disclaimer">Confidence estimate: {Math.round(report.confidenceEstimate*100)}% (AI estimate, not a measured probability). Review changes before applying.</small></section>}
        <section className="lower"><div className="panel empty"><div className="empty-icon"><Terminal/></div><div><h3>Monitoring starts with your first project</h3><p>Instrument a React or Node.js app to see real incidents here.</p></div><button onClick={()=>setNotice("Monitoring SDK setup is planned for the next milestone.")}>View setup guide <ArrowUpRight size={14}/></button></div><div className="panel activity"><div className="panel-head"><div><div><h2>Recent activity</h2><p>Latest investigations and incidents</p></div></div><button className="text-button">View history <ArrowUpRight size={14}/></button></div><div className="activity-empty"><History size={19}/><span>No activity yet</span></div></div></section>
        <footer><span>SOFTWARE DOCTOR AI <i>•</i> DETECT. DIAGNOSE. REPAIR. PREVENT.</span><span>Local development milestone <i>•</i> No production data connected</span></footer>
      </div>
    </main>
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);
