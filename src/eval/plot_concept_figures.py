#!/usr/bin/env python3
"""
plot_concept_figures.py
-----------------------
Generates the CONCEPTUAL diagrams (schematics, not data):
  - Figure 1: system architecture
  - Figure 2: data pipeline & windowing

These illustrate architecture, not measured data, so drawing them
programmatically is honest. Run from project root:
    python -m src.eval.plot_concept_figures
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

BLUE = "#2E5496"
BLUE_BG = "#D6E4F0"
TEAL = "#1B7A6B"
TEAL_BG = "#D4EDE9"
GREY = "#444444"
DASH_BG = "#FDEBD0"
ORANGE = "#B9770E"


def box(ax, x, y, w, h, text, fg=GREY, bg=BLUE_BG, edge=BLUE, fs=8.5, dashed=False):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.02",
        linewidth=1.3, edgecolor=edge, facecolor=bg,
        linestyle="--" if dashed else "-"))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fs, color=fg, wrap=True)


def arrow(ax, x1, y1, x2, y2, color=GREY):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
                 arrowstyle="-|>", mutation_scale=12, lw=1.3, color=color))


def fig1(figs):
    fig, ax = plt.subplots(figsize=(10, 4.2))
    ax.set_xlim(0, 10); ax.set_ylim(0, 4.2); ax.axis("off")
    ax.text(5, 4.0, "Figure 1. System architecture (conceptual)",
            ha="center", fontsize=12, fontweight="bold", color=BLUE)

    box(ax, 0.2, 1.6, 1.7, 1.2, "Patient\n+ wearables\n(HR, SpO2, activity)", GREY, TEAL_BG, TEAL)
    box(ax, 2.4, 1.7, 1.7, 1.0, "Edge / cloud\ningestion", GREY, BLUE_BG, BLUE)
    box(ax, 4.6, 1.6, 1.8, 1.2, "Recurrent neural\nnetwork (GRU)\ndeterioration detector", GREY, BLUE_BG, BLUE)
    box(ax, 6.9, 1.7, 1.4, 1.0, "AI alert\nprioritisation", GREY, BLUE_BG, BLUE)
    box(ax, 8.5, 1.6, 1.3, 1.2, "Nurse\ntele-dashboard\n(prioritised alerts)", GREY, TEAL_BG, TEAL)

    arrow(ax, 1.9, 2.2, 2.4, 2.2)
    arrow(ax, 4.1, 2.2, 4.6, 2.2)
    arrow(ax, 6.4, 2.2, 6.9, 2.2)
    arrow(ax, 8.3, 2.2, 8.5, 2.2)
    # feedback loop
    arrow(ax, 9.1, 1.6, 1.05, 1.0, color=ORANGE)
    ax.text(5, 0.75, "Teleconsult / patient-reported outcomes (feedback)",
            ha="center", fontsize=8, color=ORANGE, style="italic")
    plt.tight_layout()
    out = f"{figs}/figure1_architecture.png"
    plt.savefig(out, dpi=200, bbox_inches="tight"); plt.close()
    print(f"[done] wrote {out}")


def fig2(figs):
    fig, ax = plt.subplots(figsize=(10, 4.6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 4.6); ax.axis("off")
    ax.text(5, 4.4, "Figure 2. Data pipeline & windowing (conceptual)",
            ha="center", fontsize=12, fontweight="bold", color=BLUE)

    # time axis with hourly ticks
    ax.add_patch(FancyArrowPatch((0.5, 3.3), (9.6, 3.3),
                 arrowstyle="-|>", mutation_scale=12, lw=1.2, color=GREY))
    for i in range(12):
        x = 0.8 + i * 0.72
        ax.plot([x, x], [3.22, 3.38], color=GREY, lw=1)
    ax.text(9.6, 3.05, "hourly vital-sign samples (time ->)", ha="right", fontsize=8, color=GREY)

    # sliding window (8h) + lead-time (6h)
    ax.add_patch(FancyBboxPatch((0.8, 3.5), 2.9, 0.55, boxstyle="round,pad=0.01",
                 linewidth=1.2, edgecolor=BLUE, facecolor=BLUE_BG))
    ax.text(2.25, 3.77, "window W = 8 h -> GRU", ha="center", fontsize=8, color=BLUE)
    ax.add_patch(FancyBboxPatch((3.7, 3.5), 2.2, 0.55, boxstyle="round,pad=0.01",
                 linewidth=1.2, edgecolor=ORANGE, facecolor=DASH_BG, linestyle="--"))
    ax.text(4.8, 3.77, "lead time L = 6 h", ha="center", fontsize=8, color=ORANGE)
    ax.text(4.8, 3.32, "predict deterioration before onset", ha="center", fontsize=7.5, color=ORANGE, style="italic")

    # three data lanes
    box(ax, 0.5, 2.1, 9.0, 0.6, "REAL: PhysioNet/CinC 2019 vitals (primary modelling data)", GREY, TEAL_BG, TEAL, fs=9)
    box(ax, 0.5, 1.35, 9.0, 0.6, "REAL: wearable PPG front-end — PPG-DaLiA (optional)", GREY, TEAL_BG, TEAL, fs=9)
    box(ax, 0.5, 0.55, 9.0, 0.6, "SYNTHETIC: tele-nursing / PRO / adherence layer (simulated — never a clinical result)",
        ORANGE, DASH_BG, ORANGE, fs=9, dashed=True)

    plt.tight_layout()
    out = f"{figs}/figure2_pipeline.png"
    plt.savefig(out, dpi=200, bbox_inches="tight"); plt.close()
    print(f"[done] wrote {out}")


def main():
    figs = "figures"
    os.makedirs(figs, exist_ok=True)
    fig1(figs)
    fig2(figs)


if __name__ == "__main__":
    main()
