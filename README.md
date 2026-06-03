# Tele-Nursing + Wearable AI — Early Deterioration Detection (Pathway D)

A reproducible, **honest** research package: an RNN early-deterioration
detector trained on **real, open** physiological time-series data, plus a
clearly-labelled **synthetic** tele-nursing integration layer.

This is *not* a write-up of a completed 420-patient clinical trial. It is a
public-data study that produces real, verifiable results you can report.

## Layout
```
telehealth-rnn/
├── config.yaml                 # all paths & hyperparameters
├── requirements.txt
├── setup.md                    # full reproduction guide  <-- start here
├── README.md
├── src/
│   ├── data_ingest/            # download_data.py, preprocess.py
│   ├── synthetic/              # generate_synthetic_telenursing.py (SYNTHETIC)
│   ├── models/                 # model.py (GRU/LSTM), train.py
│   └── eval/                   # evaluate.py (metrics), plot_figures.py
├── manuscript/
│   ├── manuscript_EN.docx      # English scaffold (results = placeholders)
│   ├── manuscript_ID.docx      # Indonesian scaffold
│   ├── figure_prompts.md       # Fig 1-2 image prompts; Fig 3-5 from code only
│   └── references.md           # verified real DOIs
├── appendix/
│   ├── data_provenance.md      # REAL vs SYNTHETIC table + DOIs
│   └── data_dictionary.md
├── data/  results/  figures/   # populated when you run the pipeline
```

## Quickstart
See `setup.md`. TL;DR:
```bash
pip install -r requirements.txt
python src/data_ingest/download_data.py
python src/data_ingest/preprocess.py
python -m src.models.train
python -m src.eval.evaluate     # -> results/metrics.json (your numbers)
python -m src.eval.plot_figures # -> figures/figure3-5
```

## Integrity rules baked in
- Result figures come only from the model run, never from image generators.
- Synthetic data is stamped `data_type=SYNTHETIC` and never reported as outcomes.
- Manuscript ships with `[[RUN PIPELINE]]` markers instead of fabricated numbers.
