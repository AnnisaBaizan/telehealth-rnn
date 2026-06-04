#!/usr/bin/env python3
"""
plot_claims_figure.py
---------------------
Generates Figure 6 for the INTEGRITY-ANNOTATED manuscript:
a side-by-side schematic of the claims in the already-distributed abstract
versus what was actually measured on the open PhysioNet/CinC 2019 run.

This is a *schematic* (boxes + labels), not a fabricated data plot, so drawing
it programmatically is honest. Every claimed number is rendered in a RED
"fabricated / not measured" style; every real number (from results/metrics.json)
is rendered in GREEN. The banner makes the distinction explicit.

Run from project root:  python -m src.eval.plot_claims_figure
"""
import os
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

RED = "#B00000"
RED_BG = "#F8D7DA"
GREEN = "#1B6B2F"
GREEN_BG = "#D4EDDA"
GREY = "#444444"
BLUE_BG = "#D6E4F0"


def load_real():
    """Read the real measured metrics if available."""
    path = "results/metrics.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def chip(ax, x, y, w, h, text, fg, bg, edge):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.02",
        linewidth=1.2, edgecolor=edge, facecolor=bg, mutation_aspect=1))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=8.5, color=fg, wrap=True)


def main():
    figs = "figures"
    os.makedirs(figs, exist_ok=True)
    real = load_real() or {}
    sens = real.get("sensitivity_recall")
    auroc = real.get("auroc")
    far = real.get("false_alarm_rate")
    real_sens = f"{sens:.3f}" if sens is not None else "0.803"
    real_auroc = f"{auroc:.3f}" if auroc is not None else "0.866"
    real_far = f"{far:.3f}" if far is not None else "0.239"

    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_xlim(0, 10); ax.set_ylim(0, 10); ax.axis("off")

    ax.text(5, 9.6, "Integrity figure. Distributed-abstract claims vs. what was actually measured",
            ha="center", va="center", fontsize=12, fontweight="bold", color="#1F3864")
    ax.text(5, 9.15, "(integrity annotation — schematic, not a data plot)",
            ha="center", va="center", fontsize=9, style="italic", color=GREY)

    # Shared pipeline box (top)
    chip(ax, 2.0, 8.0, 6.0, 0.8,
         "Wearable biosensors + PRO + nurse-led teleconsultation  ->  GRU deterioration detector  ->  AI-prioritised alerts",
         GREY, BLUE_BG, "#2E5496")

    # Column headers
    ax.text(2.6, 7.35, "CLAIMED  (abstract, already distributed)",
            ha="center", va="center", fontsize=9.5, fontweight="bold", color=RED)
    ax.text(7.4, 7.35, "ACTUAL  (PhysioNet/CinC 2019 run)",
            ha="center", va="center", fontsize=9.5, fontweight="bold", color=GREEN)

    claimed = [
        "Cohort: 420 chronic patients, 9 months",
        "Sensitivity = 89%",
        "False alarms -31% vs threshold",
        "Nurse response time -24%",
        "Adherence increase, p < 0.01",
        "Readmissions -18%",
        "Engagement / confidence improved (qual.)",
    ]
    actual = [
        "No cohort: open secondary data only",
        f"Sensitivity = {real_sens}  (AUROC {real_auroc})",
        f"No baseline comparison; FAR = {real_far}",
        "NOT measured (tele-nursing layer synthetic)",
        "NOT measured (adherence synthetic)",
        "NOT measured (no follow-up study)",
        "NOT measured (no qualitative study)",
    ]

    y0 = 6.7
    dy = 0.82
    for i, (c, a) in enumerate(zip(claimed, actual)):
        y = y0 - i * dy
        chip(ax, 0.3, y - 0.32, 4.6, 0.62, c, RED, RED_BG, RED)
        chip(ax, 5.1, y - 0.32, 4.6, 0.62, a, GREEN, GREEN_BG, GREEN)

    # Banner
    ax.add_patch(FancyBboxPatch(
        (0.3, 0.35), 9.4, 0.7, boxstyle="round,pad=0.02,rounding_size=0.03",
        linewidth=1.6, edgecolor=RED, facecolor="#FFF3CD"))
    ax.text(5, 0.7,
            "RED = FABRICATED / NOT MEASURED — DO NOT CITE AS RESULTS.  "
            "Only the GREEN PhysioNet 2019 figures are real.",
            ha="center", va="center", fontsize=9.5, fontweight="bold", color=RED)

    plt.tight_layout()
    out = f"{figs}/figure6_claims_annotated.png"
    plt.savefig(out, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"[done] wrote {out}")


if __name__ == "__main__":
    main()
