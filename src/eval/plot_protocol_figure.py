#!/usr/bin/env python3
"""
plot_protocol_figure.py
-----------------------
Figure 6 for the HONEST manuscript: a schematic of the PROPOSED prospective
validation study (Section 7). It is a study-design diagram, not data, so
drawing it is honest — but every outcome value on it is a PRE-SPECIFIED TARGET
/ a priori hypothesis, never a result. The banner says so.

Run from project root:  python -m src.eval.plot_protocol_figure
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

BLUE = "#2E5496"; BLUE_BG = "#D6E4F0"
TEAL = "#1B7A6B"; TEAL_BG = "#D4EDE9"
ORANGE = "#B9770E"; TARGET_BG = "#FDEBD0"
GREY = "#444444"


def box(ax, x, y, w, h, text, fg=GREY, bg=BLUE_BG, edge=BLUE, fs=9, dashed=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.02",
                 linewidth=1.3, edgecolor=edge, facecolor=bg, linestyle="--" if dashed else "-"))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, color=fg, wrap=True)


def arrow(ax, x1, y1, x2, y2, color=GREY):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>",
                 mutation_scale=13, lw=1.4, color=color))


def main():
    figs = "figures"
    os.makedirs(figs, exist_ok=True)
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_xlim(0, 10); ax.set_ylim(0, 10); ax.axis("off")

    ax.text(5, 9.6, "Figure 6. Proposed prospective validation study (design)",
            ha="center", fontsize=12.5, fontweight="bold", color=BLUE)
    ax.text(5, 9.15, "every outcome value below is a PRE-SPECIFIED TARGET, not a result",
            ha="center", fontsize=9, style="italic", color=ORANGE)

    box(ax, 2.0, 8.05, 6.0, 0.7, "Target cohort  ~420 chronic CVD / diabetic patients  ·  9-month monitoring  (TARGET)",
        GREY, TEAL_BG, TEAL, fs=9)
    arrow(ax, 5, 8.05, 5, 7.65)
    box(ax, 1.2, 6.95, 7.6, 0.7,
        "Wearable biosensors + patient-reported outcomes + nurse-led teleconsultation  ->  GRU detector  ->  AI-prioritised alerts",
        GREY, BLUE_BG, BLUE, fs=8.5)

    # two arms
    arrow(ax, 4.0, 6.95, 3.0, 6.5); arrow(ax, 6.0, 6.95, 7.0, 6.5)
    box(ax, 1.3, 5.8, 3.4, 0.7, "Arm A: AI-assisted tele-nursing", GREY, BLUE_BG, BLUE, fs=9)
    box(ax, 5.3, 5.8, 3.4, 0.7, "Arm B: usual care (comparison)", GREY, "#EEEEEE", GREY, fs=9)

    ax.text(5, 5.25, "Pre-specified target outcomes (a priori hypotheses)",
            ha="center", fontsize=9.5, fontweight="bold", color=ORANGE)

    targets = [
        "Detector sensitivity  >= 89%  (TARGET)",
        "False alarms  -31% vs threshold EWS  (TARGET)",
        "Nurse response time  -24%  (TARGET)",
        "Medication adherence  increase, p < 0.01  (TARGET)",
        "Avoidable readmissions  -18%  (TARGET)",
        "Nurse-patient engagement  improved (qualitative TARGET)",
    ]
    y = 4.7
    for i, t in enumerate(targets):
        yy = y - i * 0.62
        box(ax, 1.2, yy - 0.24, 7.6, 0.48, t, ORANGE, TARGET_BG, ORANGE, fs=9, dashed=True)

    ax.add_patch(FancyBboxPatch((0.6, 0.35), 8.8, 0.62, boxstyle="round,pad=0.02,rounding_size=0.03",
                 linewidth=1.6, edgecolor="#B00000", facecolor="#FFF3CD"))
    ax.text(5, 0.66, "PRE-SPECIFIED TARGETS / HYPOTHESES — NOT RESULTS OF THIS STUDY",
            ha="center", fontsize=10, fontweight="bold", color="#B00000")

    plt.tight_layout()
    out = f"{figs}/figure6_protocol.png"
    plt.savefig(out, dpi=200, bbox_inches="tight"); plt.close()
    print(f"[done] wrote {out}")


if __name__ == "__main__":
    main()
