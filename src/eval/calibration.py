#!/usr/bin/env python3
"""
calibration.py
--------------
Calibration assessment of the GRU risk scores (and the logistic-regression
baseline) on the real PhysioNet/CinC 2019 test split:
  - reliability curve (predicted vs observed frequency)
  - Brier score
  - Expected Calibration Error (ECE, 10 equal-width bins)

Reads results/curves.npz (GRU probs) and results/baseline_probs.npz (LR).
Writes results/calibration.json and figures/figure7_calibration.png.

Run from project root:  python -m src.eval.calibration
"""
import os
import sys
import json
import yaml
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import brier_score_loss
from sklearn.calibration import calibration_curve
from sklearn.isotonic import IsotonicRegression

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def gru_val_probs():
    """Score the GRU on the validation split for recalibration fitting."""
    import torch
    from models.model import build_model
    with open("config.yaml") as f:
        cfg = yaml.safe_load(f)
    proc = cfg["data"]["processed_dir"]
    Xva = torch.tensor(np.load(f"{proc}/X_val.npy"))
    yva = np.load(f"{proc}/y_val.npy").astype(int)
    ckpt = torch.load("results/model.pt", map_location="cpu")
    model = build_model(cfg, ckpt["n_features"])
    model.load_state_dict(ckpt["state_dict"]); model.eval()
    with torch.no_grad():
        logits = model(Xva).numpy()
    return 1 / (1 + np.exp(-logits)), yva


def ece(y, p, n_bins=10):
    """Expected Calibration Error with equal-width bins."""
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    idx = np.digitize(p, bins[1:-1])
    total = len(p)
    e = 0.0
    for b in range(n_bins):
        m = idx == b
        if not m.any():
            continue
        conf = p[m].mean()
        acc = y[m].mean()
        e += (m.sum() / total) * abs(acc - conf)
    return float(e)


def main():
    res = "results"
    figs = "figures"
    os.makedirs(figs, exist_ok=True)

    gru = np.load(f"{res}/curves.npz")
    y, p_gru = gru["y"].astype(int), gru["probs"]
    out = {
        "gru": {
            "brier": float(brier_score_loss(y, p_gru)),
            "ece_10bin": ece(y, p_gru),
        }
    }

    # ---- isotonic recalibration (fit on validation, apply to test) ----
    p_cal = None
    try:
        p_val, y_val = gru_val_probs()
        iso = IsotonicRegression(out_of_bounds="clip")
        iso.fit(p_val, y_val)
        p_cal = iso.predict(p_gru)
        out["gru_isotonic_recalibrated"] = {
            "brier": float(brier_score_loss(y, p_cal)),
            "ece_10bin": ece(y, p_cal),
            "note": "isotonic fit on validation split, applied to test",
        }
        np.savez(f"{res}/calibrated_probs.npz", p_cal=p_cal, y=y)
    except Exception as e:  # keep going even if checkpoint is unavailable
        print(f"[warn] recalibration skipped: {e}")

    series = [("GRU (raw)", p_gru, "#1F3864")]
    if p_cal is not None:
        series.append(("GRU (isotonic)", p_cal, "#1B6B2F"))
    bp_path = f"{res}/baseline_probs.npz"
    if os.path.exists(bp_path):
        bp = np.load(bp_path)
        p_lr = bp["lr_probs"]
        out["logistic_regression"] = {
            "brier": float(brier_score_loss(y, p_lr)),
            "ece_10bin": ece(y, p_lr),
        }
        series.append(("Logistic regression", p_lr, "#B9770E"))

    with open(f"{res}/calibration.json", "w") as f:
        json.dump(out, f, indent=2)

    # ---- figure 7: reliability diagram + risk histogram ----
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.4))
    ax1.plot([0, 1], [0, 1], "--", color="gray", label="Perfect")
    for name, p, c in series:
        frac_pos, mean_pred = calibration_curve(y, p, n_bins=10, strategy="quantile")
        ax1.plot(mean_pred, frac_pos, "o-", color=c, lw=1.6, ms=4, label=name)
    ax1.set_xlabel("Predicted risk"); ax1.set_ylabel("Observed frequency")
    ax1.set_title("Figure 7a. Reliability curve")
    ax1.legend(fontsize=8); ax1.set_xlim(0, 1); ax1.set_ylim(0, 1)

    ax2.hist(p_gru, bins=30, color="#2E5496", alpha=0.85)
    ax2.set_yscale("log")
    ax2.set_xlabel("Predicted risk (GRU)"); ax2.set_ylabel("Count (log)")
    ax2.set_title("Figure 7b. Risk-score distribution")
    plt.tight_layout()
    out_png = f"{figs}/figure7_calibration.png"
    plt.savefig(out_png, dpi=200, bbox_inches="tight"); plt.close()

    print(json.dumps(out, indent=2))
    print(f"[done] calibration -> {res}/calibration.json ; {out_png}")


if __name__ == "__main__":
    main()
