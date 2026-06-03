# FIGURE & EQUATION GENERATION GUIDE (Lampiran C)

A critical, honest distinction — please read first:

- **Result figures (Fig 3–5): NEVER use an image generator.** ROC curves,
  PR curves, confusion matrices, and performance bars must be plotted from the
  real model run via `src/eval/plot_figures.py`. An image generator would
  fabricate data — that is the exact misconduct we are avoiding. These are
  produced automatically when you run the pipeline.
- **Conceptual diagrams (Fig 1–2): image generator or a drawing tool is fine**,
  because they illustrate architecture, not data. Prompts below.
- **Equations:** do not "generate" as images. Use LaTeX/MathType so they are
  selectable and correct. LaTeX provided below.

---

## Figure 1 — System architecture (conceptual) → image generator OK
**Prompt to send to an image generator:**
> "Clean technical architecture diagram, flat vector style, white background.
> Left: an elderly patient wearing a smartwatch and chest patch emitting three
> labelled signals (Heart Rate, SpO2, Activity). Center: a cloud box labelled
> 'Edge/Cloud Ingestion' feeding a box labelled 'Recurrent Neural Network
> (GRU) — Early Deterioration Detector'. The RNN outputs a 'Risk Score' into a
> box labelled 'AI Alert Prioritisation'. Right: a nurse at a tele-nursing
> dashboard receiving prioritised alerts, with a feedback arrow 'Teleconsult /
> Patient-Reported Outcomes' back to the patient. Muted blue/teal palette,
> thin connectors with arrowheads, sans-serif labels, no photorealism."

## Figure 2 — Data pipeline & windowing (conceptual) → image generator OK
**Prompt:**
> "Flat vector schematic, white background. A horizontal time axis of hourly
> vital-sign samples. A sliding window of 8 hours highlighted in blue feeding
> an RNN icon, with a shaded 6-hour 'lead-time' region ahead labelled
> 'predict deterioration before onset'. Below, three lanes labelled
> 'REAL: PhysioNet vitals', 'REAL: wearable PPG (optional)', and a clearly
> separated dashed lane labelled 'SYNTHETIC: tele-nursing layer'. Minimalist,
> labelled, teal/grey palette."

## Figure 3 — ROC curve (RESULT) → `plot_figures.py` ONLY
Auto-generated: `figures/figure3_roc.png`. Do not image-generate.

## Figure 4 — Precision–Recall curve (RESULT) → `plot_figures.py` ONLY
Auto-generated: `figures/figure4_pr.png`.

## Figure 5 — Confusion matrix (RESULT) → `plot_figures.py` ONLY
Auto-generated: `figures/figure5_confusion.png`.

---

## Equations (use LaTeX, not images)

GRU update (per timestep *t*), inputs $x_t$, hidden $h_t$:

```latex
\begin{aligned}
z_t &= \sigma(W_z x_t + U_z h_{t-1} + b_z)\\
r_t &= \sigma(W_r x_t + U_r h_{t-1} + b_r)\\
\tilde{h}_t &= \tanh(W_h x_t + U_h (r_t \odot h_{t-1}) + b_h)\\
h_t &= (1 - z_t)\odot h_{t-1} + z_t \odot \tilde{h}_t
\end{aligned}
```

Risk score from the final hidden state $h_T$:

```latex
\hat{y} = \sigma(w^\top h_T + b)
```

Weighted binary cross-entropy (handles class imbalance, `pos_weight=neg/pos`):

```latex
\mathcal{L} = -\frac{1}{N}\sum_{i=1}^{N}\big[\, \omega\, y_i \log \hat{y}_i + (1-y_i)\log(1-\hat{y}_i)\big]
```

Sensitivity, specificity, false-alarm rate:

```latex
\text{Sens}=\frac{TP}{TP+FN},\quad
\text{Spec}=\frac{TN}{TN+FP},\quad
\text{FAR}=\frac{FP}{FP+TN}
```
