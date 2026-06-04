#!/usr/bin/env python3
"""
decision_curve.py
-----------------
Decision-curve analysis (net benefit) on the real PhysioNet/CinC 2019 test
split, comparing the (isotonic-recalibrated) GRU detector against the
logistic-regression baseline and the default 'treat all' / 'treat none'
strategies across clinically plausible alarm-threshold probabilities.

Net benefit at threshold p_t:
    NB = TP/N - FP/N * (p_t / (1 - p_t))

Reads results/calibrated_probs.npz (falls back to curves.npz) and
results/baseline_probs.npz. Writes results/decision_curve.json and
figures/figure8_decision_curve.png.

Run from project root:  python -m src.eval.decision_curve
"""
import os
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def net_benefit(y, p, pt):
    n = len(y)
    pred = p >= pt
    tp = np.sum(pred & (y == 1))
    fp = np.sum(pred & (y == 0))
    return tp / n - (fp / n) * (pt / (1 - pt))


def main():
    res = "results"
    figs = "figures"
    os.makedirs(figs, exist_ok=True)

    # prefer the calibrated GRU probabilities for clinical-utility framing
    if os.path.exists(f"{res}/calibrated_probs.npz"):
        d = np.load(f"{res}/calibrated_probs.npz")
        y, p_gru = d["y"].astype(int), d["p_cal"]
        gru_label = "GRU (isotonic-recalibrated)"
    else:
        d = np.load(f"{res}/curves.npz")
        y, p_gru = d["y"].astype(int), d["probs"]
        gru_label = "GRU"

    prevalence = float(y.mean())
    thresholds = np.linspace(0.01, 0.50, 50)

    nb_gru = [net_benefit(y, p_gru, t) for t in thresholds]
    nb_all = [net_benefit(y, np.ones_like(p_gru), t) for t in thresholds]
    nb_none = [0.0 for _ in thresholds]

    series = [(gru_label, nb_gru, "#1B6B2F")]
    bp = f"{res}/baseline_probs.npz"
    if os.path.exists(bp):
        lr = np.load(bp)["lr_probs"]
        nb_lr = [net_benefit(y, lr, t) for t in thresholds]
        series.append(("Logistic regression", nb_lr, "#B9770E"))

    out = {
        "prevalence": prevalence,
        "thresholds": thresholds.tolist(),
        "net_benefit": {gru_label: nb_gru, **({"logistic_regression": series[-1][1]} if len(series) > 1 else {}),
                        "treat_all": nb_all, "treat_none": nb_none},
    }
    with open(f"{res}/decision_curve.json", "w") as f:
        json.dump(out, f, indent=2)

    plt.figure(figsize=(6.4, 4.6))
    for name, nb, c in series:
        plt.plot(thresholds, nb, lw=2, color=c, label=name)
    plt.plot(thresholds, nb_all, "--", color="gray", lw=1.2, label="Treat all")
    plt.plot(thresholds, nb_none, ":", color="black", lw=1.2, label="Treat none")
    plt.xlabel("Threshold probability $p_t$")
    plt.ylabel("Net benefit")
    plt.title("Figure 8. Decision-curve analysis")
    plt.ylim(min(-0.01, prevalence * -0.2), prevalence * 1.1)
    plt.legend(fontsize=8); plt.tight_layout()
    out_png = f"{figs}/figure8_decision_curve.png"
    plt.savefig(out_png, dpi=200, bbox_inches="tight"); plt.close()

    print(json.dumps({k: (round(v, 4) if isinstance(v, float) else v)
                      for k, v in {"prevalence": prevalence}.items()}, indent=2))
    print(f"[done] decision curve -> {res}/decision_curve.json ; {out_png}")


if __name__ == "__main__":
    main()
