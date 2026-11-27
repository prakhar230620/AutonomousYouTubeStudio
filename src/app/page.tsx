"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Job = {
  id: string;
  topic: string;
  language: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at?: string;
  last_error?: string | null;
};
type Health = { status: string; checks: Record<string, boolean> };

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("hi-IN");
  const [duration, setDuration] = useState(8);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedScript, setSelectedScript] = useState("");

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/studio/jobs", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setJobs(data.jobs ?? []);
  }, []);

  const loadHealth = useCallback(async () => {
    const response = await fetch("/api/studio/health", { cache: "no-store" });
    if (response.ok) setHealth(await response.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/studio/auth").then((r) => r.json()),
      fetch("/api/studio/health").then((r) => r.json()),
    ]).then(([auth, status]) => {
      setAuthenticated(Boolean(auth.authenticated));
      setHealth(status);
    }).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void loadJobs();
    const id = window.setInterval(() => void loadJobs(), 10000);
    return () => window.clearInterval(id);
  }, [authenticated, loadJobs]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const response = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Login failed.");
      setAuthenticated(true);
      setPassword("");
      await loadJobs();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/studio/auth", { method: "DELETE" });
    setAuthenticated(false);
    setJobs([]);
    setSelectedScript("");
  }

  async function createJob(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/studio/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, language, targetDurationMinutes: duration }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create job.");
      setMessage("Production job queued. The script will appear here when the workflow reaches review.");
      setTopic("");
      await loadJobs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create job.");
    } finally {
      setBusy(false);
    }
  }

  async function inspectJob(job: Job) {
    setSelectedJobId(job.id);
    setSelectedScript("Loading script…");
    try {
      const response = await fetch(`/api/studio/jobs/${job.id}`, { cache: "no-store" });
      const data = await response.json();
      setSelectedScript(response.ok ? (data.job.script || "Script is not available yet.") : (data.error || "Could not load job."));
    } catch {
      setSelectedScript("Could not load job details.");
    }
  }

  if (authenticated === null) {
    return <main className="shell"><p className="muted">Loading studio…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="login">
        <div className="brand"><div className="brand-mark">A</div> Autonomous YouTube Studio</div>
        <p className="eyebrow" style={{ marginTop: 28 }}>Private creator workspace</p>
        <h1 style={{ fontSize: 34 }}>Sign in to your studio</h1>
        <p className="muted">This dashboard is protected by your private studio password.</p>
        <form onSubmit={login}>
          <div className="field">
            <label htmlFor="password">Studio password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="primary" disabled={busy} style={{ width: "100%" }}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        {loginError && <div className="status error">{loginError}</div>}
      </main>
    );
  }

  const configured = health ? Object.values(health.checks).filter(Boolean).length : 0;
  const totalChecks = health ? Object.keys(health.checks).length : 0;

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand"><div className="brand-mark">A</div><span>Autonomous YouTube Studio</span></div>
        <button className="secondary" onClick={logout}>Sign out</button>
      </div>

      <div className="eyebrow">Your production command center</div>
      <h1>From a topic to a finished video.</h1>
      <p className="lead">Create a production job and track every stage—from narration and scene planning to rendering, frame inspection, thumbnail design and channel-approved publishing.</p>

      <div className="grid">
        <section className="panel">
          <h2>Start a new video</h2>
          <form onSubmit={createJob}>
            <div className="field">
              <label htmlFor="topic">What should the video teach?</label>
              <input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cloud computing explained for beginners" minLength={3} maxLength={300} required />
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="language">Narration language</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="hi-IN">Hindi — Indian voice</option>
                  <option value="en-IN">English — Indian voice</option>
                  <option value="en-US">English — US voice</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="duration">Target duration</label>
                <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[3, 5, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </div>
            </div>
            <button className="primary" disabled={busy || topic.trim().length < 3}>{busy ? "Starting…" : "Create production job →"}</button>
          </form>
          {message && <div className="status">{message}</div>}
          <p className="footer-note">The current foundation generates and saves the script, then pauses for review while voiceover protocol verification is pending. Later production stages are intentionally gated until their adapters pass testing.</p>
        </section>

        <aside className="panel">
          <h2>Production pipeline</h2>
          <div className="steps">
            {[
              ["01", "Script & research", "Create an accurate, narration-ready script."],
              ["02", "Voiceover & storyboard", "Generate narration and scene timing."],
              ["03", "Render & synchronize", "Build the video against the voice track."],
              ["04", "Inspect & repair", "Review frames and re-render failed scenes."],
              ["05", "Thumbnail & publish", "Prepare metadata and channel-approved upload."],
            ].map(([n, title, desc]) => <div className="step" key={n}><div className="step-no">{n}</div><div><strong>{title}</strong><span>{desc}</span></div></div>)}
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Recent production jobs</h2>
          <span className="pill">{jobs.length} jobs</span>
        </div>
        {jobs.length === 0 ? <p className="muted" style={{ marginTop: 18 }}>No jobs yet. Create your first video above.</p> : (
          <div className="job-list">
            {jobs.map((job) => (
              <button key={job.id} className="job" onClick={() => void inspectJob(job)} style={{ textAlign: "left", color: "inherit", cursor: "pointer" }}>
                <strong>{job.topic}</strong>
                <small>{job.status.replaceAll("_", " ")} · {job.language} · {new Date(job.created_at).toLocaleString()}</small>
                <div style={{ height: 4, background: "#253246", borderRadius: 5, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${job.progress ?? 0}%`, background: "var(--accent)" }} />
                </div>
              </button>
            ))}
          </div>
        )}
        {selectedJobId && <div className="status" style={{ marginTop: 18, whiteSpace: "pre-wrap" }}><strong>Selected job script</strong><p>{selectedScript}</p></div>}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>System readiness</h2>
          <span className="pill">{configured}/{totalChecks} configured</span>
        </div>
        <p className="muted">This checks whether configuration values are present. It never returns secret values or proves that a provider integration works end-to-end.</p>
        <div className="row">
          {health && Object.entries(health.checks).map(([key, value]) => <div className="job" key={key}><strong>{key.replace(/[A-Z]/g, (m) => " " + m.toLowerCase())}</strong><small>{value ? "Configured" : "Setup required"}</small></div>)}
        </div>
        <button className="secondary" style={{ marginTop: 14 }} onClick={() => void loadHealth()}>Refresh checks</button>
      </section>
    </main>
  );
}
