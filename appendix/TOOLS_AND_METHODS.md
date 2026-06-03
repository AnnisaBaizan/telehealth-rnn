# TOOLS, METHODS & AI-USE DISCLOSURE (Lampiran D)

Honest documentation of every tool used to build this package — and, equally
important, the tools deliberately **not** used. This doubles as the
AI-assistance disclosure that journals (ICMJE, COPE, JMIR, Elsevier) now
require. Keep it; adapt the disclosure paragraph into your cover letter.

---

## 1. What was actually used

| Stage | Tool | Version/source | What it did |
|-------|------|----------------|-------------|
| Read source file | pandoc / extract-text | system | Read your uploaded `.docx` to confirm it was abstract-only |
| Journal + DOI research | Web search (live) | — | Found current journal metrics; verified every DOI against publisher/PhysioNet records |
| Manuscript files | `docx` (docx-js) | npm `docx` | Generated `manuscript_EN.docx` / `manuscript_ID.docx` programmatically (Node.js) |
| Manuscript validation | docx validate script | — | Confirmed both files are schema-valid |
| Synthetic data | Python `numpy` + `pandas` | numpy default_rng, seed=42 | Rule-based, seeded stochastic generator for the tele-nursing layer |
| Data split + metrics | `scikit-learn` | >=1.3 | Stratified splits; AUROC, AUPRC, sensitivity, specificity, F1, confusion matrix |
| Model | `PyTorch` | torch 2.x | GRU/LSTM early-deterioration classifier |
| Result figures (Fig 3-5) | `matplotlib` | >=3.7 | ROC, PR, confusion-matrix plots **from the real model run only** |
| Pipeline utilities | `pyyaml`, `tqdm`, `requests` | — | Config, progress, dataset download |
| Drafting / writing | AI assistant (Claude) | — | Drafted original prose, code, and structure (see disclosure §4) |

## 2. What was NOT used — and why

| Not used | Why |
|----------|-----|
| **AI "humanizer" / text-spinner** (e.g. tools that reword AI text to beat AI-detectors) | These exist to *disguise* AI authorship. Using one while not disclosing AI use is misrepresentation and breaches journal policy. The honest path is to disclose AI assistance and revise the text yourself for voice and accuracy. |
| **Article spinner / synonym paraphraser on sources** | Spinning a source sentence is disguised copying — the classic plagiarism trap. The manuscript instead states ideas in original prose and cites the source. |
| **Image generator for result figures** | An image generator would *invent* a plot — fabrication. Result figures come only from `plot_figures.py` on the real run. |
| **Plagiarism / similarity checker** | None is bundled here. You must run one before submission — see §3. |
| **GAN / deep generative synthesis for the synthetic layer** | Overkill and opaque. A transparent, seeded rule-based generator is auditable and reproducible, which is what an editor wants. |

## 3. Plagiarism & similarity checking — what YOU should run

Run an originality check before submission; most journals run one anyway.
- **iThenticate** — the industry/journal standard (Crossref Similarity Check). Best single check before submitting.
- **Turnitin** — common at universities; same engine family.
- Institutional library access often provides one of the above free.
Aim for a low similarity index with no single source over a few percent; the
References section and common method phrases will always show some match — that
is normal. Investigate any *contiguous* matched passage.

## 4. AI-use disclosure (paste/adapt into your manuscript + cover letter)

> "The authors used an AI assistant to help draft and structure the manuscript,
> generate the analysis code, and create a synthetic demonstration dataset. All
> data analysis was performed on publicly available datasets; all reported
> results were produced by the authors running the released code. The authors
> reviewed and verified all content, take full responsibility for it, and
> confirm no fabricated data or citations were introduced. AI was not used to
> evade plagiarism or AI-detection systems."

Adjust to the chosen journal's exact wording. Note: AI tools cannot be listed
as authors (ICMJE/COPE), only disclosed as a tool.

## 5. Reproducibility note
Random seed = 42 (in `config.yaml`). Synthetic data, splits, training and
evaluation are deterministic given the seed, the dataset version, and the
package versions in `requirements.txt`.
