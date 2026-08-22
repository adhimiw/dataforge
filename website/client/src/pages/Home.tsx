/** DataForge terminal-field-manual: asymmetric editorial reading rail, hairline rules, one dark terminal. */
import { useState } from "react";

const setupCommand = 'export OPENCODE_API_KEY="your-zen-key"';
const doctorCommand = "dataforge workspace doctor .";

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="mark">[{children}]</span>;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="button secondary" type="button" onClick={copy}>
      {copied ? "[ok] copied" : label}
    </button>
  );
}

const extensionPoints = [
  ["01", "Brand module", "The product name, Big Pickle identifier, and visible provider label live in one runtime-aware module."],
  ["02", "Config resolver", "Defaults are injected only by the DataForge entry point; explicit project models stay in control."],
  ["03", "Primary agent", "The dataforge agent plans, profiles, writes reproducible artifacts, records state, and verifies work."],
  ["04", "Workspace command", "workspace init creates durable state and guidance; workspace doctor reports readiness without exposing secrets."],
  ["05", "TUI surfaces", "The wordmark, prompts, connection dialog, recovery view, and onboarding use DataForge language."],
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DataForge home">
          <span className="forge-glyph" aria-hidden="true">◢◆◣</span>
          <span className="brand-wordmark">DATA<br />FORGE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#story">story</a>
          <a href="#runtime">runtime</a>
          <a href="#extensions">extensions</a>
          <a href="#runbook">runbook</a>
        </nav>
        <a className="header-cta" href="#runbook">[+] runbook</a>
      </header>

      <main id="top">
        <section className="hero section-grid" aria-labelledby="hero-title">
          <div className="hero-copy reveal">
            <p className="eyebrow"><Mark>001</Mark> TERMINAL AGENT / DATA ENGINEERING</p>
            <h1 id="hero-title">Turn a dataset into a verified artifact.</h1>
            <p className="lede">
              DataForge is a distinctly branded terminal fork for teams that need inspection, analysis,
              notebook execution, debugging, and evidence to remain in one reproducible thread.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#story">read the field manual →</a>
              <CopyButton text={setupCommand} label="copy Zen setup" />
            </div>
            <p className="microcopy">Big Pickle is the default runtime model. The credential stays local. The work leaves a trail.</p>
          </div>

          <div className="terminal-hero reveal delay-1" aria-label="DataForge terminal preview">
            <img className="terminal-art" src="/manus-storage/dataforge-hero-terminal_b4df18d2.png" alt="Abstract DataForge terminal visualization" />
            <div className="terminal-scrim" />
            <div className="terminal-content">
              <div className="terminal-tabs"><span className="active">DataForge</span><span>Plan</span><span>Doctor</span></div>
              <div className="terminal-mark"><span>◢◆◣</span><small>DATA / FORGE</small></div>
              <p className="terminal-session">session: inspect → forge → verify</p>
              <div className="prompt-line"><span className="blue">›</span> {doctorCommand}</div>
              <div className="terminal-output">
                <span className="green">[ok]</span> model: opencode/big-pickle<br />
                <span className="green">[ok]</span> workspace: .dataforge/state.json<br />
                <span className="amber">[?]</span> raw data remains in project scope<br />
                <span className="dim">— verification ready</span>
              </div>
              <div className="terminal-footer"><span>tab switch agent</span><span>ctrl+p commands</span></div>
            </div>
          </div>
        </section>

        <section id="story" className="ruled-section story-section reveal">
          <div className="section-heading"><p><Mark>02</Mark> PROJECT STORY</p><span>from terminal core to data workflow</span></div>
          <div className="story-grid">
            <div className="story-intro">
              <h2>How it started.<br />How it is going.</h2>
              <p>
                The starting point was a capable open terminal runtime. The problem was not raw access to a model;
                it was the missing operating language for data work: inspect before modeling, record assumptions,
                make artifacts rerunnable, and verify before claiming a result.
              </p>
            </div>
            <ol className="story-log">
              <li><span>01</span><div><strong>Keep the runtime, replace the posture.</strong><p>The fork retains compatible provider plumbing while replacing the name, visible identity, onboarding, and default operating model.</p></div></li>
              <li><span>02</span><div><strong>Forge a data-specific primary agent.</strong><p>DataForge starts with schema inspection, protects raw data from unnecessary chat exposure, and treats notebooks and state as first-class output.</p></div></li>
              <li><span>03</span><div><strong>Make readiness inspectable.</strong><p>Local workspace state, a deterministic initializer, and a doctor command expose what exists, what is configured, and what still needs attention.</p></div></li>
            </ol>
          </div>
        </section>

        <section id="runtime" className="ruled-section runtime-section reveal">
          <div className="section-heading"><p><Mark>03</Mark> RUNTIME CONTRACT</p><span>Zen gateway / Big Pickle default</span></div>
          <div className="runtime-layout">
            <div className="runtime-copy">
              <h2>One safe default.<br />A visible escape hatch.</h2>
              <p>
                The DataForge executable marks itself as a runtime before config resolution. With no project model chosen,
                it selects <code>opencode/big-pickle</code>, labels the compatible provider as <code>DataForge Zen</code>,
                and narrows the picker to that free model.
              </p>
              <ul className="ascii-list">
                <li><Mark>ok</Mark> Zen credentials are read from <code>OPENCODE_API_KEY</code>.</li>
                <li><Mark>ok</Mark> The key is never written into source, state, logs, or diagnostics.</li>
                <li><Mark>ok</Mark> An explicit project model remains authoritative.</li>
                <li><Mark>+</Mark> Set <code>DATAFORGE_ALLOW_PROVIDER_SWITCH=1</code> to intentionally open the provider choice.</li>
              </ul>
            </div>
            <div className="config-panel" aria-label="DataForge configuration example">
              <div className="panel-title"><span>dataforge runtime</span><span>locked default</span></div>
              <pre>{`$ ${setupCommand}
$ dataforge

runtime: enabled
agent: dataforge
provider: DataForge Zen
model: opencode/big-pickle
sharing: disabled

# optional override
DATAFORGE_ALLOW_PROVIDER_SWITCH=1`}</pre>
            </div>
          </div>
        </section>

        <section id="extensions" className="ruled-section extensions-section reveal">
          <div className="section-heading"><p><Mark>04</Mark> EXTENSION POINTS</p><span>where the fork is intentionally different</span></div>
          <div className="extensions-top">
            <div>
              <h2>Built to stay readable when it grows.</h2>
              <p>The extension points are deliberately small, explicit, and testable. The fork does not hide product behavior inside a prompt or a CSS rename.</p>
            </div>
            <img src="/manus-storage/dataforge-extension-pattern_f0155e0c.png" alt="Abstract extension point texture" />
          </div>
          <div className="extension-list">
            {extensionPoints.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span><h3>{title}</h3><p>{copy}</p><span className="arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section id="runbook" className="ruled-section runbook-section reveal">
          <div className="section-heading"><p><Mark>05</Mark> RUNBOOK</p><span>initialize, inspect, continue</span></div>
          <div className="runbook-layout">
            <div className="doctor-card">
              <p className="eyebrow"><Mark>command</Mark> readiness without disclosure</p>
              <h2>Run workspace doctor.</h2>
              <p>Doctor reports the active DataForge model, provider label, Node runtime, workspace location, and whether a Zen key is present. It never prints the credential value.</p>
              <div className="command-row"><code>{doctorCommand}</code><CopyButton text={doctorCommand} label="copy" /></div>
              <p className="hint">Use <code>dataforge workspace init .</code> once to create the state directory and project instructions without overwriting existing files.</p>
            </div>
            <div className="state-preview">
              <img src="/manus-storage/dataforge-state-artifact_68032fb0.png" alt="Abstract workspace state illustration" />
              <div className="state-code"><span className="state-title">.dataforge/state.json</span><pre>{`{
  "status": "initialized",
  "workspace": null,
  "last_run": null,
  "artifacts": [],
  "checks": []
}`}</pre><span className="state-note">[ok] ignored locally / template versioned</span></div>
            </div>
          </div>
        </section>

        <section className="ruled-section audit-section reveal">
          <div className="section-heading"><p><Mark>06</Mark> DELIVERY NOTE</p><span>what is actually verified</span></div>
          <div className="audit-grid">
            <p><strong>Passed</strong><br />installation, TUI typecheck, focused config and agent tests, workspace init/doctor smoke checks, formatting, and diff hygiene.</p>
            <p><strong>Documented</strong><br />the implementation report records every major fork surface, the Zen/Big Pickle configuration, and the sandbox-bound full typecheck limitation.</p>
            <a className="button primary" href="#top">return to top ↑</a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand"><span className="forge-glyph">◢◆◣</span> DATAFORGE / 2026</div>
        <div><a href="#runtime">Zen integration</a><a href="#extensions">architecture</a><a href="#runbook">workspace doctor</a></div>
        <p>Inspect first. Forge second.</p>
      </footer>
    </div>
  );
}
