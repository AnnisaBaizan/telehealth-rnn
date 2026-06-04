# CLAIM MAPPING: 004 brief → manuscript (Lampiran B)

This appendix maps every claim in the source brief
`004. Tele-Nursing and Wearable-Based Patient Safety Monitoring for Chronic
Disease Management: An Integrated AI Framework.docx` (title + abstract +
keywords only) to where and how it is addressed in the current manuscript.

The brief stated several headline numbers (420-patient cohort, 89% sensitivity,
−31% false alarms, −24% nurse response time, p < 0.01 adherence, −18%
readmissions). **None of these came from a reproducible data run.** The current
manuscript therefore *retains the topic and framing of 004* but *replaces the
aspirational numbers with real results* from an open dataset, and demotes the
unmeasured outcome claims to prospective hypotheses. The mapping below is the
audit trail for that decision.

Legend — disposition of each claim:
`KEPT` (carried over as-is) · `REPLACED` (substituted with a real, reproducible
result) · `DEMOTED` (moved to future-work hypothesis, not claimed as a result) ·
`RELABELLED` (kept but flagged as synthetic/demonstration only).

## A. Topic, framing & keywords (alignment preserved)

| # | Claim in 004 brief | Disposition | Where in manuscript |
|---|--------------------|-------------|---------------------|
| 1 | Title: "Tele-Nursing and Wearable-Based Patient Safety Monitoring for Chronic Disease Management: An Integrated AI Framework" | KEPT (+ qualifier) | Title — extended with "*Evaluated on Open Physiological Data*" |
| 2 | Remote care extends evidence-based nursing beyond hospital, preserves clinical oversight, smart-hospital ecosystem | KEPT | Abstract (Background); §1 Introduction; §5 Discussion |
| 3 | Combine wearable biosensor streams + PRO + nurse teleconsultation records | KEPT (scope) | Abstract (Methods); §3.1, §3.6 |
| 4 | Recurrent neural network for early-deterioration detection | KEPT | Abstract; §3.3 Model Architecture (GRU; LSTM selectable) |
| 5 | Keywords: Tele-nursing; Wearable health devices; Chronic disease management; Patient safety monitoring; Remote healthcare analytics | KEPT (+2) | Keywords line (adds: Recurrent neural network; Reproducibility) |

## B. Quantitative claims (replaced or demoted)

| # | Claim in 004 brief | Disposition | What the manuscript says instead / where |
|---|--------------------|-------------|------------------------------------------|
| 6 | Cohort of **420 chronic patients**, monitored **9 months** | REPLACED + TARGET | Real evaluation uses PhysioNet/CinC 2019 (**76,263 hourly test windows**, 2,461 positive; §3.1, §4, Table 1). The 420-patient/9-month cohort is retained as the **prospective design target** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 7 | RNN achieved **89% sensitivity** for early deterioration | REPLACED + TARGET | Real GRU run: **sensitivity 0.803** at threshold 0.5 (AUROC 0.866, AUPRC 0.243; §4, Table 1, `results/metrics.json`). The 0.89 figure appears only as a **pre-specified target (≥0.89)** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 8 | **31% reduction in false alarms** vs threshold-based alerts | TARGET | Not claimed as a result; real **false-alarm rate 0.239** reported with a tunable threshold (§4, §5). Restated as **target ≥31%** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 9 | Nurse response time improved by **24%** | DEMOTED → TARGET | Explicitly "not measured in this study." Abstract; §5; §6 Future work; quantified as **a priori target (≥24%)** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 10 | Patient adherence increased significantly (**p < 0.01**) | DEMOTED → TARGET | Prospective hypothesis; synthetic layer never used for clinical outcomes (§3.6; §6). Stated as **target p < 0.01** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 11 | Hospital readmissions decreased by **18%** | DEMOTED → TARGET | Prospective hypothesis. Abstract; §6 Future work; quantified as **target ≥18% reduction** in this appendix (Lampiran B; not carried into the submitted manuscript). |
| 12 | Qualitative feedback: improved patient confidence, stronger nurse–patient engagement | DEMOTED → TARGET | Not a measured result; intended benefit (§5; §6). Listed as **qualitative a priori target** in this appendix (Lampiran B; not carried into the submitted manuscript). |

## C. Data-integrity flags (new in manuscript, implicit in brief)

| # | Brief implied | Disposition | Where in manuscript |
|---|---------------|-------------|---------------------|
| 13 | Tele-nursing / PRO / adherence layer treated as study data | RELABELLED | Declared **SYNTHETIC**, seeded simulator, never reported as clinical result. §3.6; Lampiran A (data_provenance.md) |
| 14 | Single-site proprietary cohort | REPLACED | Open, reproducible secondary data so every number is regenerable from released code + fixed seed (42). §1, §3.5, §4, Data & Code Availability |

## Summary

- **Topic / framing / keywords (rows 1–5):** fully aligned with 004.
- **Headline numbers (rows 6–8):** the *results* sections use real, reproducible
  PhysioNet numbers; the 004 figures are retained as **pre-specified targets**
  in this appendix (Lampiran B; not carried into the submitted manuscript), never as findings.
- **Outcome claims (rows 9–12):** stated as a priori hypotheses with the 004
  effect sizes quantified in this appendix (Lampiran B; not carried into the submitted manuscript); not reported as results.
- **Integration layer (rows 13–14):** explicitly labelled synthetic / secondary.

**Where every 004 number now lives:** Section 7 ("Proposed Prospective
Validation Study") and its Table 3 collect all six headline figures (≈420
patients/9 months, sensitivity ≥0.89, false alarms −31%, nurse response −24%,
adherence p<0.01, readmissions −18%, qualitative engagement) under a bold
"PRE-SPECIFIED TARGETS / HYPOTHESES — NOT RESULTS" banner. This is the teaching
point on *keselarasan* (alignment): unsupported claims are neither deleted nor
passed off as results — they are relabelled as falsifiable, pre-registered
targets, sitting beside the one number that **was** measured (0.803 on
PhysioNet 2019).

Every figure in column "Where in manuscript" for rows 6–8 traces to
`results/metrics.json`, produced by the pipeline on PhysioNet/CinC 2019
(seed 42; W = 8 h window, L = 6 h lead time; see `config.yaml`).
