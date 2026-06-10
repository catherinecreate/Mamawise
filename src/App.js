import { useState, useRef, useEffect } from "react";

const TOPICS = [
  { id: "feeding", icon: "🤱", label: "Feeding", color: "#FFF0E6" },
  { id: "sleep", icon: "😴", label: "Sleep", color: "#EEF0FF" },
  { id: "health", icon: "🩺", label: "Health", color: "#E8F7EE" },
  { id: "growth", icon: "📏", label: "Growth", color: "#FFF8E6" },
  { id: "mental", icon: "💛", label: "Mom's Mind", color: "#FFF0F5" },
  { id: "schedule", icon: "🗓️", label: "Routines", color: "#F0F9FF" },
];

const RESOURCES = {
  feeding: [
    { title: "Breastfeeding vs formula — what nobody tells you", tag: "Real talk" },
    { title: "Why your baby keeps unlatching (and how to fix it)", tag: "Common issue" },
    { title: "How often should a newborn feed?", tag: "Basics" },
    { title: "Foods to eat and avoid while breastfeeding in Nigeria", tag: "Local context" },
  ],
  sleep: [
    { title: "Why your baby only sleeps on you", tag: "Common issue" },
    { title: "Building a sleep routine that actually works", tag: "Guide" },
    { title: "Is my baby sleeping too much or too little?", tag: "Basics" },
    { title: "Safe co-sleeping — facts vs myths", tag: "Safety" },
  ],
  health: [
    { title: "Vaccine schedule in Nigeria — what's due when", tag: "Local context" },
    { title: "Baby fever: when to worry, when to calm down", tag: "Common issue" },
    { title: "Normal poop colors and what they mean", tag: "Real talk" },
    { title: "Signs your baby might have colic", tag: "Guide" },
  ],
  growth: [
    { title: "Developmental milestones month by month (0–12)", tag: "Guide" },
    { title: "My baby isn't doing X yet — should I worry?", tag: "Common concern" },
    { title: "Tummy time: why it matters and how to do it", tag: "Basics" },
    { title: "Baby weight gain: what's normal?", tag: "Basics" },
  ],
  mental: [
    { title: "What postpartum depression actually feels like", tag: "Real talk" },
    { title: "When you love your baby but don't feel like yourself", tag: "Honest" },
    { title: "Talking to your partner when you're both exhausted", tag: "Relationships" },
    { title: "You're allowed to not enjoy every moment", tag: "Permission" },
  ],
  schedule: [
    { title: "A sample daily routine for a 0–3 month baby", tag: "Template" },
    { title: "Building a routine when NEPA won't cooperate", tag: "Local context" },
    { title: "How to transition from newborn chaos to gentle structure", tag: "Guide" },
    { title: "Morning routines for moms with no help", tag: "Real life" },
  ],
};

const SUGGESTED = [
  "My baby won't stop crying 😭",
  "Is it normal to feel this overwhelmed?",
  "How do I know if baby is getting enough milk?",
  "When do babies start sleeping through the night?",
  "My stitches are still painful — is that normal?",
];

const SYSTEM_PROMPT = `You are Mamawise — a warm, knowledgeable friend for new moms with babies aged 0–12 months. You speak like a real friend who happens to know a lot: honest, never preachy, never clinical, never scary. You give real, practical answers. You acknowledge the emotional side without being dramatic about it. You're especially aware of Nigerian context — Nigerian food, NEPA, house help situations, extended family pressure, local hospitals, and what it actually means to be a new mom in Nigeria with limited nearby support. Keep responses concise (3–5 sentences max unless the question genuinely needs more). Never say "as an AI" — you are Mamawise. Always end with one short, warm sentence that acknowledges how hard they're working. If something sounds like a genuine medical emergency, briefly say to see a doctor immediately but don't be alarmist about everything.`;

export default function App() {
  const [tab, setTab] = useState("ask");
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey mama 👋 I'm Mamawise — your no-judgment, always-available friend for everything baby (and everything you're going through). What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const bottomRef = useRef(null);

  // Capture Android install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show iOS hint if on Safari and not already installed
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && isSafari && !isStandalone) {
      setTimeout(() => setShowIOSHint(true), 3000);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  }

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-ipc": "true"
},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const reply = data.content?.map((b) => b.text || "").join("") ||
        "Sorry, something went wrong. Try again?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong on my end — try again in a second 💛" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#FFF9F5",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Android Install Banner */}
      {showInstallBanner && (
        <div style={{
          background: "linear-gradient(135deg, #FF8C69, #FF6B9D)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10,
        }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>📲 Add Mamawise to your phone</div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>Use it like a real app — no browser needed</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleInstall} style={{
              background: "#fff", border: "none", borderRadius: 8,
              padding: "6px 12px", fontWeight: 700, fontSize: 12,
              color: "#FF6B6B", cursor: "pointer", fontFamily: "inherit",
            }}>Install</button>
            <button onClick={() => setShowInstallBanner(false)} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
              padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 12,
              fontFamily: "inherit",
            }}>✕</button>
          </div>
        </div>
      )}

      {/* iOS Install Hint */}
      {showIOSHint && (
        <div style={{
          background: "#1A1A2E", color: "#fff",
          padding: "12px 16px", fontSize: 12, lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
        }}>
          <div>
            <span style={{ fontWeight: 600 }}>📲 Install on iPhone:</span> Tap the Share button
            (<span style={{ fontSize: 14 }}>⎙</span>) at the bottom of Safari, then tap
            <span style={{ fontWeight: 600 }}> "Add to Home Screen"</span>
          </div>
          <button onClick={() => setShowIOSHint(false)} style={{
            background: "none", border: "none", color: "#aaa",
            cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 0,
          }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #F0E8E0",
        padding: "16px 20px 12px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg, #FF8C69, #FF6B9D)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🌸</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#1A1A2E", letterSpacing: "-0.3px" }}>Mamawise</div>
            <div style={{ fontSize: 11, color: "#FF8C69", fontWeight: 500 }}>Your no-judgment baby friend</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 12, background: "#F5EDE8", borderRadius: 10, padding: 3 }}>
          {[{ id: "ask", label: "💬 Ask anything" }, { id: "resources", label: "📚 Resources" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "7px 0", border: "none", borderRadius: 8, cursor: "pointer",
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#FF6B6B" : "#9A8880",
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13,
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ASK TAB */}
      {tab === "ask" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
            {messages.length === 1 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#B0A0A0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Things moms are asking today
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SUGGESTED.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} style={{
                      background: "#fff", border: "1px solid #F0E0D8", borderRadius: 20,
                      padding: "7px 13px", fontSize: 12.5, color: "#5A4A4A",
                      cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3,
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}>
                {m.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF8C69, #FF6B9D)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, marginRight: 8, flexShrink: 0, alignSelf: "flex-end",
                  }}>🌸</div>
                )}
                <div style={{
                  maxWidth: "78%",
                  background: m.role === "user" ? "linear-gradient(135deg, #FF8C69, #FF6B9D)" : "#fff",
                  color: m.role === "user" ? "#fff" : "#2A1A1A",
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "11px 14px", fontSize: 14, lineHeight: 1.55,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)", whiteSpace: "pre-wrap",
                }}>{m.text}</div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF8C69, #FF6B9D)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, marginRight: 8,
                }}>🌸</div>
                <div style={{
                  background: "#fff", borderRadius: "18px 18px 18px 4px",
                  padding: "11px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#FFB39A",
                      animation: "bounce 1.2s infinite", animationDelay: `${d * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: 8 }} />
          </div>

          <div style={{
            padding: "12px 16px 20px", background: "#fff",
            borderTop: "1px solid #F0E8E0", position: "sticky", bottom: 0,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything, mama…"
                rows={1}
                style={{
                  flex: 1, border: "1.5px solid #F0E0D8", borderRadius: 20,
                  padding: "10px 16px", fontSize: 14, fontFamily: "inherit",
                  resize: "none", outline: "none", background: "#FFF9F5",
                  color: "#2A1A1A", lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                width: 42, height: 42, borderRadius: "50%", border: "none",
                background: input.trim() && !loading ? "linear-gradient(135deg, #FF8C69, #FF6B9D)" : "#F0E0D8",
                color: "#fff", fontSize: 18, cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s",
              }}>↑</button>
            </div>
          </div>
        </>
      )}

      {/* RESOURCES TAB */}
      {tab === "resources" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {!activeTopic ? (
            <>
              <div style={{ fontSize: 13, color: "#9A8880", marginBottom: 14, lineHeight: 1.5 }}>
                Real answers for real situations. Pick what's on your mind.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {TOPICS.map((t) => (
                  <button key={t.id} onClick={() => setActiveTopic(t.id)} style={{
                    background: t.color, border: "none", borderRadius: 16,
                    padding: "18px 14px", cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit",
                  }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#2A1A1A" }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: "#9A8880", marginTop: 2 }}>{RESOURCES[t.id].length} guides</div>
                  </button>
                ))}
              </div>
              <div style={{
                marginTop: 16, background: "linear-gradient(135deg, #FF8C69, #FF6B9D)",
                borderRadius: 16, padding: "16px 18px", cursor: "pointer",
              }} onClick={() => setTab("ask")}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                  Can't find your answer? 💬
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  Ask Mamawise anything — no question is too small or too embarrassing.
                </div>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTopic(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#FF8C69", fontWeight: 600, fontSize: 14,
                fontFamily: "inherit", marginBottom: 14, padding: 0,
                display: "flex", alignItems: "center", gap: 4,
              }}>← Back</button>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#1A1A2E", marginBottom: 4 }}>
                {TOPICS.find((t) => t.id === activeTopic)?.icon}{" "}
                {TOPICS.find((t) => t.id === activeTopic)?.label}
              </div>
              <div style={{ fontSize: 13, color: "#9A8880", marginBottom: 16 }}>
                Tap any topic to ask Mamawise about it
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {RESOURCES[activeTopic].map((r, i) => (
                  <button key={i} onClick={() => { setTab("ask"); sendMessage(r.title); }} style={{
                    background: "#fff", border: "1px solid #F0E0D8",
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#2A1A1A", lineHeight: 1.4 }}>{r.title}</div>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>→</div>
                    </div>
                    <div style={{
                      display: "inline-block", marginTop: 6,
                      background: TOPICS.find((t) => t.id === activeTopic)?.color,
                      borderRadius: 6, padding: "2px 8px",
                      fontSize: 11, fontWeight: 600, color: "#5A4A4A",
                    }}>{r.tag}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        * { box-sizing: border-box; }
        textarea::placeholder { color: #C0A898; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
}
