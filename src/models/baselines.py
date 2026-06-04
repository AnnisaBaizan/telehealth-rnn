#!/usr/bin/env python3
"""
baselines.py
------------
Reviewer-requested comparators for the GRU early-deterioration detector,
trained/evaluated on the SAME real PhysioNet/CinC 2019 splits:

  1. Logistic regression on hand-crafted window summaries (mean/std/min/max/
     last/slope of each vital over the 8-hour window) — a strong, standard,
     fully reproducible ML baseline.
  2. Deviation early-warning score (training-free): the summed absolute
     standardised deviation of the last hour's vitals — a transparent proxy
     for a threshold/EWS-style alert, used for discrimination comparison.

Outputs:
  results/baselines.json        — metrics for both baselines
  results/baseline_probs.npz    — logistic-regression test probabilities
                                  (for DeLong test, calibration, decision curves)

Run from project root:  python -m src.models.baselines
"""
import os
import json
import yaml
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    precision_recall_fscore_support,
)


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def window_summaries(X):
    """(N, T, F) standardised windows -> (N, F*6) summary features."""
    mean = X.mean(axis=1)
    std = X.std(axis=1)
    xmin = X.min(axis=1)
    xmax = X.max(axis=1)
    last = X[:, -1, :]
    slope = X[:, -1, :] - X[:, 0, :]
    return np.concatenate([mean, std, xmin, xmax, last, slope], axis=1)


def op_metrics(y, probs, thr):
    preds = (probs >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, preds).ravel()
    sens = tp / (tp + fn) if (tp + fn) else 0.0
    spec = tn / (tn + fp) if (tn + fp) else 0.0
    far = fp / (fp + tn) if (fp + tn) else 0.0
    prec, _, f1, _ = precision_recall_fscore_support(
        y, preds, average="binary", zero_division=0)
    return {
        "auroc": float(roc_auc_score(y, probs)),
        "auprc": float(average_precision_score(y, probs)),
        "sensitivity_recall": float(sens),
        "specificity": float(spec),
        "precision": float(prec),
        "f1": float(f1),
        "false_alarm_rate": float(far),
        "threshold": float(thr),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def main():
    cfg = load_cfg()
    proc = cfg["data"]["processed_dir"]
    res = cfg["eval"]["results_dir"]
    thr = cfg["eval"]["alarm_threshold"]
    seed = cfg.get("seed", 42)
    os.makedirs(res, exist_ok=True)

    Xtr = np.load(f"{proc}/X_train.npy"); ytr = np.load(f"{proc}/y_train.npy")
    Xte = np.load(f"{proc}/X_test.npy"); yte = np.load(f"{proc}/y_test.npy")

    # ---- 1. Logistic regression on window summaries ----
    Ftr, Fte = window_summaries(Xtr), window_summaries(Xte)
    lr = LogisticRegression(
        max_iter=2000, class_weight="balanced", C=1.0, solver="lbfgs", random_state=seed)
    lr.fit(Ftr, ytr)
    lr_probs = lr.predict_proba(Fte)[:, 1]
    lr_metrics = op_metrics(yte, lr_probs, thr)

    # ---- 2. Deviation early-warning score (training-free) ----
    # vitals are already standardised; summed |z| of the last hour ~ severity
    dev_score = np.abs(Xte[:, -1, :]).sum(axis=1)
    dev_metrics = {
        "auroc": float(roc_auc_score(yte, dev_score)),
        "auprc": float(average_precision_score(yte, dev_score)),
        "note": "discrimination only; training-free EWS-style severity proxy",
    }

    out = {
        "logistic_regression": lr_metrics,
        "deviation_ews": dev_metrics,
        "n_test_windows": int(len(yte)),
        "positives_test": int(yte.sum()),
        "feature_set": "per-vital mean/std/min/max/last/slope over 8h window (42 features)",
    }
    with open(f"{res}/baselines.json", "w") as f:
        json.dump(out, f, indent=2)
    np.savez(f"{res}/baseline_probs.npz", lr_probs=lr_probs, dev_score=dev_score, y=yte)

    print(json.dumps(out, indent=2))
    print(f"\n[done] baselines -> {res}/baselines.json")


if __name__ == "__main__":
    main()
