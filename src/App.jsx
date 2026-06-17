import { useState, useRef, useEffect, useCallback } from "react";

// ── Prompts ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an official meeting minutes drafter for Pakistani government, procurement, and business meetings.

Your task: Convert the provided meeting transcript (which may be in Urdu, Roman Urdu, English, or a mix) into FORMAL ENGLISH meeting minutes.

STRICT RULES:
1. Do NOT fabricate, invent, or assume any facts, names, dates, decisions, or figures not clearly stated in the transcript.
2. Where any required information is absent from the transcript, write exactly: "Not specified in transcript."
3. Use concise, formal, legally appropriate language suitable for official Pakistani government/procurement records.
4. Identify speakers by full name and designation where mentioned. If unclear, label as "Speaker 1", "Speaker 2", etc.
5. Translate all Urdu and Roman Urdu content accurately into formal English.
6. Preserve the meaning and intent of all statements faithfully.

Return ONLY a valid JSON object — no markdown fences, no explanation, no preamble. The JSON must follow this exact schema:
{
  "meetingTitle": "string",
  "referenceNumber": "string",
  "date": "string",
  "time": "string",
  "venue": "string",
  "chairperson": { "name": "string", "designation": "string" },
  "participants": [{ "sNo": 1, "name": "string", "designation": "string", "department": "string" }],
  "absentees": [{ "name": "string", "designation": "string" }],
  "agendaItems": [{ "sNo": 1, "title": "string" }],
  "proceedings": [{ "agendaRef": "string", "heading": "string", "discussion": "string" }],
  "decisions": [{ "sNo": 1, "decision": "string" }],
  "actionItems": [{ "sNo": 1, "action": "string", "responsibleOfficer": "string", "deadline": "string" }],
  "pendingIssues": [{ "sNo": 1, "issue": "string", "remarks": "string" }],
  "nextMeeting": "string",
  "conclusion": "string",
  "minutesPreparedBy": "string"
}
If arrays have no data, return []. If any string field has no data, return "Not specified in transcript."`;

const CLEAN_PROMPT = `You are a transcript cleanup assistant. The input is raw speech-to-text output from a meeting — it may be in Urdu, Roman Urdu, English, or mixed. It may have repetitions, filler words, or recognition errors.

Your task: Clean and lightly format the transcript for readability.
- Fix obvious recognition errors
- Remove filler words (um, uh, aaa, etc.)
- Add speaker labels where you can infer them (e.g. "Speaker:" prefix)
- Add paragraph breaks between different speakers/topics
- Do NOT change meaning, add content, or translate — keep the original language

Return ONLY the cleaned transcript text, no explanation.`;

const SAMPLE = `Chairman sahab Abdul Rauf Khan, Secretary Ministry of Planning ne meeting ka aghaz kiya. Yeh meeting 22 November 2024 ko subah 10:00 baje PPRA Conference Hall, Islamabad mein منعقد ہوئی۔

Hazreen: DG Procurement Tariq Mehmood, Additional Secretary Finance Ms. Amina Siddiqui, Director Engineering Bilal Nawaz, Legal Advisor Shabana Khan, Deputy Director Admin Imran Farooq.

Agenda: (1) Chinyot Road Infrastructure Project tender evaluation, (2) FY2024-25 revised procurement plan approval.

Tariq Mehmood ne bataya ke 5 vendors ne technical bids jama karayi hain. Sirf 3 qualify hain: Alpha Construction (Pvt) Ltd, Beta Engineering Works, Gamma Builders Co. Tajaviz: financial bids kholi jayein.

Ms. Amina Siddiqui: Ministry of Finance se budget clearance 29 November tak aa jayegi. Iske baad financial bids ka process hoga.

Bilal Nawaz: Site inspection 15 November ko complete. Alpha Construction drawings fully compliant. Beta Engineering mein minor structural deficiency hai — 7 working days mein rectify ho sakti hai. Gamma Builders: koi issue nahi.

Shabana Khan: PPRA Rules 2004 rule 36 ke tahat sab theek hai. L1 selection par conflict of interest declaration zaruri hai.

Chairman ke faislay: Financial bids 29 November ko khulein gi. Beta Engineering 29 November tak drawings rectify kare warna disqualified. Conflict of interest forms 27 November tak Imran Farooq jama karaye.

Agenda Item 2: Revised procurement plan tayyar hai lekin budget figures pending hain — next meeting mein rakhein.

Meeting 11:45 baje khatam hui.`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18, color = "#d4a843" }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />;
}

function RecordingWave({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24 }}>
      {[1, 1.6, 0.8, 1.4, 1, 1.8, 0.9].map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: active ? "#e74c3c" : "#c8d4c0",
          height: active ? `${h * 14}px` : "4px",
          animation: active ? `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate` : "none",
          transition: "height 0.3s"
        }} />
      ))}
    </div>
  );
}

function SectionHeader({ icon, title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid #2a3a2a", paddingBottom: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1a2e1a" }}>{title}</span>
      {count > 0 && <span style={{ marginLeft: "auto", background: "#1a3a1a", color: "#d4a843", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{count}</span>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", border: "1px solid #c8d4c0", borderRadius: 8, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(26,58,26,0.06)", ...style }}>{children}</div>;
}

function MetaBadge({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#7a9a7a", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1a2e1a", fontWeight: 500 }}>{value || <em style={{ color: "#9aaa9a" }}>Not specified</em>}</span>
    </div>
  );
}

function Tag({ children, color = "green" }) {
  const c = { green: ["#e6f0e6", "#1a5c1a"], amber: ["#fdf3dc", "#7a4a00"], blue: ["#e6eef8", "#1a3a7a"], red: ["#fce8e8", "#8a1a1a"] }[color] || ["#e6f0e6", "#1a5c1a"];
  return <span style={{ background: c[0], color: c[1], fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}</span>;
}

// ── API Key Panel ─────────────────────────────────────────────────────────────
function ApiKeyPanel({ apiKey, onSave }) {
  const [draft, setDraft] = useState(apiKey || "");
  const [show, setShow] = useState(false);

  function save() {
    const k = draft.trim();
    if (k) { onSave(k); localStorage.setItem("anthropic_api_key", k); }
  }

  return (
    <div style={{ background: apiKey ? "#e6f0e6" : "#fdf3dc", border: `1px solid ${apiKey ? "#a8c4a8" : "#e8c870"}`, borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 18 }}>{apiKey ? "🔑" : "⚠️"}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, fontWeight: 700, color: apiKey ? "#1a5c1a" : "#7a4a00", marginBottom: 2 }}>
          {apiKey ? "Anthropic API Key Connected" : "Anthropic API Key Required"}
        </div>
        <div style={{ fontSize: 12, color: apiKey ? "#2e5c2e" : "#8a5a00" }}>
          {apiKey ? "Your key is stored locally in this browser." : "Enter your key from console.anthropic.com — stored only in your browser."}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type={show ? "text" : "password"}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder="sk-ant-..."
          style={{ border: "1px solid #c8d4c0", borderRadius: 6, padding: "7px 12px", fontSize: 13, width: 220, fontFamily: "monospace", background: "#fff" }}
        />
        <button onClick={() => setShow(s => !s)} style={{ background: "none", border: "1px solid #c8d4c0", borderRadius: 6, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}>{show ? "🙈" : "👁"}</button>
        <button onClick={save} style={{ background: "#1a3a1a", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
      </div>
    </div>
  );
}

// ── Minutes Document ──────────────────────────────────────────────────────────
function MinutesDocument({ data }) {
  const today = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
  const ns = v => (!v || v === "Not specified in transcript.") ? <em style={{ color: "#9aaa9a", fontStyle: "italic" }}>Not specified in transcript.</em> : v;

  return (
    <div style={{ fontFamily: "'Source Serif 4', 'Libre Baskerville', Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a3a1a 0%, #0f2a0f 100%)", borderRadius: "10px 10px 0 0", padding: "26px 28px 20px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>🏛️</div>
        <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4a843", fontWeight: 700, marginBottom: 4 }}>Government of Pakistan</div>
        <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", marginBottom: 5 }}>MINUTES OF MEETING</div>
        <div style={{ fontSize: 13, color: "#b8d0b8", fontStyle: "italic", marginBottom: 8 }}>{data.meetingTitle}</div>
        {data.referenceNumber && data.referenceNumber !== "Not specified in transcript." && (
          <div style={{ display: "inline-block", background: "rgba(212,168,67,0.2)", border: "1px solid rgba(212,168,67,0.5)", borderRadius: 4, padding: "3px 12px", fontSize: 11, color: "#d4a843" }}>Ref. No: {data.referenceNumber}</div>
        )}
      </div>
      <div style={{ background: "#f0f5ee", border: "1px solid #c8d4c0", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <MetaBadge label="Date" value={data.date} />
        <MetaBadge label="Time" value={data.time} />
        <MetaBadge label="Venue" value={data.venue} />
        <MetaBadge label="Chairperson" value={data.chairperson?.name ? `${data.chairperson.name}${data.chairperson.designation ? `, ${data.chairperson.designation}` : ""}` : null} />
      </div>

      <Card>
        <SectionHeader icon="👥" title="Participants" count={data.participants?.length} />
        {data.participants?.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f0f5ee" }}>{["S.No.", "Name", "Designation", "Department"].map(h => <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#5a7a5a", borderBottom: "1.5px solid #c8d4c0" }}>{h}</th>)}</tr></thead>
            <tbody>{data.participants.map((p, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid #e4ede4" }}>
                <td style={{ padding: "8px 10px", color: "#7a9a7a", fontWeight: 600 }}>{i + 1}.</td>
                <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1a2e1a" }}>{p.name}</td>
                <td style={{ padding: "8px 10px", color: "#2e4e2e" }}>{p.designation}</td>
                <td style={{ padding: "8px 10px", color: "#5a7a5a" }}>{p.department}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p style={{ color: "#9aaa9a", fontSize: 13, fontStyle: "italic" }}>Not specified in transcript.</p>}
        {data.absentees?.length > 0 && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#8a5a5a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Absentees</div>{data.absentees.map((a, i) => <span key={i} style={{ display: "inline-block", background: "#fce8e8", color: "#8a1a1a", fontSize: 12, padding: "3px 10px", borderRadius: 12, marginRight: 6, marginBottom: 4 }}>{a.name}{a.designation ? ` — ${a.designation}` : ""}</span>)}</div>}
      </Card>

      <Card>
        <SectionHeader icon="📋" title="Agenda Items" count={data.agendaItems?.length} />
        {data.agendaItems?.length > 0 ? data.agendaItems.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < data.agendaItems.length - 1 ? "0.5px solid #e4ede4" : "none" }}>
            <span style={{ minWidth: 26, height: 26, background: "#1a3a1a", color: "#d4a843", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13.5, color: "#1a2e1a", lineHeight: 1.5, paddingTop: 3 }}>{item.title}</span>
          </div>
        )) : <p style={{ color: "#9aaa9a", fontSize: 13, fontStyle: "italic" }}>Not specified in transcript.</p>}
      </Card>

      <Card>
        <SectionHeader icon="🗣️" title="Proceedings / Discussion" count={data.proceedings?.length} />
        {data.proceedings?.length > 0 ? data.proceedings.map((p, i) => (
          <div key={i} style={{ paddingBottom: 16, borderBottom: i < data.proceedings.length - 1 ? "0.5px solid #e4ede4" : "none", marginBottom: i < data.proceedings.length - 1 ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Tag color="blue">{p.agendaRef}</Tag>{p.heading && <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1a2e1a" }}>{p.heading}</span>}</div>
            <p style={{ fontSize: 13.5, color: "#2a3a2a", lineHeight: 1.8, margin: 0 }}>{p.discussion}</p>
          </div>
        )) : <p style={{ color: "#9aaa9a", fontSize: 13, fontStyle: "italic" }}>Not specified in transcript.</p>}
      </Card>

      <Card>
        <SectionHeader icon="✅" title="Decisions Taken" count={data.decisions?.length} />
        {data.decisions?.length > 0 ? data.decisions.map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < data.decisions.length - 1 ? "0.5px solid #e4ede4" : "none" }}>
            <span style={{ minWidth: 22, height: 22, background: "#e6f0e6", color: "#1a5c1a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 13.5, color: "#1a2e1a", lineHeight: 1.6 }}>{d.decision}</span>
          </div>
        )) : <p style={{ color: "#9aaa9a", fontSize: 13, fontStyle: "italic" }}>Not specified in transcript.</p>}
      </Card>

      <Card>
        <SectionHeader icon="⚡" title="Action Items" count={data.actionItems?.length} />
        {data.actionItems?.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f0f5ee" }}>{["#", "Action Required", "Responsible Officer", "Deadline"].map(h => <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#5a7a5a", borderBottom: "1.5px solid #c8d4c0" }}>{h}</th>)}</tr></thead>
            <tbody>{data.actionItems.map((a, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid #e4ede4" }}>
                <td style={{ padding: "9px 10px", color: "#7a9a7a", fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: "9px 10px", color: "#1a2e1a", lineHeight: 1.5 }}>{a.action}</td>
                <td style={{ padding: "9px 10px", fontWeight: 600, color: "#1a3a5a" }}>{a.responsibleOfficer}</td>
                <td style={{ padding: "9px 10px" }}><span style={{ background: "#fdf3dc", color: "#7a4a00", fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12, whiteSpace: "nowrap" }}>{a.deadline}</span></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p style={{ color: "#9aaa9a", fontSize: 13, fontStyle: "italic" }}>No action items specified.</p>}
      </Card>

      {data.pendingIssues?.length > 0 && (
        <Card>
          <SectionHeader icon="⏳" title="Pending Issues" count={data.pendingIssues.length} />
          {data.pendingIssues.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i < data.pendingIssues.length - 1 ? "0.5px solid #e4ede4" : "none", alignItems: "flex-start" }}>
              <Tag color="amber">{i + 1}</Tag>
              <div><div style={{ fontSize: 13.5, color: "#1a2e1a", lineHeight: 1.6 }}>{p.issue}</div>{p.remarks && p.remarks !== "Not specified in transcript." && <div style={{ fontSize: 12, color: "#7a5a2a", fontStyle: "italic", marginTop: 3 }}>Remarks: {p.remarks}</div>}</div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <SectionHeader icon="🏁" title="Conclusion" />
        <p style={{ fontSize: 13.5, color: "#2a3a2a", lineHeight: 1.8, margin: 0 }}>{ns(data.conclusion)}</p>
        {data.nextMeeting && data.nextMeeting !== "Not specified in transcript." && (
          <div style={{ marginTop: 12, background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 6, padding: "10px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📅</span><span><strong>Next Meeting:</strong> {data.nextMeeting}</span>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
        {[["Chairperson", data.chairperson?.name, data.chairperson?.designation], ["Minutes Prepared By", data.minutesPreparedBy, ""]].map(([title, name, desig], i) => (
          <div key={i} style={{ borderTop: "1.5px solid #1a3a1a", paddingTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2e1a", letterSpacing: "0.04em" }}>{title}</div>
            <div style={{ fontSize: 12.5, color: "#2e4e2e", marginTop: 3 }}>{name && name !== "Not specified in transcript." ? name : <em style={{ color: "#9aaa9a" }}>Not specified</em>}</div>
            {desig && <div style={{ fontSize: 12, color: "#7a9a7a" }}>{desig}</div>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#9aaa9a", fontStyle: "italic", borderTop: "0.5px solid #e4ede4", paddingTop: 12 }}>
        AI-assisted draft generated on {today} · Verify all facts, names and dates before official use or circulation.
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_api_key") || "");

  // tabs: record | type
  const [tab, setTab] = useState("record");
  const [transcript, setTranscript] = useState("");

  // recording state
  const [recState, setRecState] = useState("idle"); // idle | requesting | recording | stopped | transcribing
  const [recSeconds, setRecSeconds] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [recError, setRecError] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [srFailed, setSrFailed] = useState(false);
  const audioBlobRef = useRef(null);

  // minutes state
  const [minutes, setMinutes] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalTextRef = useRef("");
  const outputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);

  // ── Speech Recognition ─────────────────────────────────────────────────────
  const setupRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "ur-PK";
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = "";
      let newFinal = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) newFinal += t + " ";
        else interim += t;
      }
      if (newFinal) setFinalText(prev => prev + newFinal);
      setLiveText(interim);
    };
    r.onerror = (e) => {
      if (e.error === "network") {
        setSrFailed(true); // will transcribe via API after stop
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setRecError("Microphone error: " + e.error);
      }
    };
    r.onend = () => {
      if (mediaRecorderRef.current?.state === "recording") {
        try { r.start(); } catch (_) {}
      }
    };
    return r;
  }, []);

  // ── Start Recording ────────────────────────────────────────────────────────
  async function startRecording() {
    setRecError(""); setRecState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecState("recording");

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(500);

      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);

      const rec = setupRecognition();
      if (rec) { recognitionRef.current = rec; try { rec.start(); } catch (_) {} }

    } catch (e) {
      setRecState("idle");
      setRecError(e.name === "NotAllowedError" ? "Microphone permission denied. Please allow microphone access and try again." : "Could not access microphone: " + e.message);
    }
  }

  // ── Stop Recording ─────────────────────────────────────────────────────────
  function stopRecording() {
    clearInterval(timerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setLiveText("");
    setRecState("stopped");
    // If Web Speech API failed (desktop app), auto-transcribe via Anthropic
    setTimeout(() => {
      if (srFailed && audioBlobRef.current && !finalTextRef.current.trim()) {
        transcribeAudioViaAPI(audioBlobRef.current);
      }
    }, 600);
  }

  // ── Transcribe audio blob via API (fallback for desktop app) ─────────────
  async function transcribeAudioViaAPI(blob) {
    setRecState("stopped");
    setRecError("Live transcription is not available in the desktop app. Your audio has been saved — download it and paste the transcript in the 'Paste / Type Transcript' tab.");
  }

  // ── Use transcript from recording ─────────────────────────────────────────
  async function useRecordedTranscript(clean = false) {
    const raw = finalTextRef.current.trim() || finalText.trim();
    if (!raw) { setRecError("No speech was detected. Please record again."); return; }
    if (!clean) {
      setTranscript(raw);
      setTab("type");
      return;
    }
    if (!apiKey) { setRecError("Please enter your Anthropic API key first."); return; }
    setCleaning(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system: CLEAN_PROMPT, messages: [{ role: "user", content: raw }] })
      });
      const data = await res.json();
      const cleaned = data.content?.map(b => b.text || "").join("").trim() || raw;
      setTranscript(cleaned);
      setTab("type");
    } catch (_) { setTranscript(raw); setTab("type"); }
    finally { setCleaning(false); }
  }

  // ── Reset recording ────────────────────────────────────────────────────────
  function resetRecording() {
    setRecState("idle"); setRecSeconds(0); setLiveText(""); setFinalText("");
    finalTextRef.current = ""; setAudioURL(null); setRecError(""); setSrFailed(false);
    audioBlobRef.current = null;
  }

  // ── Generate Minutes ───────────────────────────────────────────────────────
  async function generateMinutes() {
    const t = transcript.trim();
    if (!t) { setGenError("Please provide a meeting transcript first."); return; }
    if (!apiKey) { setGenError("Please enter your Anthropic API key above first."); return; }
    setGenError(""); setMinutes(null); setGenLoading(true);
    const msgs = ["Detecting language — Urdu, Roman Urdu, English…", "Identifying speakers and agenda items…", "Extracting decisions and action points…", "Drafting formal proceedings in English…", "Compiling official minutes document…"];
    let idx = 0; setLoadingMsg(msgs[0]);
    intervalRef.current = setInterval(() => { idx = (idx + 1) % msgs.length; setLoadingMsg(msgs[idx]); }, 2400);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: `Process this meeting transcript and return the JSON:\n\n${t}` }] })
      });
      clearInterval(intervalRef.current);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const raw = data.content.map(b => b.text || "").join("");
      const parsed = JSON.parse(raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
      setMinutes(parsed);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (e) { clearInterval(intervalRef.current); setGenError("Failed to generate minutes: " + e.message); }
    finally { setGenLoading(false); }
  }

  function copyText() {
    if (!outputRef.current) return;
    navigator.clipboard.writeText(outputRef.current.innerText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length;
  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Source Serif 4', 'Libre Baskerville', Georgia, serif", background: "#f7f9f5", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wave { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        textarea:focus { outline: none !important; border-color: #1a3a1a !important; box-shadow: 0 0 0 3px rgba(26,58,26,0.08) !important; }
        .tab-btn:hover { background: #e4ede4 !important; }
        .tab-active { background: #1a3a1a !important; color: #fff !important; border-color: #1a3a1a !important; }
        .action-btn:hover:not(:disabled) { background: #0f2a0f !important; }
        .sec-btn:hover { background: #e4ede4 !important; }
        .rec-btn-start:hover { background: #c0392b !important; }
        .rec-btn-stop:hover { background: #a93226 !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a3a1a", color: "#d4a843", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 16px", borderRadius: 20, marginBottom: 14 }}>
            🏛️ Official Document Assistant
          </div>
          <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1a2e1a", margin: "0 0 8px" }}>Meeting Minutes Generator</h1>
          <p style={{ fontSize: 14, color: "#5a7a5a", margin: 0, lineHeight: 1.6 }}>
            Pakistani government, procurement &amp; business meetings<br />
            <span style={{ fontSize: 12.5, color: "#7a9a7a" }}>🎙 Record live audio · 📝 Paste transcript · 🌐 Urdu · Roman Urdu · English</span>
          </p>
        </div>

        {/* API Key Panel */}
        <ApiKeyPanel apiKey={apiKey} onSave={setApiKey} />

        {/* Input Panel */}
        <div style={{ background: "#fff", border: "1px solid #c8d4c0", borderRadius: 14, padding: "22px 26px", marginBottom: 20, boxShadow: "0 2px 12px rgba(26,58,26,0.07)" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["record", "🎙️ Record Meeting"], ["type", "📝 Paste / Type Transcript"]].map(([id, label]) => (
              <button key={id} className={`tab-btn ${tab === id ? "tab-active" : ""}`}
                onClick={() => setTab(id)}
                style={{ flex: 1, padding: "9px 14px", fontSize: 13, fontWeight: tab === id ? 700 : 400, cursor: "pointer", border: "1px solid #c8d4c0", borderRadius: 8, background: tab === id ? "#1a3a1a" : "#f7f9f5", color: tab === id ? "#fff" : "#5a7a5a", fontFamily: "'Libre Baskerville', Georgia, serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── RECORD TAB ────────────────────────────────────────────── */}
          {tab === "record" && (
            <div>
              {!hasSR && (
                <div style={{ background: "#fdf3dc", border: "1px solid #e8c870", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#7a4a00", marginBottom: 16 }}>
                  ⚠️ Your browser does not support live speech recognition. Please use Chrome or Edge for live transcription, or switch to the "Paste Transcript" tab.
                </div>
              )}

              {recError && <div style={{ background: "#fce8e8", border: "1px solid #f0b0b0", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#8a1a1a", marginBottom: 14 }}>⚠️ {recError}</div>}

              {/* Idle */}
              {recState === "idle" && (
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <div style={{ width: 80, height: 80, background: "#e6f0e6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>🎙️</div>
                  <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 15, fontWeight: 700, color: "#1a2e1a", marginBottom: 8 }}>Ready to Record</div>
                  <div style={{ fontSize: 13, color: "#7a9a7a", marginBottom: 24, lineHeight: 1.6 }}>Click to start recording your meeting.<br />Live transcription will appear as you speak.</div>
                  <button className="rec-btn-start" onClick={startRecording} style={{ background: "#e74c3c", color: "#fff", border: "none", borderRadius: 40, padding: "13px 36px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Libre Baskerville', Georgia, serif", display: "inline-flex", alignItems: "center", gap: 10, transition: "background 0.15s" }}>
                    ● Start Recording
                  </button>
                </div>
              )}

              {/* Requesting mic */}
              {recState === "requesting" && (
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <Spinner size={32} color="#1a3a1a" /><div style={{ marginTop: 14, fontSize: 13, color: "#5a7a5a" }}>Requesting microphone access…</div>
                </div>
              )}

              {/* Transcribing via API */}
              {recState === "transcribing" && (
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <Spinner size={32} color="#1a3a1a" />
                  <div style={{ marginTop: 14, fontSize: 13, color: "#1a2e1a", fontWeight: 600 }}>Transcribing your recording…</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#5a7a5a" }}>Sending audio to AI for transcription</div>
                </div>
              )}

              {/* Recording */}
              {recState === "recording" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fce8e8", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e74c3c", animation: "pulse 1s ease-in-out infinite" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#8a1a1a" }}>RECORDING</span>
                      <RecordingWave active={true} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#8a1a1a" }}>{fmt(recSeconds)}</span>
                      <button className="rec-btn-stop" onClick={stopRecording} style={{ background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>■ Stop</button>
                    </div>
                  </div>

                  <div style={{ background: "#f7f9f5", border: "1px solid #c8d4c0", borderRadius: 8, padding: "14px 16px", minHeight: 140, maxHeight: 280, overflowY: "auto", fontSize: 14, lineHeight: 1.8, color: "#1a2e1a" }}>
                    {!finalText && !liveText && <span style={{ color: "#9aaa9a", fontStyle: "italic" }}>{hasSR ? "Listening… speak clearly into your microphone." : "Recording audio… (live transcription not supported in this browser)"}</span>}
                    <span style={{ color: "#1a2e1a" }}>{finalText}</span>
                    {liveText && <span style={{ color: "#7a9a9a", fontStyle: "italic" }}>{liveText}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9aaa9a", marginTop: 6 }}>{wordCount(finalText + " " + liveText)} words captured</div>
                </div>
              )}

              {/* Stopped */}
              {recState === "stopped" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e6f0e6", border: "1px solid #a8c4a8", borderRadius: 8, padding: "10px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>✅</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a5c1a" }}>Recording Complete — {fmt(recSeconds)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {audioURL && <a href={audioURL} download="meeting-recording.webm" style={{ background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#2e4e2e", textDecoration: "none", fontWeight: 600 }}>⬇ Audio</a>}
                      <button className="sec-btn" onClick={resetRecording} style={{ background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#5a7a5a", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>🔄 Re-record</button>
                    </div>
                  </div>

                  <div style={{ background: "#f7f9f5", border: "1px solid #c8d4c0", borderRadius: 8, padding: "14px 16px", maxHeight: 220, overflowY: "auto", fontSize: 14, lineHeight: 1.8, color: "#1a2e1a", marginBottom: 14 }}>
                    {finalText || <span style={{ color: "#9aaa9a", fontStyle: "italic" }}>No speech was detected.</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9aaa9a", marginBottom: 14 }}>{wordCount(finalText)} words transcribed</div>

                  {finalText && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => useRecordedTranscript(false)} style={{ flex: 1, minWidth: 160, background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#2e4e2e", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, transition: "background 0.15s" }}>
                        Use Raw Transcript →
                      </button>
                      <button onClick={() => useRecordedTranscript(true)} disabled={cleaning} style={{ flex: 1, minWidth: 160, background: "#1a3a1a", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#fff", cursor: cleaning ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {cleaning ? <><Spinner size={14} /> Cleaning…</> : "✨ AI-Clean & Use →"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TYPE TAB ──────────────────────────────────────────────── */}
          {tab === "type" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 12, fontWeight: 700, color: "#1a2e1a", letterSpacing: "0.06em", textTransform: "uppercase" }}>Meeting Transcript</label>
                <button onClick={() => { setTranscript(SAMPLE); setMinutes(null); }} style={{ background: "none", border: "1px solid #c8d4c0", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: "#5a7a5a", cursor: "pointer", fontFamily: "inherit" }}>Load Sample</button>
              </div>
              <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                placeholder={"Paste or type your meeting transcript here…\n\nAccepts:\n• Urdu (اردو میں لکھیں)\n• Roman Urdu (meetng ka yeh agenda tha...)\n• English\n• Mixed language"}
                style={{ width: "100%", minHeight: 220, resize: "vertical", border: "1px solid #c8d4c0", borderRadius: 8, padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#1a2e1a", background: "#f7f9f5", boxSizing: "border-box", fontFamily: "'Source Serif 4', Georgia, serif" }}
              />
              <div style={{ fontSize: 11.5, color: "#9aaa9a", marginTop: 6 }}>{transcript.length} chars · {wordCount(transcript)} words</div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        {(tab === "type" || (tab === "record" && transcript)) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button className="sec-btn" onClick={() => { setTranscript(""); setMinutes(null); setGenError(""); }} style={{ background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 8, padding: "10px 20px", fontSize: 13, color: "#5a7a5a", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>Clear</button>
            <button className="action-btn" onClick={generateMinutes} disabled={genLoading || !transcript.trim()} style={{ flex: 1, background: genLoading || !transcript.trim() ? "#5a7a5a" : "#1a3a1a", color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: genLoading || !transcript.trim() ? "not-allowed" : "pointer", fontFamily: "'Libre Baskerville', Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.15s" }}>
              {genLoading ? <><Spinner /> {loadingMsg}</> : "🏛️ Generate Official Minutes →"}
            </button>
          </div>
        )}

        {genError && <div style={{ background: "#fce8e8", border: "1px solid #f0b0b0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13.5, color: "#8a1a1a" }}>⚠️ {genError}</div>}

        {/* Output */}
        {minutes && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 15, fontWeight: 700, color: "#1a2e1a" }}>✅ Official Minutes Generated</div>
              <button onClick={copyText} style={{ background: "#f0f5ee", border: "1px solid #c8d4c0", borderRadius: 7, padding: "7px 14px", fontSize: 12.5, color: "#2e4e2e", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}>
                {copied ? "✓ Copied!" : "📋 Copy Text"}
              </button>
            </div>
            <div ref={outputRef} style={{ background: "#fff", border: "1px solid #c8d4c0", borderRadius: 12, padding: "28px 30px", boxShadow: "0 2px 16px rgba(26,58,26,0.08)" }}>
              <MinutesDocument data={minutes} />
            </div>
          </div>
        )}

        {/* Feature cards when empty */}
        {!minutes && !genLoading && recState === "idle" && !transcript && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 4 }}>
            {[
              { icon: "🎙️", title: "Live Recording", desc: "Record meetings directly. Audio saved + speech auto-transcribed in real time." },
              { icon: "🌐", title: "Trilingual AI", desc: "Processes Urdu, Roman Urdu, English or any mix. Translates into formal English." },
              { icon: "⚖️", title: "Legally Precise", desc: "No invented facts. Missing data clearly marked. Suitable for official records." }
            ].map((c, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #c8d4c0", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 4px rgba(26,58,26,0.05)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, fontWeight: 700, color: "#1a2e1a", marginBottom: 5 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: "#5a7a5a", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
