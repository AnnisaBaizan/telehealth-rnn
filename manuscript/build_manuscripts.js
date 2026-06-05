const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageNumber, Footer, ImageRun
} = require("docx");

const FIGDIR = __dirname + "/../figures";
function figPara(file, w, h) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(`${FIGDIR}/${file}`), transformation: { width: w, height: h } })],
  });
}
function capPara(t) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({ text: t, italics: true, size: 18, color: "555555" })] });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, w, head) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { fill: "D6E4F0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!head, size: 20 })] })],
  });
}
function row(cells, w, head) { return new TableRow({ children: cells.map(c => cell(c, w / cells.length, head)) }); }

function H1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function H2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function P(t, opts = {}) { return new Paragraph({ spacing: { after: 140, line: 300 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: t, ...opts })] }); }
function PH(t) { return new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: t, italics: true, color: "B00000", bold: true })] }); }

function buildDoc(C) {
  const metricsTable = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
    rows: [
      row([C.t.metric, C.t.value], 9360, true),
      row(["AUROC", "0.866"], 9360),
      row(["AUPRC", "0.243"], 9360),
      row([C.t.sens, "0.803"], 9360),
      row([C.t.spec, "0.761"], 9360),
      row(["Precision", "0.101"], 9360),
      row([C.t.far, "0.239"], 9360),
      row(["F1", "0.179"], 9360),
    ],
  });

  const comparisonTable = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3360, 2000, 2000, 2000],
    rows: [
      row([C.cmp.model, "AUROC", "AUPRC", C.cmp.sens], 9360, true),
      row(["GRU (RNN)", "0.866 (0.859–0.872)", "0.243 (0.227–0.260)", "0.803 (0.787–0.819)"], 9360),
      row([C.cmp.logreg, "0.679", "0.070", "0.606"], 9360),
      row([C.cmp.ews, "0.570", "0.045", "—"], 9360),
    ],
  });

  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: C.title, bold: true, size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
      children: [new TextRun({ text: "[[Author Name(s)]] · [[Affiliation(s)]] · [[Corresponding email]] · [[ORCID]]", italics: true, size: 20, color: "555555" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: C.target, size: 18, color: "777777" })] }),

    H1(C.s.abstract),
    P(C.abstract),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: C.s.keywords + ": " , bold: true }), new TextRun(C.keywords)] }),

    H1(C.s.intro),
    ...C.intro.map(t => P(t)),

    H1(C.s.related),
    ...C.related.map(t => P(t)),

    H1(C.s.methods),
    H2(C.s.m_data), ...C.m_data.map(t => P(t)),
    H2(C.s.m_pre), ...C.m_pre.map(t => P(t)),
    H2(C.s.m_model), ...C.m_model.map(t => P(t)),
    figPara("figure1_architecture.png", 600, 252), capPara(C.figcap.f1),
    figPara("figure2_pipeline.png", 600, 276), capPara(C.figcap.f2),
    H2(C.s.m_train), ...C.m_train.map(t => P(t)),
    H2(C.s.m_eval), ...C.m_eval.map(t => P(t)),
    H2(C.s.m_syn), PH(C.m_syn_warn), ...C.m_syn.map(t => P(t)),
    H2(C.s.m_ethics), ...C.m_ethics.map(t => P(t)),

    H1(C.s.results),
    P(C.results_warn),
    ...C.results.map(t => P(t)),
    new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: C.tbl_caption, bold: true, size: 20 })] }),
    metricsTable,
    figPara("figure3_roc.png", 300, 300), capPara(C.figcap.f3),
    figPara("figure4_pr.png", 300, 300), capPara(C.figcap.f4),
    figPara("figure5_confusion.png", 330, 293), capPara(C.figcap.f5),
    ...C.results_ext.map(t => P(t)),
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: C.tbl2_caption, bold: true, size: 20 })] }),
    comparisonTable,
    figPara("figure7_calibration.png", 600, 264), capPara(C.figcap.f7),
    figPara("figure8_decision_curve.png", 480, 345), capPara(C.figcap.f8),
    new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: C.fig_note, italics: true, size: 20 })] }),

    H1(C.s.discussion),
    ...C.discussion.map(t => P(t)),

    H1(C.s.nursing),
    ...C.nursing.map(t => P(t)),

    H1(C.s.limits),
    ...C.limits.map(t => P(t)),

    H1(C.s.conclusion),
    ...C.conclusion.map(t => P(t)),

    H1(C.s.avail),
    P(C.avail),

    H1(C.s.refs),
    ...C.refs.map((r, i) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `[${i + 1}] ${r}`, size: 20 })] })),
  ];

  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "1F3864" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 23, bold: true, font: "Arial", color: "2E5496" }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["", PageNumber.CURRENT], size: 18 })] })] }) },
      children,
    }],
  });
}

// shared verified references — ordered by first in-text appearance (AMA / CIN)
const REFS = [
  "Lewinski AA, Walsh C, Rushton S, et al. Telehealth for the Longitudinal Management of Chronic Conditions: Systematic Review. J Med Internet Res. 2022;24(8):e37100. https://doi.org/10.2196/37100",
  "Lee AYL, Wong AKC, Hung TTM, Yan J, Yang S. Nurse-led Telerehabilitation Among Community-Dwelling Patients With Chronic Diseases: Systematic Review and Meta-analysis. J Med Internet Res. 2022;24(11):e40364. https://doi.org/10.2196/40364",
  "Xiao Z, Han X. Evaluation of the Effectiveness of Telehealth Chronic Disease Management System: Systematic Review and Meta-analysis. J Med Internet Res. 2023;25:e44256. https://doi.org/10.2196/44256",
  "Burke JR, Downey C, Almoudaris AM. Failure to Rescue Deteriorating Patients: A Systematic Review of Root Causes and Improvement Strategies. J Patient Saf. 2022;18(1):e140-e155. https://doi.org/10.1097/PTS.0000000000000720",
  "Henneman EA, Gawlinski A, Giuliano KK. Surveillance: A Strategy for Improving Patient Safety in Acute and Critical Care Units. Crit Care Nurse. 2012;32(2):e9-e18. https://doi.org/10.4037/ccn2012166",
  "Aiken LH, Clarke SP, Sloane DM, Sochalski J, Silber JH. Hospital nurse staffing and patient mortality, nurse burnout, and job dissatisfaction. JAMA. 2002;288(16):1987-1993. https://doi.org/10.1001/jama.288.16.1987",
  "Reiss A, Indlekofer I, Schmidt P, Van Laerhoven K. Deep PPG: Large-Scale Heart Rate Estimation with CNNs. Sensors. 2019;19(14):3079. https://doi.org/10.3390/s19143079",
  "Steitz BD, McCoy AB, Reese TJ, et al. ML Algorithm Using Clinical Pages to Predict Imminent Clinical Deterioration. J Gen Intern Med. 2024;39:27-34. https://doi.org/10.1007/s11606-023-08349-3",
  "Gonem S, Taylor A, Figueredo G, et al. Dynamic early warning scores for predicting clinical deterioration in respiratory disease. Respir Res. 2022;23:215. https://doi.org/10.1186/s12931-022-02130-6",
  "Kamei T, Yamamoto Y, Kanamori T, Nakayama Y, Porter SE. Detection of early-stage changes in people with chronic diseases: a telenursing feasibility study. Nurs Health Sci. 2018;20(3):313-322. https://doi.org/10.1111/nhs.12563",
  "Brewster L, Mountain G, Wessels B, Kelly C, Hawley M. Factors affecting front line staff acceptance of telehealth technologies. J Adv Nurs. 2014;70(1):21-33. https://doi.org/10.1111/jan.12196",
  "Cheng CY, Hsu TH, Hung YL, et al. Early prediction of in-hospital deterioration after ED admission using ML. BMC Emerg Med. 2026;26:6. https://doi.org/10.1186/s12873-025-01464-w",
  "Reyna MA, Josef CS, Jeter R, et al. Early Prediction of Sepsis From Clinical Data: The PhysioNet/Computing in Cardiology Challenge 2019. Crit Care Med. 2020;48(2):210-217. https://doi.org/10.1097/CCM.0000000000004145",
  "Goldberger AL, Amaral LAN, Glass L, et al. PhysioBank, PhysioToolkit, and PhysioNet. Circulation. 2000;101(23):e215-e220. https://doi.org/10.1161/01.CIR.101.23.e215",
  "Johnson AEW, Bulgarelli L, Shen L, et al. MIMIC-IV, a freely accessible electronic health record dataset. Sci Data. 2023;10:1. https://doi.org/10.1038/s41597-022-01899-x",
  "DeLong ER, DeLong DM, Clarke-Pearson DL. Comparing the areas under two or more correlated receiver operating characteristic curves: a nonparametric approach. Biometrics. 1988;44(3):837-845. https://doi.org/10.2307/2531595",
  "Vickers AJ, Elkin EB. Decision curve analysis: a novel method for evaluating prediction models. Med Decis Making. 2006;26(6):565-574. https://doi.org/10.1177/0272989X06295361",
  "Collins GS, Moons KGM, Dhiman P, et al. TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods. BMJ. 2024;385:e078378. https://doi.org/10.1136/bmj-2023-078378",
  "Lewandowska K, Weisbrot M, Cieloszyk A, Medrzycka-Dabrowska W, Krupa S, Ozga D. Impact of Alarm Fatigue on the Work of Nurses in an Intensive Care Environment—A Systematic Review. Int J Environ Res Public Health. 2020;17(22):8409. https://doi.org/10.3390/ijerph17228409",
];

// ---------------- ENGLISH ----------------
const EN = {
  title: "Tele-Nursing and Wearable-Based Patient Safety Monitoring for Chronic Disease Management: An Integrated AI Framework Evaluated on Open Physiological Data",
  target: "Prepared for submission to CIN: Computers, Informatics, Nursing (Lippincott/Ovid; SCImago Nursing Q2) — alternative: JMIR Nursing / Nursing & Health Sciences. Adapt formatting to journal guidelines.",
  t: { metric: "Metric", value: "Value", sens: "Sensitivity (recall)", spec: "Specificity", far: "False-alarm rate" },
  s: { abstract: "Abstract", keywords: "Keywords", intro: "1. Introduction", related: "2. Related Work",
    methods: "3. Methods", m_data: "3.1 Datasets", m_pre: "3.2 Preprocessing and Windowing", m_model: "3.3 Model Architecture",
    m_train: "3.4 Training", m_eval: "3.5 Evaluation", m_syn: "3.6 Synthetic Tele-Nursing Integration Layer", m_ethics: "3.7 Ethics and Data Governance",
    results: "4. Results", discussion: "5. Discussion",
    nursing: "6. Implications for Nursing Practice", limits: "7. Limitations", conclusion: "8. Conclusion",
    avail: "Data and Code Availability", refs: "References" },
  tg: { endpoint: "Endpoint", target: "Pre-specified target (a priori hypothesis)", basis: "Status / basis" },
  target_tbl_caption: "Table 3. Pre-specified target outcomes / a priori hypotheses for the proposed prospective validation study (NOT results of this study).",
  target_outcomes: [
    ["Study cohort and duration", "≈420 chronic cardiovascular/diabetic patients monitored over 9 months", "Design target (004 framework)"],
    ["Early-deterioration sensitivity", "≥ 0.89", "Target; cf. 0.803 achieved here on PhysioNet 2019 (feasibility)"],
    ["False-alarm reduction vs threshold EWS", "≥ 31%", "A priori hypothesis"],
    ["Nurse response time", "≥ 24% improvement", "A priori hypothesis"],
    ["Medication adherence", "Significant increase (target p < 0.01)", "A priori hypothesis"],
    ["Avoidable readmissions", "≥ 18% reduction", "A priori hypothesis"],
    ["Nurse-patient engagement / patient confidence", "Qualitative improvement", "A priori hypothesis"],
  ],
  protocol_warn: "The figures in Table 3 are PRE-SPECIFIED TARGETS and a priori HYPOTHESES for a future prospective study. They are NOT results of the present work, were not measured here, and must not be cited as findings.",
  protocol_pre: [
    "To translate the open-data feasibility evidence above into clinical value, we outline a prospective validation study that links the deterioration detector to a real nurse-led tele-monitoring workflow. The design follows the integrated framework of the original concept: a cohort of approximately 420 elderly patients with chronic cardiovascular and diabetic conditions monitored over nine months through wearable biosensors (heart rate, oxygen saturation, activity), patient-reported outcomes and nurse-led teleconsultation, with AI-prioritized alerts surfaced to the tele-nursing team.",
    "The study would be pre-registered with the endpoints and target effect sizes summarised in Table 3. These targets are stated a priori so that the hypotheses are falsifiable; the present manuscript reports only the detector feasibility (Section 4) and claims none of these downstream effects.",
  ],
  protocol_post: [
    "Power analysis, informed consent, randomised or stepped-wedge allocation, and replacement of the synthetic integration layer with real tele-nursing, patient-reported-outcome and adherence data are prerequisites of this protocol and are deliberately out of scope for the present open-data study.",
  ],
  abstract: "Background: Patient safety monitoring for chronic cardiovascular and metabolic disease is increasingly delivered through tele-nursing and wearable biosensors, which together extend evidence-based nursing beyond physical hospital boundaries while preserving clinical oversight. Continuous remote monitoring may enable earlier detection of clinical deterioration and support nurse-led tele-care within emerging smart-hospital ecosystems. However, many proposed frameworks are not evaluated on openly available data, limiting reproducibility. Objective: We present and openly evaluate an integrated tele-nursing and wearable-based patient safety monitoring framework in which a recurrent neural network detects early physiological deterioration from multivariate vital-sign time series. As a reproducible methodological proof-of-concept for that framework, we instantiate and evaluate the detector on an open intensive-care deterioration testbed before any chronic-care or home deployment. Methods: Using the openly available PhysioNet/Computing in Cardiology 2019 dataset, we framed early deterioration detection as predicting validated sepsis onset — used here as a physiologic deterioration proxy — within a fixed lead time from a sliding window of hourly vital signs (heart rate, oxygen saturation, temperature, blood pressure, respiration). A gated recurrent unit (GRU) classifier was trained with class-imbalance weighting and evaluated on a held-out test split, benchmarked against reproducible baselines, and assessed for calibration and clinical utility. A clearly labeled synthetic layer was used solely to demonstrate the tele-nursing integration workflow. Results: On a held-out test set of 76,263 hourly windows (2,461 positive; 3.2% prevalence), the GRU achieved an AUROC of 0.866 and an AUPRC of 0.243. At the default alarm threshold (0.5) it reached a sensitivity of 0.803 and a specificity of 0.761, with a precision of 0.101, an F1 of 0.179 and a false-alarm rate of 0.239. The GRU significantly outperformed a logistic-regression baseline and a threshold-style early-warning score (DeLong p < 0.001), was well calibrated after isotonic recalibration (ECE 0.0017), and yielded positive net benefit in decision-curve analysis across clinically relevant alarm thresholds. Conclusions: The framework provides a reproducible, openly evaluable basis for AI-assisted, nurse-led patient safety monitoring that can underpin holistic chronic care within a smart-hospital ecosystem; all code and data sources are public. Downstream care outcomes — nurse response time, medication adherence, readmissions and nurse-patient engagement — are framed as prospective hypotheses for future validation rather than results of this study.",
  keywords: "Tele-nursing; Wearable health devices; Chronic disease management; Patient safety monitoring; Remote healthcare analytics; Recurrent neural network; Clinical deterioration; Failure to rescue; Calibration; Decision curve analysis; Reproducibility",
  intro: [
    "Chronic cardiovascular and metabolic diseases impose a sustained burden on health systems and are a leading driver of avoidable hospital readmissions. Remote care models, in which nurses coordinate monitoring and intervention outside the hospital, have been associated with improvements in quality of life and self-management across multiple systematic reviews.[1-3] Within the broader vision of patient safety monitoring and smart-hospital ecosystems, tele-nursing combined with wearable biosensors aims to extend continuous, evidence-based nursing oversight to the home and to strengthen nurse-patient engagement throughout the chronic-care journey.",
    "In patient-safety terms, the objective is to prevent failure to rescue — the failure to recognize, communicate, or act on clinical deterioration — a recognized nurse-sensitive outcome whose root causes are well documented.[4] Nurse-led surveillance, defined as the purposeful and ongoing acquisition, interpretation and synthesis of patient data for clinical decision-making, is the decisive determinant of timely rescue,[5] and landmark evidence has linked nursing capacity directly to failure-to-rescue rates.[6] Tele-nursing with wearable biosensors can be understood as extending this surveillance capacity beyond the ward; the role of the AI detector in this study is to support, not replace, that nursing surveillance by prioritizing where scarce attention is directed.",
    "Two technological currents motivate this work. First, wearable biosensors now provide near-continuous streams of heart rate, oxygen saturation and activity;[7] in the open testbed used here the model inputs are seven routinely measured vital signs, without a wearable activity channel. Second, sequence models such as recurrent neural networks can learn patient-specific temporal patterns that fixed early-warning scores cannot.[8,9] Yet a recurring methodological weakness is that proposed frameworks are frequently described without evaluation on reproducible, openly available data.",
    "This study addresses that gap directly. Rather than report a single-site proprietary cohort, we operationalize the deterioration-detection task on open physiological datasets so that every reported number can be regenerated by any reader from the accompanying code. We also make explicit which components are real secondary data and which are synthetic.",
  ],
  related: [
    "Telehealth for chronic conditions has been evaluated in several systematic reviews,[1-3,10] with nurse-led models showing benefits in adherence and patient-reported outcomes while highlighting heterogeneity in endpoints. Acceptance research stresses that workflow fit and alert quality strongly influence front-line uptake.[11]",
    "On the modeling side, machine-learning early-warning systems have repeatedly outperformed threshold-based scores for imminent deterioration,[8,9,12] and recurrent architectures are well suited to irregular physiological sequences. Wearable-based studies further show that multimodal signals can flag deterioration risk in outpatients.[7,10] Our contribution is to combine an RNN deterioration detector with an explicit, reproducible, open-data evaluation and a transparently-labeled tele-nursing integration layer.",
  ],
  m_data: [
    "The primary modeling data is the openly available PhysioNet/Computing in Cardiology 2019 dataset,[13,14] an intensive-care cohort that provides hourly multivariate vital-sign records with a validated sepsis-onset label, which we use as a physiologic deterioration proxy. We use the seven wearable-obtainable vital signs (heart rate, oxygen saturation, temperature, systolic/diastolic/mean arterial blood pressure and respiration rate) as model inputs.",
    "Two further open datasets are supported optionally for future extension but were not used in the present analysis: MIMIC-IV (credentialed)[15] for chronic-disease cohorts identified by diagnosis codes, and PPG-DaLiA[7] for a wrist-wearable heart-rate front-end. Full provenance, licenses and dataset DOIs are listed in the Supplementary Material.",
  ],
  m_pre: [
    "Each patient record is forward/backward filled and median-imputed within patient. We then slide a window of W hours over the sequence; a window is labeled positive if a deterioration onset occurs within the subsequent L hours, framing the task as prediction before clinical recognition. Default values (W = 8 h, L = 6 h) are pre-specified and reported for reproducibility.",
    "Data are split into training, validation and test partitions with stratification on the label, and per-feature standardization statistics are estimated on the training partition only to avoid leakage.",
  ],
  m_model: [
    "The detector is a gated recurrent unit (GRU) network that maps a window of standardized vital signs to a single deterioration-risk logit through the final hidden state, followed by a small fully-connected head with layer normalization and dropout. At each timestep the GRU updates a reset gate and an update gate and a candidate hidden state, and the risk score is obtained as the sigmoid of a linear projection of the final hidden state; the full update equations are provided in the Supplementary Material. A long short-term memory variant is selectable.",
  ],
  m_train: [
    "Models are trained with the Adam optimiser and weighted binary cross-entropy, where the positive-class weight is set automatically from the training prevalence to counter class imbalance. Early stopping monitors validation loss. All hyperparameters and the random seed are recorded in the configuration file.",
  ],
  m_eval: [
    "On the held-out test partition we report discrimination (AUROC, AUPRC) and operating-point metrics at a configurable alarm threshold: sensitivity (recall), specificity, precision, F1 and false-alarm rate, together with the confusion matrix. All reported values derive from this single held-out evaluation.",
    "Comparators. To place the recurrent model in context we evaluated two reproducible baselines on the identical splits: a logistic-regression classifier trained on per-vital window summaries (mean, standard deviation, minimum, maximum, last value and slope of each of the seven vitals over the eight-hour window), and a training-free deviation early-warning score defined as the summed absolute standardized deviation of the final hour's vitals, a transparent proxy for threshold/EWS-style alerting.",
    "Calibration and clinical utility. We assessed calibration with the Brier score, the expected calibration error (ECE, ten bins) and reliability curves, and — because class-imbalance weighting is known to distort probabilities — additionally fitted an isotonic recalibration map on the validation split and applied it unchanged to the test split. Clinical usefulness was summarized with decision-curve analysis,[17] reporting net benefit across alarm-threshold probabilities from 0.01 to 0.50 against the default treat-all and treat-none strategies.",
    "Statistical analysis. Ninety-five-percent confidence intervals for AUROC, AUPRC and sensitivity were obtained by stratified bootstrap resampling (1,000 replicates, seed 42). The AUROC difference between the recurrent model and the logistic-regression baseline was tested with the DeLong method.[16] We follow TRIPOD-AI reporting guidance for prediction-model studies.[18]",
  ],
  cmp: { model: "Model", sens: "Sensitivity (95% CI)", logreg: "Logistic regression", ews: "Deviation EWS (training-free)" },
  figcap: {
    f1: "Figure 1. System architecture (conceptual).",
    f2: "Figure 2. Data pipeline and windowing (conceptual); the synthetic tele-nursing lane is shown separately.",
    f3: "Figure 3. ROC curve on the held-out PhysioNet/CinC 2019 test split (AUROC 0.866).",
    f4: "Figure 4. Precision–recall curve (AUPRC 0.243).",
    f5: "Figure 5. Confusion matrix at the 0.5 alarm threshold.",
    f7: "Figure 6. Calibration: reliability curve (raw vs isotonic-recalibrated) and risk-score distribution.",
    f8: "Figure 7. Decision-curve analysis: net benefit versus alarm-threshold probability.",
  },
  tbl2_caption: "Table 2. Discrimination of the recurrent model versus reproducible baselines on the identical PhysioNet/CinC 2019 test split (95% CIs from stratified bootstrap).",
  results_ext: [
    "Against reproducible baselines on the identical test split (Table 2), the recurrent detector clearly dominated: its AUROC of 0.866 (95% CI 0.859–0.872) exceeded the logistic-regression baseline's 0.679 and the training-free deviation early-warning score's 0.570, and the AUROC advantage over logistic regression was large and unambiguous by the DeLong test (ΔAUROC = 0.187; z = 32.2; p < 0.001). The gap was even starker on the imbalance-sensitive AUPRC (0.243 versus 0.070 and 0.045), confirming that the temporal model, not the feature set alone, concentrates risk among true positives.",
    "Calibration. At the raw operating point the risk scores were over-confident, as expected under class-imbalance weighting (Brier 0.150; ECE 0.237). A single isotonic recalibration map fitted on the validation split and applied unchanged to the test split removed almost all of this miscalibration (Brier 0.027; ECE 0.0017; Figure 6), yielding probabilities suitable for threshold-based triage.",
    "Clinical utility. Decision-curve analysis showed that the recalibrated detector delivered positive net benefit across the clinically relevant alarm-threshold range of roughly 5–20% (for example, net benefit 0.014 at a 5% threshold and 0.009 at 10%), exceeding both the treat-all and treat-none strategies and the logistic-regression baseline, which were at or below zero over the same range (Figure 7).",
  ],
  m_syn: [
    "No open dataset links tele-nursing consultation records, patient-reported outcomes, nurse response times and adherence to the same patients whose vital signs we model. To demonstrate the integration workflow only, we generate this layer with a transparent, seeded stochastic simulator. Every record is stamped as synthetic, and these data are never used to compute clinical performance and never reported as outcomes.",
  ],
  m_syn_warn: "Note: the tele-nursing/PRO/adherence layer is SYNTHETIC (simulated). It is used solely to illustrate data flow and is never reported as a clinical result.",
  m_ethics: [
    "This work is a secondary analysis of de-identified, publicly released datasets used under their respective data-use agreements; such use is typically classified as non-human-subjects research. The synthetic layer involves no human subjects and requires no ethical approval. Investigators should confirm local institutional requirements before submission.",
  ],
  results_warn: "All values in this section derive from the single held-out evaluation on the PhysioNet/CinC 2019 test partition (random seed 42; 8-hour input window, 6-hour lead time) and are fully reproducible from the released code.",
  results: [
    "The held-out test partition comprised 76,263 hourly windows, of which 2,461 (3.2%) were labeled positive for impending deterioration, reflecting the marked class imbalance inherent to early-warning tasks. On this set the GRU detector achieved an AUROC of 0.866, indicating good overall discrimination between windows that precede deterioration and those that do not. The area under the precision-recall curve was 0.243, well above the positive prevalence of 0.032 that a non-informative classifier would attain, confirming that the model concentrates risk among true positives despite the imbalance.",
    "At the default alarm threshold of 0.5, the model operated at a sensitivity (recall) of 0.803 and a specificity of 0.761. The corresponding confusion matrix was 1,977 true positives, 484 false negatives, 56,187 true negatives and 17,615 false positives, giving a precision of 0.101, an F1 of 0.179 and a false-alarm rate of 0.239. In other words, the detector recovered roughly four of every five impending-deterioration windows while raising an alarm on about one in four non-event windows; the threshold can be tuned on the validation set to trade sensitivity against false-alarm burden according to the tolerances of a given tele-nursing workflow.",
  ],
  tbl_caption: "Table 1. Held-out test performance on the PhysioNet/CinC 2019 test partition.",
  fig_note: "Figures 1-2 are conceptual diagrams of the framework. Figures 3-7 (ROC, precision-recall, confusion matrix, calibration and decision-curve analysis) are generated directly from the model run on the held-out PhysioNet/CinC 2019 test partition.",
  discussion: [
    "The AUROC of 0.866 places the detector in the range reported for machine-learning early-warning systems[8,9] and above typical threshold-based scores, while the AUPRC of 0.243 — roughly eight times the positive prevalence — is the more informative figure for a rare-event task and indicates that the risk score is genuinely concentrated among windows that precede deterioration. Clinically, the operating point captures the central trade-off of any remote-monitoring alert system: a sensitivity of 0.803 means most impending-deterioration windows are flagged, but the accompanying false-alarm rate of 0.239 and precision of 0.101 imply that the majority of individual alerts will not correspond to an event. Because the alarm threshold is a tunable parameter, a tele-nursing service can move along this curve — accepting fewer alarms at lower sensitivity, or higher sensitivity at greater review burden — to match its staffing and the consequences of a missed deterioration. Prioritizing alerts by risk score, rather than treating them as binary, offers a practical way to direct scarce nurse attention to the highest-risk patients first.",
    "Three results strengthen the case beyond headline discrimination. First, the recurrent model significantly outperformed both a tuned logistic-regression baseline and a threshold-style early-warning score on the identical split (DeLong p < 0.001), so the gain is attributable to temporal modeling rather than to the choice of features. Second, although the raw scores were over-confident under class-imbalance weighting, a single isotonic recalibration restored near-ideal calibration (ECE 0.0017), which matters because tele-nursing triage acts on probability thresholds. Third, decision-curve analysis showed positive net benefit across the clinically plausible 5–20% threshold range, evidence of usefulness rather than mere discrimination.",
    "Reproducibility is itself a contribution here. Because the entire evaluation runs on an openly downloadable dataset with released code and a fixed seed, every number in this manuscript can be regenerated and independently checked — a property that remains uncommon in this application area and that we regard as a precondition for trustworthy AI-assisted remote care.",
    "Positioned within a smart-hospital ecosystem, a risk-prioritized detector of this kind is intended to support — not replace — nurse-led patient safety monitoring: prioritized alerts can help nurses triage a remote caseload, direct teleconsultations to the highest-risk patients, and reinforce nurse-patient engagement and holistic chronic care. We stress, however, that the present study validates only the detection component; whether these workflow and engagement benefits materialize is an empirical question for the prospective work outlined below.",
  ],
  nursing: [
    "For nurse-led tele-monitoring, the value of an AI detector lies less in raw discrimination than in how it fits the nursing workflow. A calibrated, risk-prioritized score lets nurses triage a large remote caseload by directing scarce attention to the patients most likely to deteriorate, instead of reviewing every reading or chasing undifferentiated threshold alarms. The decision-curve evidence — net benefit across the 5–20% threshold range — gives a transparent basis for deciding how aggressively a service should alert, a judgment that rests with nursing in light of local staffing and the consequences of a missed deterioration.",
    "Alert quality is central to front-line nursing acceptance. Threshold-based early-warning systems are a well-documented source of alarm fatigue — the desensitization of nurses to frequent, largely non-actionable alarms, which jeopardizes patient safety and nurse well-being[19]; a detector that is simultaneously more discriminating and well calibrated can suppress low-value alerts and protect nurses' attention, supporting rather than supplanting clinical judgment. Equally important, prioritized alerts are meant to strengthen the nurse-patient relationship: by surfacing early risk they create openings for proactive teleconsultation, patient education and shared decision-making that are core to nursing practice and to holistic chronic care.",
    "Embedding such a detector within a smart-hospital ecosystem keeps the registered nurse as the accountable decision-maker — the model informs surveillance, while assessment, escalation and care planning remain nursing responsibilities. Realising these benefits will require nurse-led implementation research on workflow integration, education, and the human factors of acting on probabilistic risk, alongside the prospective clinical validation outlined below.",
  ],
  limits: [
    "First, and most importantly, deterioration is operationalized using the PhysioNet 2019 sepsis-onset label from an intensive-care population — a validated but specific physiologic endpoint that serves as a proxy and testbed rather than a disease-specific chronic-care outcome; the tele-nursing chronic-care framing is therefore the intended application, not the setting evaluated here, and extension to MIMIC-IV chronic cohorts is the natural next step. Second, the wearable and tele-nursing layers are demonstrated rather than clinically validated, and the tele-nursing layer is synthetic. Third, results from a single public dataset require external and prospective validation before clinical deployment.",
    "Future work. The clinical and operational benefits often attributed to AI-assisted tele-nursing — improved nurse response time, higher medication adherence, reduced avoidable readmissions, and stronger nurse-patient engagement — are not measured in this study and must not be inferred from the present results. We instead frame them as a priori hypotheses to be tested in a prospective, ideally controlled deployment that links the deterioration detector to a real nurse-led tele-monitoring workflow with consented patients and pre-registered endpoints. Such a study would also quantify the alarm threshold's effect on nurse workload and replace the synthetic integration layer with real tele-nursing, patient-reported-outcome and adherence data.",
  ],
  conclusion: [
    "We presented a reproducible, open-data evaluation of an RNN early-deterioration detector embedded in a nurse-led tele-monitoring framework, with a transparently-labeled synthetic integration layer. Evaluated as a methodological proof-of-concept on an open intensive-care deterioration testbed, the approach offers an honest, checkable foundation for AI-assisted nurse-led remote chronic care and a clear path to clinically-grounded extension.",
  ],
  avail: "All code is available in the accompanying repository. Real datasets are public: PhysioNet/CinC 2019 (DOI 10.13026/v64v-d857), the only dataset used in this study; MIMIC-IV (DOI 10.13026/6mm1-ek67, credentialed) and PPG-DaLiA (DOI 10.24432/C53890) are listed as optional extensions and were not used here. The synthetic tele-nursing layer is reproducible from the seeded generator. No proprietary patient data were used.",
  refs: REFS,
};

// ---------------- INDONESIAN ----------------
const ID = {
  title: "Tele-Keperawatan dan Pemantauan Keselamatan Pasien Berbasis Wearable untuk Manajemen Penyakit Kronis: Kerangka AI Terintegrasi yang Dievaluasi pada Data Fisiologis Terbuka",
  target: "Disiapkan untuk CIN: Computers, Informatics, Nursing (Lippincott/Ovid; SCImago Nursing Q2) — alternatif: JMIR Nursing / Belitung Nursing Journal (Q2 Indonesia). Sesuaikan format dengan panduan jurnal. Versi Bahasa Indonesia untuk dokumentasi/jurnal nasional Sinta.",
  t: { metric: "Metrik", value: "Nilai", sens: "Sensitivitas (recall)", spec: "Spesifisitas", far: "Laju alarm palsu" },
  s: { abstract: "Abstrak", keywords: "Kata kunci", intro: "1. Pendahuluan", related: "2. Tinjauan Pustaka",
    methods: "3. Metode", m_data: "3.1 Dataset", m_pre: "3.2 Prapemrosesan dan Windowing", m_model: "3.3 Arsitektur Model",
    m_train: "3.4 Pelatihan", m_eval: "3.5 Evaluasi", m_syn: "3.6 Lapisan Integrasi Tele-Keperawatan Sintetis", m_ethics: "3.7 Etika dan Tata Kelola Data",
    results: "4. Hasil", discussion: "5. Pembahasan",
    nursing: "6. Implikasi bagi Praktik Keperawatan", limits: "7. Keterbatasan", conclusion: "8. Simpulan",
    avail: "Ketersediaan Data dan Kode", refs: "Daftar Pustaka" },
  tg: { endpoint: "Luaran", target: "Target pra-spesifikasi (hipotesis a priori)", basis: "Status / dasar" },
  target_tbl_caption: "Tabel 3. Target luaran pra-spesifikasi / hipotesis a priori untuk usulan studi validasi prospektif (BUKAN hasil studi ini).",
  target_outcomes: [
    ["Kohort dan durasi studi", "≈420 pasien kardiovaskular/diabetes kronis dipantau selama 9 bulan", "Target rancangan (kerangka 004)"],
    ["Sensitivitas deteksi dini perburukan", "≥ 0,89", "Target; bdk. 0,803 yang dicapai di sini pada PhysioNet 2019 (kelayakan)"],
    ["Penurunan alarm palsu vs EWS ambang", "≥ 31%", "Hipotesis a priori"],
    ["Waktu respons perawat", "≥ 24% perbaikan", "Hipotesis a priori"],
    ["Kepatuhan obat", "Peningkatan signifikan (target p < 0,01)", "Hipotesis a priori"],
    ["Rawat inap ulang yang dapat dicegah", "≥ 18% penurunan", "Hipotesis a priori"],
    ["Keterlibatan perawat-pasien / kepercayaan pasien", "Perbaikan kualitatif", "Hipotesis a priori"],
  ],
  protocol_warn: "Angka pada Tabel 3 adalah TARGET pra-spesifikasi dan HIPOTESIS a priori untuk studi prospektif mendatang. Angka ini BUKAN hasil studi sekarang, tidak diukur di sini, dan tidak boleh dikutip sebagai temuan.",
  protocol_pre: [
    "Untuk menerjemahkan bukti kelayakan data-terbuka di atas menjadi nilai klinis, kami menggariskan studi validasi prospektif yang menautkan detektor perburukan ke alur tele-pemantauan nyata yang dipimpin perawat. Rancangannya mengikuti kerangka terintegrasi dari konsep awal: kohort sekitar 420 pasien lansia dengan kondisi kardiovaskular dan diabetes kronis yang dipantau selama sembilan bulan melalui biosensor wearable (denyut jantung, saturasi oksigen, aktivitas), luaran yang dilaporkan pasien, dan teleconsultation yang dipimpin perawat, dengan alarm berprioritas-AI yang ditampilkan kepada tim tele-keperawatan.",
    "Studi tersebut akan dipraregistrasi dengan endpoint dan besar efek target yang dirangkum pada Tabel 3. Target ini dinyatakan a priori agar hipotesis dapat difalsifikasi; naskah ini hanya melaporkan kelayakan detektor (Bagian 4) dan tidak mengeklaim satu pun efek hilir tersebut.",
  ],
  protocol_post: [
    "Analisis daya (power), persetujuan setelah penjelasan (informed consent), alokasi acak atau stepped-wedge, serta penggantian lapisan integrasi sintetis dengan data tele-keperawatan, luaran yang dilaporkan pasien, dan kepatuhan yang nyata merupakan prasyarat protokol ini dan sengaja berada di luar lingkup studi data-terbuka sekarang.",
  ],
  abstract: "Latar belakang: Pemantauan keselamatan pasien penyakit kardiovaskular dan metabolik kronis semakin banyak dijalankan melalui tele-keperawatan dan biosensor wearable, yang bersama-sama memperluas keperawatan berbasis bukti melampaui batas fisik rumah sakit sembari mempertahankan pengawasan klinis. Pemantauan jarak jauh berkelanjutan berpotensi mendeteksi perburukan klinis lebih awal dan mendukung tele-perawatan yang dipimpin perawat dalam ekosistem rumah sakit pintar yang sedang berkembang. Namun, banyak kerangka yang diusulkan tidak dievaluasi pada data terbuka sehingga sulit direproduksi. Tujuan: Kami menyajikan dan mengevaluasi secara terbuka kerangka terintegrasi tele-keperawatan dan pemantauan keselamatan pasien berbasis wearable, di mana jaringan saraf rekuren mendeteksi perburukan fisiologis dini dari deret waktu tanda vital multivariat. Sebagai proof-of-concept metodologis yang reproducible untuk kerangka tersebut, detektor diinstansiasi dan dievaluasi pada testbed perburukan perawatan intensif terbuka sebelum penerapan pada perawatan kronis atau di rumah. Metode: Menggunakan dataset terbuka PhysioNet/Computing in Cardiology 2019, deteksi dini perburukan dirumuskan sebagai prediksi onset sepsis tervalidasi — dipakai di sini sebagai proksi perburukan fisiologis — dalam rentang waktu tertentu dari jendela geser tanda vital per jam (denyut jantung, saturasi oksigen, suhu, tekanan darah, pernapasan). Klasifikasi gated recurrent unit (GRU) dilatih dengan pembobotan ketidakseimbangan kelas dan dievaluasi pada subset uji terpisah. Lapisan sintetis berlabel jelas hanya digunakan untuk mendemonstrasikan alur integrasi tele-keperawatan. Hasil: Pada set uji terpisah berisi 76.263 jendela per jam (2.461 positif; prevalensi 3,2%), GRU mencapai AUROC 0,866 dan AUPRC 0,243. Pada ambang alarm default (0,5) diperoleh sensitivitas 0,803 dan spesifisitas 0,761, dengan presisi 0,101, F1 0,179, dan laju alarm palsu 0,239. GRU secara signifikan mengungguli baseline regresi logistik dan skor peringatan dini berbasis ambang (DeLong p < 0,001), terkalibrasi baik setelah rekalibrasi isotonik (ECE 0,0017), dan memberikan net benefit positif pada decision-curve analysis di seluruh ambang alarm yang relevan secara klinis. Simpulan: Kerangka ini menyediakan dasar yang reproducible dan dapat dievaluasi terbuka untuk pemantauan keselamatan pasien berbantuan AI yang dipimpin perawat dan dapat menopang perawatan kronis holistik dalam ekosistem rumah sakit pintar; seluruh kode dan sumber data bersifat publik. Luaran perawatan hilir — waktu respons perawat, kepatuhan obat, rawat inap ulang, dan keterlibatan perawat-pasien — dirumuskan sebagai hipotesis prospektif untuk validasi mendatang, bukan hasil studi ini.",
  keywords: "Tele-keperawatan; Perangkat kesehatan wearable; Manajemen penyakit kronis; Pemantauan keselamatan pasien; Analitik kesehatan jarak jauh; Jaringan saraf rekuren; Perburukan klinis; Failure to rescue; Kalibrasi; Decision curve analysis; Reproduksibilitas",
  intro: [
    "Penyakit kardiovaskular dan metabolik kronis membebani sistem kesehatan secara berkelanjutan dan menjadi pendorong utama rawat inap ulang yang dapat dicegah. Model perawatan jarak jauh, di mana perawat mengoordinasikan pemantauan dan intervensi di luar rumah sakit, dikaitkan dengan perbaikan kualitas hidup dan manajemen mandiri pada beberapa tinjauan sistematis.[1-3] Dalam visi yang lebih luas tentang pemantauan keselamatan pasien dan ekosistem rumah sakit pintar, tele-keperawatan yang dipadukan dengan biosensor wearable bertujuan memperluas pengawasan keperawatan berbasis bukti yang berkelanjutan hingga ke rumah serta memperkuat keterlibatan perawat-pasien sepanjang perjalanan perawatan kronis.",
    "Dalam kerangka keselamatan pasien, tujuannya adalah mencegah failure to rescue — kegagalan mengenali, mengomunikasikan, atau menindaklanjuti perburukan klinis — sebuah luaran sensitif-keperawatan yang akar penyebabnya telah terdokumentasi baik.[4] Surveilans yang dipimpin perawat, yaitu akuisisi, interpretasi, dan sintesis data pasien yang bertujuan dan berkelanjutan untuk pengambilan keputusan klinis, merupakan penentu utama rescue yang tepat waktu,[5] dan bukti penting mengaitkan kapasitas keperawatan secara langsung dengan angka failure-to-rescue.[6] Tele-keperawatan dengan biosensor wearable dapat dipahami sebagai perluasan kapasitas surveilans ini melampaui bangsal; peran detektor AI dalam studi ini adalah mendukung, bukan menggantikan, surveilans keperawatan tersebut dengan memprioritaskan ke mana perhatian yang terbatas diarahkan.",
    "Dua arus teknologi melatarbelakangi penelitian ini. Pertama, biosensor wearable kini menyediakan aliran data denyut jantung, saturasi oksigen, dan aktivitas yang nyaris berkelanjutan;[7] pada testbed terbuka yang dipakai di sini, masukan model adalah tujuh tanda vital rutin, tanpa kanal aktivitas wearable. Kedua, model sekuens seperti jaringan saraf rekuren dapat mempelajari pola temporal spesifik pasien yang tidak dapat ditangkap skor peringatan dini tetap.[8,9] Namun, kelemahan metodologis yang berulang adalah kerangka yang diusulkan sering dideskripsikan tanpa evaluasi pada data terbuka yang dapat direproduksi.",
    "Studi ini menjawab kesenjangan tersebut secara langsung. Alih-alih melaporkan kohort milik satu institusi, kami mengoperasionalkan tugas deteksi perburukan pada dataset fisiologis terbuka sehingga setiap angka yang dilaporkan dapat dihasilkan ulang oleh pembaca mana pun dari kode yang disertakan. Kami juga menyatakan secara eksplisit komponen mana yang merupakan data sekunder nyata dan mana yang sintetis.",
  ],
  related: [
    "Telehealth untuk kondisi kronis telah dievaluasi pada beberapa tinjauan sistematis,[1-3,10] dengan model yang dipimpin perawat menunjukkan manfaat pada kepatuhan dan luaran yang dilaporkan pasien, sembari menyoroti heterogenitas endpoint. Riset penerimaan menegaskan bahwa kesesuaian alur kerja dan kualitas alarm sangat memengaruhi adopsi di garis depan.[11]",
    "Di sisi pemodelan, sistem peringatan dini berbasis pembelajaran mesin berulang kali mengungguli skor berbasis ambang untuk perburukan yang mengancam,[8,9,12] dan arsitektur rekuren cocok untuk deret fisiologis yang tidak teratur. Studi berbasis wearable juga menunjukkan sinyal multimodal dapat menandai risiko perburukan pada pasien rawat jalan.[7,10] Kontribusi kami adalah memadukan detektor perburukan RNN dengan evaluasi data terbuka yang reproducible dan lapisan integrasi tele-keperawatan yang dilabeli secara transparan.",
  ],
  m_data: [
    "Data pemodelan utama adalah dataset terbuka PhysioNet/Computing in Cardiology 2019,[13,14] sebuah kohort perawatan intensif yang menyediakan rekaman tanda vital multivariat per jam dengan label onset sepsis tervalidasi, yang kami pakai sebagai proksi perburukan fisiologis. Kami menggunakan tujuh tanda vital yang dapat diperoleh wearable (denyut jantung, saturasi oksigen, suhu, tekanan darah sistolik/diastolik/arteri rata-rata, dan laju pernapasan) sebagai masukan model.",
    "Dua dataset terbuka lain didukung secara opsional untuk perluasan mendatang tetapi tidak digunakan dalam analisis ini: MIMIC-IV (berkredensial)[15] untuk kohort penyakit kronis berdasarkan kode diagnosis, dan PPG-DaLiA[7] untuk front-end denyut jantung berbasis wearable pergelangan tangan. Provenans lengkap, lisensi, dan DOI dataset tercantum dalam Materi Tambahan.",
  ],
  m_pre: [
    "Setiap rekaman pasien diisi maju/mundur dan diimputasi median dalam pasien. Kami kemudian menggeser jendela selebar W jam; sebuah jendela dilabeli positif jika onset perburukan terjadi dalam L jam berikutnya, sehingga tugas dirumuskan sebagai prediksi sebelum pengenalan klinis. Nilai default (W = 8, L = 6) ditetapkan pada berkas konfigurasi dan dilaporkan demi reproduksibilitas.",
    "Data dibagi menjadi partisi latih, validasi, dan uji dengan stratifikasi pada label, dan statistik standardisasi per fitur diestimasi hanya pada partisi latih untuk menghindari kebocoran data.",
  ],
  m_model: [
    "Detektor merupakan jaringan gated recurrent unit (GRU) yang memetakan jendela tanda vital terstandardisasi menjadi satu logit risiko perburukan melalui keadaan tersembunyi akhir, diikuti kepala terhubung penuh kecil dengan normalisasi lapisan dan dropout. Pada setiap langkah waktu GRU memperbarui gerbang reset dan gerbang update serta keadaan tersembunyi kandidat, dan skor risiko diperoleh sebagai sigmoid dari proyeksi linear keadaan tersembunyi akhir; persamaan pembaruan lengkap disediakan pada Materi Tambahan. Varian long short-term memory dapat dipilih.",
  ],
  m_train: [
    "Model dilatih dengan pengoptimal Adam dan binary cross-entropy berbobot, dengan bobot kelas positif ditetapkan otomatis dari prevalensi pelatihan untuk menanggulangi ketidakseimbangan kelas. Penghentian dini memantau rugi validasi. Seluruh hiperparameter dan seed acak dicatat pada berkas konfigurasi.",
  ],
  m_eval: [
    "Pada partisi uji terpisah kami melaporkan diskriminasi (AUROC, AUPRC) dan metrik titik operasi pada ambang alarm yang dapat dikonfigurasi: sensitivitas (recall), spesifisitas, presisi, F1, dan laju alarm palsu, beserta matriks konfusi. Nilai-nilai ini ditulis ke berkas metrik yang dapat dibaca mesin dan menjadi sumber setiap angka pada bagian Hasil.",
    "Pembanding. Untuk menempatkan model rekuren dalam konteks, kami mengevaluasi dua baseline reproducible pada split yang identik: pengklasifikasi regresi logistik yang dilatih pada ringkasan jendela per tanda vital (rata-rata, simpangan baku, minimum, maksimum, nilai terakhir, dan kemiringan dari ketujuh tanda vital sepanjang jendela delapan jam), serta skor peringatan dini deviasi tanpa pelatihan yang didefinisikan sebagai jumlah deviasi terstandardisasi mutlak dari tanda vital jam terakhir, proksi transparan untuk alarm berbasis ambang/EWS.",
    "Kalibrasi dan kegunaan klinis. Kalibrasi dinilai dengan skor Brier, expected calibration error (ECE, sepuluh bin), dan kurva reliabilitas, dan — karena pembobotan ketidakseimbangan kelas diketahui mendistorsi probabilitas — kami juga memasang peta rekalibrasi isotonik pada split validasi lalu menerapkannya tanpa perubahan pada split uji. Kegunaan klinis dirangkum dengan decision-curve analysis,[17] melaporkan net benefit di seluruh probabilitas ambang alarm dari 0,01 hingga 0,50 terhadap strategi default tangani-semua dan tangani-tidak-ada.",
    "Analisis statistik. Interval kepercayaan 95% untuk AUROC, AUPRC, dan sensitivitas diperoleh melalui pengambilan ulang bootstrap terstratifikasi (1.000 replikat, seed 42). Selisih AUROC antara model rekuren dan baseline regresi logistik diuji dengan metode DeLong.[16] Kami mengikuti panduan pelaporan TRIPOD-AI untuk studi model prediksi.[18]",
  ],
  cmp: { model: "Model", sens: "Sensitivitas (95% CI)", logreg: "Regresi logistik", ews: "EWS deviasi (tanpa pelatihan)" },
  figcap: {
    f1: "Gambar 1. Arsitektur sistem (konseptual).",
    f2: "Gambar 2. Pipeline data dan windowing (konseptual); lajur tele-keperawatan sintetis ditampilkan terpisah.",
    f3: "Gambar 3. Kurva ROC pada split uji PhysioNet/CinC 2019 (AUROC 0,866).",
    f4: "Gambar 4. Kurva precision–recall (AUPRC 0,243).",
    f5: "Gambar 5. Matriks konfusi pada ambang alarm 0,5.",
    f7: "Gambar 6. Kalibrasi: kurva reliabilitas (mentah vs rekalibrasi isotonik) dan distribusi skor risiko.",
    f8: "Gambar 7. Decision-curve analysis: net benefit terhadap probabilitas ambang alarm.",
  },
  tbl2_caption: "Tabel 2. Diskriminasi model rekuren versus baseline reproducible pada split uji PhysioNet/CinC 2019 yang identik (95% CI dari bootstrap terstratifikasi).",
  results_ext: [
    "Terhadap baseline reproducible pada split uji yang identik (Tabel 2), detektor rekuren jelas mengungguli: AUROC 0,866 (95% CI 0,859–0,872) melampaui regresi logistik 0,679 dan skor peringatan dini deviasi tanpa pelatihan 0,570, dan keunggulan AUROC atas regresi logistik besar serta tak ambigu menurut uji DeLong (ΔAUROC = 0,187; z = 32,2; p < 0,001). Selisihnya bahkan lebih tajam pada AUPRC yang sensitif terhadap ketidakseimbangan (0,243 versus 0,070 dan 0,045), menegaskan bahwa model temporal, bukan sekadar set fitur, yang memusatkan risiko pada kasus positif sejati.",
    "Kalibrasi. Pada titik operasi mentah skor risiko terlalu percaya diri, sebagaimana diperkirakan akibat pembobotan ketidakseimbangan kelas (Brier 0,150; ECE 0,237). Satu peta rekalibrasi isotonik yang dipasang pada split validasi dan diterapkan tanpa perubahan pada split uji menghilangkan hampir seluruh miskalibrasi ini (Brier 0,027; ECE 0,0017; Gambar 6), menghasilkan probabilitas yang sesuai untuk triase berbasis ambang.",
    "Kegunaan klinis. Decision-curve analysis menunjukkan bahwa detektor yang direkalibrasi memberikan net benefit positif di seluruh rentang ambang alarm yang relevan secara klinis sekitar 5–20% (misalnya, net benefit 0,014 pada ambang 5% dan 0,009 pada 10%), melampaui strategi tangani-semua dan tangani-tidak-ada serta baseline regresi logistik yang berada pada atau di bawah nol pada rentang yang sama (Gambar 7).",
  ],
  m_syn: [
    "Tidak ada dataset terbuka yang menautkan catatan konsultasi tele-keperawatan, luaran yang dilaporkan pasien, waktu respons perawat, dan kepatuhan pada pasien yang sama dengan tanda vital yang kami modelkan. Untuk mendemonstrasikan alur integrasi semata, kami membangkitkan lapisan ini dengan simulator stokastik transparan berbasis seed. Setiap rekaman ditandai sebagai sintetis, dan data ini tidak pernah digunakan untuk menghitung kinerja klinis serta tidak pernah dilaporkan sebagai luaran.",
  ],
  m_syn_warn: "Catatan: lapisan tele-keperawatan/PRO/kepatuhan bersifat SINTETIS (simulasi). Hanya digunakan untuk mengilustrasikan aliran data dan tidak pernah dilaporkan sebagai hasil klinis.",
  m_ethics: [
    "Penelitian ini merupakan analisis sekunder atas dataset publik yang telah dianonimkan dan digunakan sesuai perjanjian penggunaan data masing-masing; penggunaan semacam ini umumnya tergolong penelitian bukan-subjek-manusia. Lapisan sintetis tidak melibatkan subjek manusia dan tidak memerlukan persetujuan etik. Peneliti perlu mengonfirmasi ketentuan institusi setempat sebelum pengajuan.",
  ],
  results_warn: "Seluruh nilai pada bagian ini berasal dari satu evaluasi pada partisi uji terpisah PhysioNet/CinC 2019 (seed acak 42; jendela masukan 8 jam, lead time 6 jam) dan sepenuhnya dapat direproduksi dari kode yang dirilis.",
  results: [
    "Partisi uji terpisah terdiri atas 76.263 jendela per jam, dengan 2.461 (3,2%) berlabel positif untuk perburukan yang akan datang, mencerminkan ketidakseimbangan kelas yang melekat pada tugas peringatan dini. Pada set ini detektor GRU mencapai AUROC 0,866, menandakan kemampuan diskriminasi yang baik antara jendela yang mendahului perburukan dan yang tidak. Area di bawah kurva precision-recall sebesar 0,243, jauh di atas prevalensi positif 0,032 yang akan dicapai pengklasifikasi non-informatif, menegaskan bahwa model memusatkan risiko pada kasus positif sejati meskipun terjadi ketidakseimbangan.",
    "Pada ambang alarm default 0,5, model bekerja pada sensitivitas (recall) 0,803 dan spesifisitas 0,761. Matriks konfusi yang bersesuaian adalah 1.977 positif benar, 484 negatif palsu, 56.187 negatif benar, dan 17.615 positif palsu, menghasilkan presisi 0,101, F1 0,179, dan laju alarm palsu 0,239. Dengan kata lain, detektor menangkap sekitar empat dari setiap lima jendela perburukan yang akan datang sembari memunculkan alarm pada sekitar satu dari empat jendela tanpa peristiwa; ambang dapat disetel pada set validasi untuk menukar sensitivitas dengan beban alarm palsu sesuai toleransi alur tele-keperawatan tertentu.",
  ],
  tbl_caption: "Tabel 1. Kinerja uji terpisah pada partisi uji PhysioNet/CinC 2019.",
  fig_note: "Gambar 1-2 adalah diagram konseptual kerangka. Gambar 3-7 (ROC, precision-recall, matriks konfusi, kalibrasi, dan decision-curve analysis) dihasilkan langsung dari run model pada partisi uji terpisah PhysioNet/CinC 2019.",
  discussion: [
    "AUROC 0,866 menempatkan detektor pada rentang yang dilaporkan untuk sistem peringatan dini berbasis pembelajaran mesin[8,9] dan di atas skor berbasis ambang konvensional, sementara AUPRC 0,243 — sekitar delapan kali prevalensi positif — merupakan ukuran yang lebih informatif untuk tugas peristiwa langka dan menunjukkan bahwa skor risiko benar-benar terpusat pada jendela yang mendahului perburukan. Secara klinis, titik operasi ini menangkap trade-off utama setiap sistem alarm pemantauan jarak jauh: sensitivitas 0,803 berarti sebagian besar jendela perburukan tertandai, namun laju alarm palsu 0,239 dan presisi 0,101 menyiratkan bahwa mayoritas alarm individual tidak berkaitan dengan peristiwa. Karena ambang alarm adalah parameter yang dapat disetel, layanan tele-keperawatan dapat bergeser sepanjang kurva ini — menerima lebih sedikit alarm pada sensitivitas lebih rendah, atau sensitivitas lebih tinggi dengan beban telaah lebih besar — sesuai ketersediaan tenaga dan konsekuensi perburukan yang terlewat. Memprioritaskan alarm berdasarkan skor risiko, alih-alih memperlakukannya biner, menawarkan cara praktis mengarahkan perhatian perawat yang terbatas ke pasien berisiko tertinggi terlebih dahulu.",
    "Tiga hasil memperkuat argumen melampaui sekadar diskriminasi utama. Pertama, model rekuren secara signifikan mengungguli baseline regresi logistik yang ditala maupun skor peringatan dini berbasis ambang pada split yang identik (DeLong p < 0,001), sehingga peningkatan berasal dari pemodelan temporal, bukan dari pemilihan fitur. Kedua, meskipun skor mentah terlalu percaya diri akibat pembobotan ketidakseimbangan kelas, satu rekalibrasi isotonik memulihkan kalibrasi nyaris ideal (ECE 0,0017), yang penting karena triase tele-keperawatan bertindak atas ambang probabilitas. Ketiga, decision-curve analysis menunjukkan net benefit positif di seluruh rentang ambang 5–20% yang masuk akal secara klinis, bukti kegunaan dan bukan sekadar diskriminasi.",
    "Reproduksibilitas merupakan kontribusi tersendiri di sini. Karena seluruh evaluasi berjalan pada dataset yang dapat diunduh terbuka dengan kode yang dirilis dan seed tetap, setiap angka dalam naskah ini dapat dihasilkan ulang dan diperiksa secara independen — sifat yang masih jarang pada bidang aplikasi ini dan yang kami pandang sebagai prasyarat AI tepercaya untuk perawatan jarak jauh.",
    "Dalam konteks ekosistem rumah sakit pintar, detektor berprioritas-risiko semacam ini dimaksudkan untuk mendukung — bukan menggantikan — pemantauan keselamatan pasien yang dipimpin perawat: alarm berprioritas dapat membantu perawat memilah beban kasus jarak jauh, mengarahkan teleconsultation ke pasien berisiko tertinggi, serta memperkuat keterlibatan perawat-pasien dan perawatan kronis holistik. Namun kami menegaskan bahwa studi ini hanya memvalidasi komponen deteksi; apakah manfaat alur kerja dan keterlibatan tersebut benar-benar terwujud merupakan pertanyaan empiris bagi penelitian prospektif yang diuraikan di bawah.",
  ],
  nursing: [
    "Bagi tele-pemantauan yang dipimpin perawat, nilai sebuah detektor AI terletak bukan pada diskriminasi semata melainkan pada bagaimana ia menyatu dengan alur kerja keperawatan. Skor risiko yang terkalibrasi dan berprioritas memungkinkan perawat memilah beban kasus jarak jauh yang besar dengan mengarahkan perhatian terbatas kepada pasien yang paling mungkin memburuk, alih-alih menelaah setiap pembacaan atau mengejar alarm ambang yang tidak terdiferensiasi. Bukti decision-curve — net benefit pada rentang ambang 5–20% — memberi dasar transparan untuk memutuskan seberapa agresif layanan memunculkan alarm, suatu pertimbangan yang berada pada ranah keperawatan sesuai ketersediaan tenaga dan konsekuensi perburukan yang terlewat.",
    "Kualitas alarm sangat menentukan penerimaan di garis depan keperawatan. Sistem peringatan dini berbasis ambang adalah sumber alarm fatigue yang terdokumentasi baik — desensitisasi perawat terhadap alarm yang sering dan sebagian besar tidak dapat ditindaklanjuti, yang membahayakan keselamatan pasien dan kesejahteraan perawat[19]; detektor yang sekaligus lebih diskriminatif dan terkalibrasi baik dapat menekan alarm bernilai rendah dan menjaga perhatian perawat, mendukung dan bukan menggantikan penilaian klinis. Yang tak kalah penting, alarm berprioritas dimaksudkan memperkuat hubungan perawat-pasien: dengan memunculkan risiko dini, ia membuka peluang teleconsultation proaktif, edukasi pasien, dan pengambilan keputusan bersama yang menjadi inti praktik keperawatan dan perawatan kronis holistik.",
    "Menyematkan detektor semacam ini dalam ekosistem rumah sakit pintar tetap menempatkan perawat teregistrasi sebagai pengambil keputusan yang bertanggung jawab — model menginformasikan surveilans, sementara pengkajian, eskalasi, dan perencanaan asuhan tetap menjadi tanggung jawab keperawatan. Mewujudkan manfaat ini menuntut riset implementasi yang dipimpin perawat mengenai integrasi alur kerja, edukasi, dan faktor manusia dalam bertindak atas risiko probabilistik, di samping validasi klinis prospektif yang diuraikan di bawah.",
  ],
  limits: [
    "Pertama, dan yang terpenting, perburukan dioperasionalkan memakai label onset sepsis PhysioNet 2019 dari populasi perawatan intensif — endpoint fisiologis tervalidasi namun spesifik yang berfungsi sebagai proksi dan uji-coba alih-alih luaran perawatan kronis spesifik penyakit; dengan demikian framing tele-keperawatan kronis adalah aplikasi yang dituju, bukan setting yang dievaluasi di sini, dan perluasan ke kohort kronis MIMIC-IV merupakan langkah lanjutan alami. Kedua, lapisan wearable dan tele-keperawatan didemonstrasikan, bukan divalidasi klinis; lapisan tele-keperawatan bersifat sintetis. Ketiga, hasil dari satu dataset publik memerlukan validasi eksternal dan prospektif sebelum penerapan klinis.",
    "Penelitian lanjutan. Manfaat klinis dan operasional yang sering dikaitkan dengan tele-keperawatan berbantuan AI — perbaikan waktu respons perawat, kepatuhan obat yang lebih tinggi, penurunan rawat inap ulang yang dapat dicegah, dan keterlibatan perawat-pasien yang lebih kuat — tidak diukur dalam studi ini dan tidak boleh disimpulkan dari hasil sekarang. Kami justru merumuskannya sebagai hipotesis a priori yang akan diuji dalam penerapan prospektif, idealnya terkontrol, yang menautkan detektor perburukan ke alur tele-pemantauan nyata yang dipimpin perawat dengan pasien yang menyetujui dan endpoint yang dipraregistrasi. Studi semacam itu juga akan mengukur pengaruh ambang alarm terhadap beban kerja perawat dan menggantikan lapisan integrasi sintetis dengan data tele-keperawatan, luaran yang dilaporkan pasien, dan kepatuhan yang nyata.",
  ],
  conclusion: [
    "Kami menyajikan evaluasi data-terbuka yang reproducible atas detektor perburukan dini berbasis RNN yang tertanam dalam kerangka pemantauan jarak jauh yang dipimpin perawat, dengan lapisan integrasi sintetis berlabel transparan. Pendekatan ini menawarkan fondasi yang jujur dan dapat diperiksa untuk perawatan kronis jarak jauh berbantuan AI serta jalur jelas menuju perluasan yang berbasis klinis.",
  ],
  avail: "Seluruh kode tersedia pada repositori terlampir. Dataset nyata bersifat publik: PhysioNet/CinC 2019 (DOI 10.13026/v64v-d857), satu-satunya dataset yang digunakan dalam studi ini; MIMIC-IV (DOI 10.13026/6mm1-ek67, berkredensial) dan PPG-DaLiA (DOI 10.24432/C53890) dicantumkan sebagai perluasan opsional dan tidak digunakan di sini. Lapisan tele-keperawatan sintetis dapat direproduksi dari generator berbasis seed. Tidak ada data pasien milik pribadi yang digunakan.",
  refs: REFS,
};

Packer.toBuffer(buildDoc(EN)).then(b => fs.writeFileSync("manuscript_EN.docx", b)).then(() => console.log("wrote manuscript_EN.docx"));
Packer.toBuffer(buildDoc(ID)).then(b => fs.writeFileSync("manuscript_ID.docx", b)).then(() => console.log("wrote manuscript_ID.docx"));
