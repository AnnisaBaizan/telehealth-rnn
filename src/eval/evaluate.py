#!/usr/bin/env python3
"""
evaluate.py
-----------
Loads the trained checkpoint, scores the held-out test set, and writes
results/metrics.json. These numbers are what you paste into the manuscript
Results placeholders. Nothing is hard-coded — all metrics come from the
real model on the real PhysioNet test split.

Run from project root:  python -m src.eval.evaluate
"""
import os
import sys
import json
import yaml
import numpy as np
import torch
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    precision_recall_fscore_support, roc_curve, precision_recall_curve,
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.model import build_model  # noqa: E402


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def main():
    cfg = load_cfg()
    proc = cfg["data"]["processed_dir"]
    res = cfg["eval"]["results_dir"]
    thr = cfg["eval"]["alarm_threshold"]

    Xte = torch.tensor(np.load(f"{proc}/X_test.npy"))
    yte = np.load(f"{proc}/y_test.npy")

    ckpt = torch.load(f"{res}/model.pt", map_location="cpu")
    model = build_model(cfg, ckpt["n_features"])
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    with torch.no_grad():
        logits = model(Xte).numpy()
    probs = 1 / (1 + np.exp(-logits))
    preds = (probs >= thr).astype(int)

    tn, fp, fn, tp = confusion_matrix(yte, preds).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) else 0.0   # recall / TPR
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    false_alarm_rate = fp / (fp + tn) if (fp + tn) else 0.0
    prec, rec, f1, _ = precision_recall_fscore_support(
        yte, preds, average="binary", zero_division=0
    )
    metrics = {
        "n_test_windows": int(len(yte)),
        "positives_test": int(yte.sum()),
        "auroc": float(roc_auc_score(yte, probs)),
        "auprc": float(average_precision_score(yte, probs)),
        "sensitivity_recall": float(sensitivity),
        "specificity": float(specificity),
        "precision": float(prec),
        "f1": float(f1),
        "false_alarm_rate": float(false_alarm_rate),
        "threshold": thr,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp),
                             "fn": int(fn), "tp": int(tp)},
    }
    os.makedirs(res, exist_ok=True)
    with open(f"{res}/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # save curve points for plotting
    fpr, tpr, _ = roc_curve(yte, probs)
    p, r, _ = precision_recall_curve(yte, probs)
    np.savez(f"{res}/curves.npz", fpr=fpr, tpr=tpr, prec=p, rec=r,
             probs=probs, y=yte)

    print(json.dumps(metrics, indent=2))
    print(f"\n[done] metrics -> {res}/metrics.json")
    print("Paste these into the manuscript Results placeholders.")


if __name__ == "__main__":
    main()
