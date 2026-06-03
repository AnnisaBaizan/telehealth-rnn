#!/usr/bin/env python3
"""
plot_figures.py
---------------
Generates the REAL data figures for the manuscript from the saved curves:
  - Figure 3: ROC curve
  - Figure 4: Precision-Recall curve
  - Figure 5: Confusion matrix

IMPORTANT: These are quantitative result figures. They MUST be produced from
the actual model run (this script) — NOT from an image generator. Image
generators are only appropriate for the conceptual diagrams (Figures 1-2);
see manuscript/figure_prompts.md.

Run from project root:  python -m src.eval.plot_figures
"""
import os
import yaml
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def main():
    cfg = load_cfg()
    res = cfg["eval"]["results_dir"]
    figs = cfg["eval"]["figures_dir"]
    os.makedirs(figs, exist_ok=True)

    data = np.load(f"{res}/curves.npz")
    fpr, tpr, prec, rec = data["fpr"], data["tpr"], data["prec"], data["rec"]
    y, probs = data["y"], data["probs"]

    # Figure 3 - ROC
    plt.figure(figsize=(5, 5))
    plt.plot(fpr, tpr, lw=2, label="RNN")
    plt.plot([0, 1], [0, 1], "--", color="gray")
    plt.xlabel("False Positive Rate"); plt.ylabel("True Positive Rate")
    plt.title("Figure 3. ROC - early deterioration detection")
    plt.legend(); plt.tight_layout()
    plt.savefig(f"{figs}/figure3_roc.png", dpi=200); plt.close()

    # Figure 4 - PR
    plt.figure(figsize=(5, 5))
    plt.plot(rec, prec, lw=2)
    plt.xlabel("Recall"); plt.ylabel("Precision")
    plt.title("Figure 4. Precision-Recall curve")
    plt.tight_layout()
    plt.savefig(f"{figs}/figure4_pr.png", dpi=200); plt.close()

    # Figure 5 - Confusion matrix at threshold
    thr = cfg["eval"]["alarm_threshold"]
    preds = (probs >= thr).astype(int)
    from sklearn.metrics import confusion_matrix
    cm = confusion_matrix(y, preds)
    plt.figure(figsize=(4.5, 4))
    plt.imshow(cm, cmap="Blues")
    for i in range(2):
        for j in range(2):
            plt.text(j, i, cm[i, j], ha="center", va="center")
    plt.xticks([0, 1], ["No det.", "Deterioration"])
    plt.yticks([0, 1], ["No det.", "Deterioration"])
    plt.xlabel("Predicted"); plt.ylabel("Actual")
    plt.title("Figure 5. Confusion matrix")
    plt.colorbar(); plt.tight_layout()
    plt.savefig(f"{figs}/figure5_confusion.png", dpi=200); plt.close()

    print(f"[done] wrote real result figures to {figs}/")


if __name__ == "__main__":
    main()
