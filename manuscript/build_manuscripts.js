const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageNumber, Footer
} = require("docx");

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
      row(["AUROC", "[[RUN PIPELINE → metrics.json: auroc]]"], 9360),
      row(["AUPRC", "[[RUN PIPELINE → auprc]]"], 9360),
      row([C.t.sens, "[[RUN PIPELINE → sensitivity_recall]]"], 9360),
      row([C.t.spec, "[[RUN PIPELINE → specificity]]"], 9360),
      row([C.t.far, "[[RUN PIPELINE → false_alarm_rate]]"], 9360),
      row(["F1", "[[RUN PIPELINE → f1]]"], 9360),
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
    H2(C.s.m_train), ...C.m_train.map(t => P(t)),
    H2(C.s.m_eval), ...C.m_eval.map(t => P(t)),
    H2(C.s.m_syn), PH(C.m_syn_warn), ...C.m_syn.map(t => P(t)),
    H2(C.s.m_ethics), ...C.m_ethics.map(t => P(t)),

    H1(C.s.results),
    PH(C.results_warn),
    ...C.results.map(t => P(t)),
    new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: C.tbl_caption, bold: true, size: 20 })] }),
    metricsTable,
    new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: C.fig_note, italics: true, size: 20 })] }),

    H1(C.s.discussion),
    ...C.discussion.map(t => P(t)),

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

// shared verified references
const REFS = [
  "Johnson AEW, Bulgarelli L, Shen L, et al. MIMIC-IV, a freely accessible electronic health record dataset. Sci Data. 2023;10:1. https://doi.org/10.1038/s41597-022-01899-x",
  "Reyna MA, Josef CS, Jeter R, et al. Early Prediction of Sepsis From Clinical Data: The PhysioNet/Computing in Cardiology Challenge 2019. Crit Care Med. 2020;48(2):210-217. https://doi.org/10.1097/CCM.0000000000004145",
  "Goldberger AL, Amaral LAN, Glass L, et al. PhysioBank, PhysioToolkit, and PhysioNet. Circulation. 2000;101(23):e215-e220. https://doi.org/10.1161/01.CIR.101.23.e215",
  "Reiss A, Indlekofer I, Schmidt P, Van Laerhoven K. Deep PPG: Large-Scale Heart Rate Estimation with CNNs. Sensors. 2019;19(14):3079. https://doi.org/10.3390/s19143079",
  "Lewinski AA, Walsh C, Rushton S, et al. Telehealth for the Longitudinal Management of Chronic Conditions: Systematic Review. J Med Internet Res. 2022;24(8):e37100. https://doi.org/10.2196/37100",
  "Lee AYL, Wong AKC, Hung TTM, Yan J, Yang S. Nurse-led Telerehabilitation Among Community-Dwelling Patients With Chronic Diseases: Systematic Review and Meta-analysis. J Med Internet Res. 2022;24(11):e40364. https://doi.org/10.2196/40364",
  "Xiao Z, Han X. Evaluation of the Effectiveness of Telehealth Chronic Disease Management System: Systematic Review and Meta-analysis. J Med Internet Res. 2023;25:e44256. https://doi.org/10.2196/44256",
  "Kamei T, Yamamoto Y, Kanamori T, Nakayama Y, Porter SE. Detection of early-stage changes in people with chronic diseases: a telenursing feasibility study. Nurs Health Sci. 2018;20(3):313-322. https://doi.org/10.1111/nhs.12563",
  "Steitz BD, McCoy AB, Reese TJ, et al. ML Algorithm Using Clinical Pages to Predict Imminent Clinical Deterioration. J Gen Intern Med. 2024;39:27-34. https://doi.org/10.1007/s11606-023-08349-3",
  "Gonem S, Taylor A, Figueredo G, et al. Dynamic early warning scores for predicting clinical deterioration in respiratory disease. Respir Res. 2022;23:215. https://doi.org/10.1186/s12931-022-02130-6",
  "Cheng CY, Hsu TH, Hung YL, et al. Early prediction of in-hospital deterioration after ED admission using ML. BMC Emerg Med. 2026;26:6. https://doi.org/10.1186/s12873-025-01464-w",
  "Brewster L, Mountain G, Wessels B, Kelly C, Hawley M. Factors affecting front line staff acceptance of telehealth technologies. J Adv Nurs. 2014;70(1):21-33. https://doi.org/10.1111/jan.12196",
];

// ---------------- ENGLISH ----------------
const EN = {
  title: "An Integrated Tele-Nursing and Wearable AI Framework for Early Deterioration Detection in Chronic Disease: A Reproducible Study on Open Physiological Datasets",
  target: "Prepared for submission to JMIR mHealth and uHealth / International Journal of Medical Informatics (adapt formatting to chosen journal)",
  t: { metric: "Metric", value: "Value (from results/metrics.json)", sens: "Sensitivity (recall)", spec: "Specificity", far: "False-alarm rate" },
  s: { abstract: "Abstract", keywords: "Keywords", intro: "1. Introduction", related: "2. Related Work",
    methods: "3. Methods", m_data: "3.1 Datasets", m_pre: "3.2 Preprocessing and Windowing", m_model: "3.3 Model Architecture",
    m_train: "3.4 Training", m_eval: "3.5 Evaluation", m_syn: "3.6 Synthetic Tele-Nursing Integration Layer", m_ethics: "3.7 Ethics and Data Governance",
    results: "4. Results", discussion: "5. Discussion", limits: "6. Limitations", conclusion: "7. Conclusion",
    avail: "Data and Code Availability", refs: "References" },
  abstract: "Background: Continuous remote monitoring of patients with chronic cardiovascular and metabolic conditions may enable earlier detection of clinical deterioration and support nurse-led tele-care. However, many proposed frameworks are not evaluated on openly available data, limiting reproducibility. Objective: We present and openly evaluate an integrated tele-nursing and wearable-oriented framework in which a recurrent neural network detects early physiological deterioration from multivariate vital-sign time series. Methods: Using the openly available PhysioNet/Computing in Cardiology 2019 dataset, we framed early deterioration detection as predicting a validated physiologic deterioration onset within a fixed lead time from a sliding window of hourly vital signs (heart rate, oxygen saturation, temperature, blood pressure, respiration). A gated recurrent unit (GRU) classifier was trained with class-imbalance weighting and evaluated on a held-out test split. A clearly labelled synthetic layer was used solely to demonstrate the tele-nursing integration workflow. Results: [[RUN PIPELINE]] — report AUROC, AUPRC, sensitivity, specificity and false-alarm rate from results/metrics.json. Conclusions: The framework provides a reproducible, openly evaluable basis for AI-assisted, nurse-led remote monitoring; all code and data sources are public.",
  keywords: "tele-nursing; wearable sensors; chronic disease; clinical deterioration; recurrent neural network; reproducibility; open data",
  intro: [
    "Chronic cardiovascular and metabolic diseases impose a sustained burden on health systems and are a leading driver of avoidable hospital readmissions. Remote care models, in which nurses coordinate monitoring and intervention outside the hospital, have been associated with improvements in quality of life and self-management across multiple systematic reviews.",
    "Two technological currents motivate this work. First, wearable biosensors now provide near-continuous streams of heart rate, oxygen saturation and activity. Second, sequence models such as recurrent neural networks can learn patient-specific temporal patterns that fixed early-warning scores cannot. Yet a recurring methodological weakness is that proposed frameworks are frequently described without evaluation on reproducible, openly available data.",
    "This study addresses that gap directly. Rather than report a single-site proprietary cohort, we operationalise the deterioration-detection task on open physiological datasets so that every reported number can be regenerated by any reader from the accompanying code. We also make explicit which components are real secondary data and which are synthetic.",
  ],
  related: [
    "Telehealth for chronic conditions has been evaluated in several systematic reviews, with nurse-led models showing benefits in adherence and patient-reported outcomes while highlighting heterogeneity in endpoints. Acceptance research stresses that workflow fit and alert quality strongly influence front-line uptake.",
    "On the modelling side, machine-learning early-warning systems have repeatedly outperformed threshold-based scores for imminent deterioration, and recurrent architectures are well suited to irregular physiological sequences. Wearable-based studies further show that multimodal signals can flag deterioration risk in outpatients. Our contribution is to combine an RNN deterioration detector with an explicit, reproducible, open-data evaluation and a transparently-labelled tele-nursing integration layer.",
  ],
  m_data: [
    "The primary modelling data is the openly available PhysioNet/Computing in Cardiology 2019 dataset, which provides hourly multivariate vital-sign records with a validated physiologic deterioration onset label. We use the seven wearable-obtainable vital signs (heart rate, oxygen saturation, temperature, systolic/diastolic/mean arterial blood pressure and respiration rate) as model inputs.",
    "Two further open datasets are supported optionally for extension: MIMIC-IV (credentialed) for chronic-disease cohorts identified by diagnosis codes, and PPG-DaLiA for a wrist-wearable heart-rate front-end. Full provenance, licences and dataset DOIs are listed in the appendix.",
  ],
  m_pre: [
    "Each patient record is forward/backward filled and median-imputed within patient. We then slide a window of W hours over the sequence; a window is labelled positive if a deterioration onset occurs within the subsequent L hours, framing the task as prediction before clinical recognition. Default values (W = 8, L = 6) are set in the configuration file and reported for reproducibility.",
    "Data are split into training, validation and test partitions with stratification on the label, and per-feature standardisation statistics are estimated on the training partition only to avoid leakage.",
  ],
  m_model: [
    "The detector is a gated recurrent unit network that maps a window of standardised vital signs to a single deterioration-risk logit through the final hidden state, followed by a small fully-connected head with layer normalisation and dropout. A long short-term memory variant is selectable. The GRU update and risk-score equations are provided in the figure/equation appendix.",
  ],
  m_train: [
    "Models are trained with the Adam optimiser and weighted binary cross-entropy, where the positive-class weight is set automatically from the training prevalence to counter class imbalance. Early stopping monitors validation loss. All hyperparameters and the random seed are recorded in the configuration file.",
  ],
  m_eval: [
    "On the held-out test partition we report discrimination (AUROC, AUPRC) and operating-point metrics at a configurable alarm threshold: sensitivity (recall), specificity, precision, F1 and false-alarm rate, together with the confusion matrix. These values are written to a machine-readable metrics file and are the source of every number in the Results section.",
  ],
  m_syn: [
    "No open dataset links tele-nursing consultation records, patient-reported outcomes, nurse response times and adherence to the same patients whose vital signs we model. To demonstrate the integration workflow only, we generate this layer with a transparent, seeded stochastic simulator. Every record is stamped as synthetic, and these data are never used to compute clinical performance and never reported as outcomes.",
  ],
  m_syn_warn: "Note: the tele-nursing/PRO/adherence layer is SYNTHETIC (simulated). It is used solely to illustrate data flow and is never reported as a clinical result.",
  m_ethics: [
    "This work is a secondary analysis of de-identified, publicly released datasets used under their respective data-use agreements; such use is typically classified as non-human-subjects research. The synthetic layer involves no human subjects and requires no ethical approval. Investigators should confirm local institutional requirements before submission.",
  ],
  results_warn: "Results placeholders below are intentionally empty. Run the pipeline (see setup.md) and paste the values from results/metrics.json. Do NOT carry over numbers from any earlier abstract.",
  results: [
    "After running the pipeline on the open dataset, summarise the held-out test performance here. State the test-set size and positive prevalence, then the discrimination and operating-point metrics from the table below, and describe the false-alarm behaviour relative to a threshold-based baseline if computed.",
  ],
  tbl_caption: "Table 1. Held-out test performance (populated from results/metrics.json).",
  fig_note: "Figures 1-2 are conceptual diagrams (see figure_prompts.md). Figures 3-5 (ROC, precision-recall, confusion matrix) are generated from the real model run by src/eval/plot_figures.py and must not be image-generated.",
  discussion: [
    "Interpret the model's discrimination and its operating point in clinical terms: what sensitivity is achievable at a tolerable false-alarm rate, and how prioritised alerts could shorten nurse response in a tele-care workflow. Relate the findings to prior nurse-led telehealth evidence and to machine-learning early-warning literature.",
    "Emphasise reproducibility as a contribution in its own right: because the evaluation runs on open data with released code, the claims are independently checkable, which is uncommon in this application area.",
  ],
  limits: [
    "First, deterioration is operationalised using the PhysioNet 2019 onset label, a validated but specific physiologic endpoint that serves as a proxy/testbed rather than a disease-specific chronic-care outcome; extension to MIMIC-IV chronic cohorts is the natural next step. Second, the wearable and tele-nursing layers are demonstrated rather than clinically validated; the tele-nursing layer is synthetic. Third, results from public datasets require prospective validation before clinical deployment.",
  ],
  conclusion: [
    "We presented a reproducible, open-data evaluation of an RNN early-deterioration detector embedded in a nurse-led tele-monitoring framework, with a transparently-labelled synthetic integration layer. The approach offers an honest, checkable foundation for AI-assisted remote chronic care and a clear path to clinically-grounded extension.",
  ],
  avail: "All code is available in the accompanying repository (see README.md and setup.md). Real datasets are public: PhysioNet/CinC 2019 (DOI 10.13026/v64v-d857), MIMIC-IV (DOI 10.13026/6mm1-ek67, credentialed), PPG-DaLiA (DOI 10.24432/C53890). The synthetic tele-nursing layer is reproducible from the seeded generator. No proprietary patient data were used.",
  refs: REFS,
};

// ---------------- INDONESIAN ----------------
const ID = {
  title: "Kerangka Terintegrasi Tele-Keperawatan dan AI Berbasis Wearable untuk Deteksi Dini Perburukan pada Penyakit Kronis: Studi Reproducible pada Dataset Fisiologis Terbuka",
  target: "Disiapkan untuk JMIR mHealth and uHealth / International Journal of Medical Informatics (sesuaikan format dengan jurnal terpilih) — versi Bahasa Indonesia untuk dokumentasi/jurnal nasional Sinta",
  t: { metric: "Metrik", value: "Nilai (dari results/metrics.json)", sens: "Sensitivitas (recall)", spec: "Spesifisitas", far: "Laju alarm palsu" },
  s: { abstract: "Abstrak", keywords: "Kata kunci", intro: "1. Pendahuluan", related: "2. Tinjauan Pustaka",
    methods: "3. Metode", m_data: "3.1 Dataset", m_pre: "3.2 Prapemrosesan dan Windowing", m_model: "3.3 Arsitektur Model",
    m_train: "3.4 Pelatihan", m_eval: "3.5 Evaluasi", m_syn: "3.6 Lapisan Integrasi Tele-Keperawatan Sintetis", m_ethics: "3.7 Etika dan Tata Kelola Data",
    results: "4. Hasil", discussion: "5. Pembahasan", limits: "6. Keterbatasan", conclusion: "7. Simpulan",
    avail: "Ketersediaan Data dan Kode", refs: "Daftar Pustaka" },
  abstract: "Latar belakang: Pemantauan jarak jauh berkelanjutan pada pasien penyakit kardiovaskular dan metabolik kronis berpotensi mendeteksi perburukan klinis lebih awal dan mendukung tele-perawatan yang dipimpin perawat. Namun, banyak kerangka yang diusulkan tidak dievaluasi pada data terbuka sehingga sulit direproduksi. Tujuan: Kami menyajikan dan mengevaluasi secara terbuka kerangka terintegrasi tele-keperawatan dan berorientasi wearable, di mana jaringan saraf rekuren mendeteksi perburukan fisiologis dini dari deret waktu tanda vital multivariat. Metode: Menggunakan dataset terbuka PhysioNet/Computing in Cardiology 2019, deteksi dini perburukan dirumuskan sebagai prediksi onset perburukan fisiologis tervalidasi dalam rentang waktu tertentu dari jendela geser tanda vital per jam (denyut jantung, saturasi oksigen, suhu, tekanan darah, pernapasan). Klasifikasi gated recurrent unit (GRU) dilatih dengan pembobotan ketidakseimbangan kelas dan dievaluasi pada subset uji terpisah. Lapisan sintetis berlabel jelas hanya digunakan untuk mendemonstrasikan alur integrasi tele-keperawatan. Hasil: [[JALANKAN PIPELINE]] — laporkan AUROC, AUPRC, sensitivitas, spesifisitas dan laju alarm palsu dari results/metrics.json. Simpulan: Kerangka ini menyediakan dasar yang reproducible dan dapat dievaluasi terbuka untuk pemantauan jarak jauh berbantuan AI yang dipimpin perawat; seluruh kode dan sumber data bersifat publik.",
  keywords: "tele-keperawatan; sensor wearable; penyakit kronis; perburukan klinis; jaringan saraf rekuren; reproducibility; data terbuka",
  intro: [
    "Penyakit kardiovaskular dan metabolik kronis membebani sistem kesehatan secara berkelanjutan dan menjadi pendorong utama rawat inap ulang yang dapat dicegah. Model perawatan jarak jauh, di mana perawat mengoordinasikan pemantauan dan intervensi di luar rumah sakit, dikaitkan dengan perbaikan kualitas hidup dan manajemen mandiri pada beberapa tinjauan sistematis.",
    "Dua arus teknologi melatarbelakangi penelitian ini. Pertama, biosensor wearable kini menyediakan aliran data denyut jantung, saturasi oksigen, dan aktivitas yang nyaris berkelanjutan. Kedua, model sekuens seperti jaringan saraf rekuren dapat mempelajari pola temporal spesifik pasien yang tidak dapat ditangkap skor peringatan dini tetap. Namun, kelemahan metodologis yang berulang adalah kerangka yang diusulkan sering dideskripsikan tanpa evaluasi pada data terbuka yang dapat direproduksi.",
    "Studi ini menjawab kesenjangan tersebut secara langsung. Alih-alih melaporkan kohort milik satu institusi, kami mengoperasionalkan tugas deteksi perburukan pada dataset fisiologis terbuka sehingga setiap angka yang dilaporkan dapat dihasilkan ulang oleh pembaca mana pun dari kode yang disertakan. Kami juga menyatakan secara eksplisit komponen mana yang merupakan data sekunder nyata dan mana yang sintetis.",
  ],
  related: [
    "Telehealth untuk kondisi kronis telah dievaluasi pada beberapa tinjauan sistematis, dengan model yang dipimpin perawat menunjukkan manfaat pada kepatuhan dan luaran yang dilaporkan pasien, sembari menyoroti heterogenitas endpoint. Riset penerimaan menegaskan bahwa kesesuaian alur kerja dan kualitas alarm sangat memengaruhi adopsi di garis depan.",
    "Di sisi pemodelan, sistem peringatan dini berbasis pembelajaran mesin berulang kali mengungguli skor berbasis ambang untuk perburukan yang mengancam, dan arsitektur rekuren cocok untuk deret fisiologis yang tidak teratur. Studi berbasis wearable juga menunjukkan sinyal multimodal dapat menandai risiko perburukan pada pasien rawat jalan. Kontribusi kami adalah memadukan detektor perburukan RNN dengan evaluasi data terbuka yang reproducible dan lapisan integrasi tele-keperawatan yang dilabeli secara transparan.",
  ],
  m_data: [
    "Data pemodelan utama adalah dataset terbuka PhysioNet/Computing in Cardiology 2019 yang menyediakan rekaman tanda vital multivariat per jam dengan label onset perburukan fisiologis tervalidasi. Kami menggunakan tujuh tanda vital yang dapat diperoleh wearable (denyut jantung, saturasi oksigen, suhu, tekanan darah sistolik/diastolik/arteri rata-rata, dan laju pernapasan) sebagai masukan model.",
    "Dua dataset terbuka lain didukung secara opsional untuk perluasan: MIMIC-IV (berkredensial) untuk kohort penyakit kronis berdasarkan kode diagnosis, dan PPG-DaLiA untuk front-end denyut jantung berbasis wearable pergelangan tangan. Provenans lengkap, lisensi, dan DOI dataset tercantum dalam lampiran.",
  ],
  m_pre: [
    "Setiap rekaman pasien diisi maju/mundur dan diimputasi median dalam pasien. Kami kemudian menggeser jendela selebar W jam; sebuah jendela dilabeli positif jika onset perburukan terjadi dalam L jam berikutnya, sehingga tugas dirumuskan sebagai prediksi sebelum pengenalan klinis. Nilai default (W = 8, L = 6) ditetapkan pada berkas konfigurasi dan dilaporkan demi reproduksibilitas.",
    "Data dibagi menjadi partisi latih, validasi, dan uji dengan stratifikasi pada label, dan statistik standardisasi per fitur diestimasi hanya pada partisi latih untuk menghindari kebocoran data.",
  ],
  m_model: [
    "Detektor merupakan jaringan gated recurrent unit yang memetakan jendela tanda vital terstandardisasi menjadi satu logit risiko perburukan melalui keadaan tersembunyi akhir, diikuti kepala terhubung penuh kecil dengan normalisasi lapisan dan dropout. Varian long short-term memory dapat dipilih. Persamaan pembaruan GRU dan skor risiko disediakan pada lampiran gambar/persamaan.",
  ],
  m_train: [
    "Model dilatih dengan pengoptimal Adam dan binary cross-entropy berbobot, dengan bobot kelas positif ditetapkan otomatis dari prevalensi pelatihan untuk menanggulangi ketidakseimbangan kelas. Penghentian dini memantau rugi validasi. Seluruh hiperparameter dan seed acak dicatat pada berkas konfigurasi.",
  ],
  m_eval: [
    "Pada partisi uji terpisah kami melaporkan diskriminasi (AUROC, AUPRC) dan metrik titik operasi pada ambang alarm yang dapat dikonfigurasi: sensitivitas (recall), spesifisitas, presisi, F1, dan laju alarm palsu, beserta matriks konfusi. Nilai-nilai ini ditulis ke berkas metrik yang dapat dibaca mesin dan menjadi sumber setiap angka pada bagian Hasil.",
  ],
  m_syn: [
    "Tidak ada dataset terbuka yang menautkan catatan konsultasi tele-keperawatan, luaran yang dilaporkan pasien, waktu respons perawat, dan kepatuhan pada pasien yang sama dengan tanda vital yang kami modelkan. Untuk mendemonstrasikan alur integrasi semata, kami membangkitkan lapisan ini dengan simulator stokastik transparan berbasis seed. Setiap rekaman ditandai sebagai sintetis, dan data ini tidak pernah digunakan untuk menghitung kinerja klinis serta tidak pernah dilaporkan sebagai luaran.",
  ],
  m_syn_warn: "Catatan: lapisan tele-keperawatan/PRO/kepatuhan bersifat SINTETIS (simulasi). Hanya digunakan untuk mengilustrasikan aliran data dan tidak pernah dilaporkan sebagai hasil klinis.",
  m_ethics: [
    "Penelitian ini merupakan analisis sekunder atas dataset publik yang telah dianonimkan dan digunakan sesuai perjanjian penggunaan data masing-masing; penggunaan semacam ini umumnya tergolong penelitian bukan-subjek-manusia. Lapisan sintetis tidak melibatkan subjek manusia dan tidak memerlukan persetujuan etik. Peneliti perlu mengonfirmasi ketentuan institusi setempat sebelum pengajuan.",
  ],
  results_warn: "Placeholder hasil di bawah sengaja dikosongkan. Jalankan pipeline (lihat setup.md) dan tempel nilai dari results/metrics.json. JANGAN memindahkan angka dari abstrak sebelumnya.",
  results: [
    "Setelah menjalankan pipeline pada dataset terbuka, ringkas kinerja uji terpisah di sini. Sebutkan ukuran set uji dan prevalensi positif, kemudian metrik diskriminasi dan titik operasi dari tabel di bawah, dan jelaskan perilaku alarm palsu relatif terhadap baseline berbasis ambang bila dihitung.",
  ],
  tbl_caption: "Tabel 1. Kinerja uji terpisah (diisi dari results/metrics.json).",
  fig_note: "Gambar 1-2 adalah diagram konseptual (lihat figure_prompts.md). Gambar 3-5 (ROC, precision-recall, matriks konfusi) dihasilkan dari run model nyata oleh src/eval/plot_figures.py dan tidak boleh dibuat lewat image generator.",
  discussion: [
    "Tafsirkan diskriminasi model dan titik operasinya secara klinis: sensitivitas yang dapat dicapai pada laju alarm palsu yang dapat ditoleransi, dan bagaimana alarm berprioritas dapat mempersingkat respons perawat dalam alur tele-perawatan. Kaitkan temuan dengan bukti telehealth yang dipimpin perawat dan literatur peringatan dini berbasis pembelajaran mesin.",
    "Tekankan reproduksibilitas sebagai kontribusi tersendiri: karena evaluasi berjalan pada data terbuka dengan kode yang dirilis, klaim dapat diperiksa secara independen, hal yang jarang pada bidang aplikasi ini.",
  ],
  limits: [
    "Pertama, perburukan dioperasionalkan memakai label onset PhysioNet 2019, endpoint fisiologis tervalidasi namun spesifik yang berfungsi sebagai proksi/uji-coba alih-alih luaran perawatan kronis spesifik penyakit; perluasan ke kohort kronis MIMIC-IV merupakan langkah lanjutan alami. Kedua, lapisan wearable dan tele-keperawatan didemonstrasikan, bukan divalidasi klinis; lapisan tele-keperawatan bersifat sintetis. Ketiga, hasil dari dataset publik memerlukan validasi prospektif sebelum penerapan klinis.",
  ],
  conclusion: [
    "Kami menyajikan evaluasi data-terbuka yang reproducible atas detektor perburukan dini berbasis RNN yang tertanam dalam kerangka pemantauan jarak jauh yang dipimpin perawat, dengan lapisan integrasi sintetis berlabel transparan. Pendekatan ini menawarkan fondasi yang jujur dan dapat diperiksa untuk perawatan kronis jarak jauh berbantuan AI serta jalur jelas menuju perluasan yang berbasis klinis.",
  ],
  avail: "Seluruh kode tersedia pada repositori terlampir (lihat README.md dan setup.md). Dataset nyata bersifat publik: PhysioNet/CinC 2019 (DOI 10.13026/v64v-d857), MIMIC-IV (DOI 10.13026/6mm1-ek67, berkredensial), PPG-DaLiA (DOI 10.24432/C53890). Lapisan tele-keperawatan sintetis dapat direproduksi dari generator berbasis seed. Tidak ada data pasien milik pribadi yang digunakan.",
  refs: REFS,
};

Packer.toBuffer(buildDoc(EN)).then(b => fs.writeFileSync("manuscript_EN.docx", b)).then(() => console.log("wrote manuscript_EN.docx"));
Packer.toBuffer(buildDoc(ID)).then(b => fs.writeFileSync("manuscript_ID.docx", b)).then(() => console.log("wrote manuscript_ID.docx"));
