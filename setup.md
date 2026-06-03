# SETUP & REPRODUCTION GUIDE

Tele-Nursing + Wearable AI — Early Deterioration Detection (Pathway D: real public data)

This pipeline produces **real results** on the open PhysioNet/CinC 2019 dataset.
The numbers it outputs are what you paste into the manuscript Results
placeholders. Until you run it, the manuscript carries `[[RUN PIPELINE]]`
markers — do not invent numbers.

---

## 1. Environment

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Python 3.10+ recommended. A GPU is optional (set `train.device: cuda` in
`config.yaml`); CPU works for the GRU model.

### macOS notes (Apple Silicon M1/M2/M3 and Intel)

- Use `python3` and `pip3` (macOS ships an old system Python; install a current
  one via Homebrew: `brew install python@3.12`).
- Activate the venv with `source .venv/bin/activate` (zsh/bash, default on macOS).
- **Apple Silicon GPU:** leave `train.device: auto` (default) — the code now
  auto-selects the Metal/MPS backend on M-series chips, falling back to CPU
  elsewhere. Force it with `train.device: mps` if you prefer. On Intel Macs it
  stays on CPU, which is fine for the GRU.
- If you hit an SSL/certificate error on download, run once:
  `/Applications/Python\ 3.12/Install\ Certificates.command` (or
  `pip3 install certifi`).
- `unzip`/`wget` are available; the download script uses `requests`, so no extra
  system tools are needed.

## 2. Get the data (REAL, open)

```bash
python src/data_ingest/download_data.py
```

This fetches the PhysioNet/CinC 2019 training sets (open, no credentialing).
If the automatic download is blocked on your network, download manually from
<https://physionet.org/content/challenge-2019/1.0.0/> and unzip the per-patient
`.psv` files into `data/raw/physionet2019/`.

Optional, more on-topic but **credentialed** datasets (see
`appendix/data_provenance.md` for DOIs/licences):
- **MIMIC-IV** chronic-disease cohorts (requires CITI training + PhysioNet credentialing)
- **PPG-DaLiA** wearable PPG/accelerometer (CC BY 4.0) for the HR front-end

## 3. Preprocess

```bash
python src/data_ingest/preprocess.py
```

Builds windowed sequences (default: 8 h history, predict deterioration within
the next 6 h) and writes train/val/test tensors to `data/processed/`.
Normalisation statistics are fit on the training split only.

## 4. (Optional) Generate the SYNTHETIC tele-nursing layer

```bash
python src/synthetic/generate_synthetic_telenursing.py
```

> **WARNING — SYNTHETIC DATA.** This produces *simulated* tele-nursing logs,
> patient-reported outcomes, nurse response times, and adherence. It exists
> only to demonstrate the integration schema. Every row is stamped
> `data_type=SYNTHETIC`. **Never report these as clinical outcomes.**

## 5. Train

```bash
python -m src.models.train
```

Best checkpoint → `results/model.pt` (early stopping on validation loss).

## 6. Evaluate (produces the real numbers)

```bash
python -m src.eval.evaluate
```

Writes `results/metrics.json` containing AUROC, AUPRC, sensitivity,
specificity, precision, F1, false-alarm rate, and the confusion matrix.
**These are the values for the manuscript Results section.**

## 7. Figures

```bash
python -m src.eval.plot_figures
```

Produces `figures/figure3_roc.png`, `figure4_pr.png`, `figure5_confusion.png`
from the real run. Conceptual diagrams (Figures 1–2) are made separately — see
`manuscript/figure_prompts.md`.

---

## One-shot

```bash
python src/data_ingest/download_data.py \
 && python src/data_ingest/preprocess.py \
 && python src/synthetic/generate_synthetic_telenursing.py \
 && python -m src.models.train \
 && python -m src.eval.evaluate \
 && python -m src.eval.plot_figures
```

## Honest reporting checklist (read before submitting)

- [ ] Title/abstract state this is a **public-dataset** study (no proprietary 420-patient trial claim).
- [ ] "Deterioration" defined exactly as the PhysioNet Sepsis-3 onset label; stated as a proxy/testbed in Limitations.
- [ ] All result numbers come from `results/metrics.json`, not from the original abstract.
- [ ] Tele-nursing/PRO/adherence layer labelled SYNTHETIC everywhere it appears.
- [ ] Data/Code Availability section points to this repo + the dataset DOIs.
- [ ] Ethics: secondary analysis of de-identified public data; synthetic data involves no human subjects.
- [ ] `config.yaml` (window, lead time, seed) reported for reproducibility.
