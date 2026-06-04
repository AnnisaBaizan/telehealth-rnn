#!/usr/bin/env python3
"""
stats_ci.py
-----------
Statistical rigor for the GRU detector on the real PhysioNet/CinC 2019 test
split:
  - stratified bootstrap 95% CIs for AUROC, AUPRC and sensitivity@0.5
  - DeLong test for the AUROC difference between the GRU and the logistic-
    regression baseline (z-statistic and two-sided p-value)

Reads results/curves.npz (GRU) and results/baseline_probs.npz (LR).
Writes results/stats_ci.json.

Run from project root:  python -m src.eval.stats_ci
"""
import os
import json
import numpy as np
from scipy import stats
from sklearn.metrics import roc_auc_score, average_precision_score


# ---------------- bootstrap ----------------
def bootstrap_ci(y, p, thr=0.5, B=1000, seed=42):
    rng = np.random.default_rng(seed)
    pos = np.where(y == 1)[0]
    neg = np.where(y == 0)[0]
    aurocs, auprcs, senss = [], [], []
    for _ in range(B):
        bi = np.concatenate([rng.choice(pos, len(pos), replace=True),
                             rng.choice(neg, len(neg), replace=True)])
        yb, pb = y[bi], p[bi]
        aurocs.append(roc_auc_score(yb, pb))
        auprcs.append(average_precision_score(yb, pb))
        predb = (pb >= thr).astype(int)
        tp = np.sum(predb & (yb == 1)); fn = np.sum((predb == 0) & (yb == 1))
        senss.append(tp / (tp + fn) if (tp + fn) else 0.0)

    def ci(a):
        return [float(np.percentile(a, 2.5)), float(np.percentile(a, 97.5))]
    return {
        "auroc": {"point": float(roc_auc_score(y, p)), "ci95": ci(aurocs)},
        "auprc": {"point": float(average_precision_score(y, p)), "ci95": ci(auprcs)},
        "sensitivity@0.5": {"point": float(np.mean(senss)), "ci95": ci(senss)},
        "n_bootstrap": B,
    }


# ---------------- DeLong (fast, Sun & Xu 2014) ----------------
def _midrank(x):
    J = np.argsort(x)
    Z = x[J]
    N = len(x)
    T = np.zeros(N, dtype=float)
    i = 0
    while i < N:
        j = i
        while j < N and Z[j] == Z[i]:
            j += 1
        T[i:j] = 0.5 * (i + j - 1) + 1
        i = j
    T2 = np.empty(N, dtype=float)
    T2[J] = T
    return T2


def _fast_delong(preds_sorted, m):
    """preds_sorted: (k, n) predictions, positives first (m positives)."""
    n = preds_sorted.shape[1] - m
    k = preds_sorted.shape[0]
    pos = preds_sorted[:, :m]
    neg = preds_sorted[:, m:]
    tx = np.empty((k, m)); ty = np.empty((k, n)); tz = np.empty((k, m + n))
    for r in range(k):
        tx[r] = _midrank(pos[r]); ty[r] = _midrank(neg[r]); tz[r] = _midrank(preds_sorted[r])
    aucs = (tz[:, :m].sum(axis=1) / m - (m + 1) / 2.0) / n
    v01 = (tz[:, :m] - tx) / n
    v10 = 1.0 - (tz[:, m:] - ty) / m
    sx = np.cov(v01); sy = np.cov(v10)
    sx = np.atleast_2d(sx); sy = np.atleast_2d(sy)
    cov = sx / m + sy / n
    return aucs, cov


def delong_test(y, p1, p2):
    """Two-sided DeLong test for AUROC(p1) - AUROC(p2)."""
    order = np.argsort(-y)  # positives (1) first
    y_s = y[order]
    m = int(np.sum(y_s == 1))
    preds = np.vstack([p1[order], p2[order]])
    aucs, cov = _fast_delong(preds, m)
    var = cov[0, 0] + cov[1, 1] - 2 * cov[0, 1]
    diff = aucs[0] - aucs[1]
    z = diff / np.sqrt(var) if var > 0 else 0.0
    pval = 2 * (1 - stats.norm.cdf(abs(z)))
    return {
        "auroc_model1": float(aucs[0]), "auroc_model2": float(aucs[1]),
        "auroc_difference": float(diff), "z": float(z), "p_value": float(pval),
    }


def main():
    res = "results"
    g = np.load(f"{res}/curves.npz")
    y, p_gru = g["y"].astype(int), g["probs"]

    out = {"gru_bootstrap": bootstrap_ci(y, p_gru)}

    bp = f"{res}/baseline_probs.npz"
    if os.path.exists(bp):
        p_lr = np.load(bp)["lr_probs"]
        out["delong_gru_vs_logreg"] = delong_test(y, p_gru, p_lr)

    with open(f"{res}/stats_ci.json", "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out, indent=2))
    print(f"[done] stats -> {res}/stats_ci.json")


if __name__ == "__main__":
    main()
