# DataForge Site Design Direction

## Reference Ground Truth

The pasted visual brief is the ground-truth reference for the website's composition and interaction restraint: a warm cream canvas, near-black ink, a single monospaced type system, hairline section rules, generous 96px rhythm, bracketed ASCII markers, sharp text blocks, and one reserved inverted terminal surface. The site must not imitate OpenCode branding, wordmark, names, or copy. It will translate that sparse terminal-manual language into a distinct **DataForge** product narrative.

## Chosen Approach: Field Manual for Autonomous Data Work

**Design Movement.** Editorial systems design with terminal-manual minimalism. The website should feel like a carefully edited technical field guide rather than a conventional SaaS landing page.

**Core Principles.** The composition remains left-led and text-first; hierarchy comes from scale, rules, and contrast rather than cards or shadows. One dark terminal surface holds the active product story while the surrounding page stays calm and paper-like. Every feature is written as an operational capability, not marketing filler. The visible system reinforces reproducibility, restraint, and inspectable state.

**Color Philosophy.** A warm off-white canvas creates the feeling of a printed engineering notebook. Deep brown-black anchors all text and the terminal surface. A restrained cobalt blue signals model and provider configuration; success green and warning amber appear only inside terminal status lines, preserving the reference's sparse semantic color discipline.

**Layout Paradigm.** A narrow asymmetric reading rail governs the narrative. The hero carries a left editorial column and a wider right terminal simulation; subsequent sections alternate between long-form notes, command rows, and ruled diagnostic panels. Avoid symmetrical card grids.

**Signature Elements.** The DataForge diamond glyph is a compact mark built from terminal characters. Bracketed `[+]`, `[ok]`, and `[?]` markers structure lists. A fixed-width prompt row and state-file preview recur as proof of the product rather than decoration.

**Interaction Philosophy.** Interactions are utilitarian: command snippets copy to the clipboard, section links jump to specific runbook material, and the terminal tabs switch a small amount of information without theatrical motion. The behavior should reward inspection and rapid retrieval.

**Animation.** Use a short 160–220ms opacity/transform entrance on major reading blocks and a single 200ms terminal-tab transition. Buttons respond with a 0.97 scale press. Respect reduced-motion preferences and avoid looping visual effects.

**Typography System.** JetBrains Mono leads the page, with IBM Plex Mono as the fallback. Headlines use 700 weight at display scale, body copy uses 400 with 1.55 line height, and command text uses 500. No proportional font enters the interface.

**Brand Essence.** DataForge is an inspectable terminal agent for teams that need their data work to stay reproducible from first question to verified artifact. Personality: exacting, calm, capable.

**Brand Voice.** Headlines are declarative and specific; CTAs sound like commands; microcopy says what the system will record or verify. Example lines: “Turn a dataset into a verified artifact.” and “Inspect first. Forge second.”

**Wordmark & Logo.** The mark is a forged diamond made from `◢◆◣` and paired with the compact DATA / FORGE stacked wordmark. It is distinct from the source project's pixel typography and does not reuse its letters or silhouette.

**Signature Brand Color.** Forge Cobalt `#1769e0` is reserved for configuration, links, and selected terminal affordances.

## Style Decisions

- Preserve the reference's warm monochrome restraint, but use DataForge-specific product language and geometry.
- Use no photography, gradients, drop shadows, rounded content cards, or testimonial content.
- Keep content specific to the fork: Zen/Big Pickle configuration, extension points, workspace doctor, generated state, and verification outcomes.
- The forged diamond `◢◆◣` is the only recurring DataForge mark and is paired consistently with the stacked DATA / FORGE wordmark.
- Dark inversion belongs to the primary terminal proof only; runtime and state evidence remain paper-native diagnostic excerpts.
- Forge Cobalt `#1769e0` is reserved for configuration, selected terminal affordances, section indices, command references, and provider/model links.
