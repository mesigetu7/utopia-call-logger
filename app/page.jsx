"use client";
import { useState } from "react";
import s from "./page.module.css";

const scoreMap = {
  "⭐⭐⭐⭐ Hot":  { emoji: "🔥", label: "Hot" },
  "⭐⭐⭐ Warm":  { emoji: "♨️",  label: "Warm" },
  "⭐⭐ Cool":    { emoji: "🌤️", label: "Cool" },
  "⭐ Cold":     { emoji: "❄️",  label: "Cold" },
};

export default function Home() {
  const [screen,    setScreen]    = useState("form");
  const [direction, setDirection] = useState("incoming");
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [note,      setNote]      = useState("");
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [dots,      setDots]      = useState(".");

  const handleSubmit = async () => {
    if (!note.trim()) { setError("Add a note about the call."); return; }
    setError("");
    setSaving(true);
    setScreen("loading");

    let d = 1;
    const timer = setInterval(() => { d = d >= 3 ? 1 : d + 1; setDots(".".repeat(d)); }, 400);

    try {
      const res = await fetch("/api/log-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, name, phone, note }),
      });
      clearInterval(timer);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult({ ...data, direction, name: data.clientName || name || "Unknown", phone });
      setScreen("success");
    } catch (err) {
      clearInterval(timer);
      setError(err.message || "Failed. Check connection and try again.");
      setScreen("form");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setScreen("form"); setDirection("incoming");
    setName(""); setPhone(""); setNote("");
    setResult(null); setError("");
  };

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (screen === "form") return (
    <div className={s.app}>
      <div className={s.header}>
        <div className={s.brand}>Utopia Advanced Composites</div>
        <div className={s.title}>Log a Call</div>
      </div>

      <div className={s.body}>

        <div className={s.section}>
          <div className={s.lbl}>Direction</div>
          <div className={s.twoCol}>
            {[["incoming","📲","Incoming"],["outgoing","📞","Outgoing"]].map(([val, icon, label]) => (
              <button key={val}
                className={`${s.dirBtn} ${direction === val ? (val === "incoming" ? s.activeGreen : s.activeGold) : ""}`}
                onClick={() => setDirection(val)}>
                <span className={s.dirIcon}>{icon}</span>
                <span className={s.dirLabel}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <div className={s.lbl}>Contact Name <span className={s.opt}>optional</span></div>
          <input className={s.field} placeholder="Abebe…"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className={s.section}>
          <div className={s.lbl}>Phone <span className={s.opt}>optional</span></div>
          <input className={s.field} placeholder="+251 9…" type="tel"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div className={s.section}>
          <div className={s.lbl}>What happened?</div>
          <textarea
            className={`${s.field} ${s.noteArea}`}
            placeholder={`Speak your mind — e.g.\n"Contractor, wants 60m² stair cladding in Bole, budget around 800k, follow up Tuesday"`}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className={s.hint}>
            Mention: project type · size · budget · timeline · location · follow-up
          </div>
        </div>

        {error && <div className={s.errorMsg}>{error}</div>}

        <button className={s.submitBtn} onClick={handleSubmit} disabled={saving}>
          → LOG TO NOTION
        </button>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (screen === "loading") return (
    <div className={s.app}>
      <div className={s.header}>
        <div className={s.brand}>Utopia Advanced Composites</div>
        <div className={s.title}>Logging…</div>
      </div>
      <div className={s.loadingScreen}>
        <div className={s.spinner} />
        <div className={s.loadingText}>AI is parsing your note{dots}</div>
        <div className={s.loadingSub}>Reading note · Filling CRM fields · Saving to Notion</div>
      </div>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  return (
    <div className={s.app}>
      <div className={s.header}>
        <div className={s.brand}>Utopia Advanced Composites</div>
        <div className={s.title}>Call Logged</div>
      </div>
      <div className={s.body}>

        <div className={s.successTop}>
          <div className={s.checkCircle}>✓</div>
          <div>
            <div className={s.successName}>{result.name}</div>
            <div className={s.successSub}>Added to Lead &amp; Deal Pipeline</div>
          </div>
        </div>

        <div className={s.card}>
          {[
            ["Direction", result.direction === "incoming" ? "📲 Incoming" : "📞 Outgoing"],
            result.phone       && ["Phone",     result.phone],
            result.clientType  && ["Client",    result.clientType],
            result.qualificationScore && ["Score", (() => {
              const m = scoreMap[result.qualificationScore];
              return m ? `${m.emoji} ${m.label}` : result.qualificationScore;
            })()],
            result.projectTypes?.length && ["Project",   result.projectTypes.join(", ")],
            result.timeline    && ["Timeline",  result.timeline],
            result.nextFollowUp && ["Follow-Up", result.nextFollowUp],
            result.nextStep    && ["Next Step", result.nextStep],
          ].filter(Boolean).map(([k, v], i, arr) => (
            <div key={k}>
              <div className={s.row}>
                <span className={s.rKey}>{k}</span>
                <span className={s.rVal}>{v}</span>
              </div>
              {i < arr.length - 1 && <div className={s.divider} />}
            </div>
          ))}

          <div className={s.divider} />
          <div className={s.notionBadge}>🗂️ Saved in Notion</div>
        </div>

        <button className={s.submitBtn} onClick={reset}>+ Log Another Call</button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
