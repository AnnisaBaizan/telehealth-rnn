# DATA PROVENANCE — real vs synthetic (Lampiran A)

Every data source used in this study, with explicit labels per your request:
`REAL` (collected by others, reused as secondary data) vs `SYNTHETIC`
(simulated by us). No primary human-subject data is collected in Pathway D.

| # | Dataset / artifact | Type | Modality | How obtained | Licence | DOI / accession |
|---|--------------------|------|----------|--------------|---------|-----------------|
| 1 | PhysioNet/CinC Challenge 2019 (early deterioration / sepsis onset) | **REAL — secondary** | Hourly multivariate vitals (HR, O2Sat, Temp, SBP, MAP, DBP, Resp) + onset label | `src/data_ingest/download_data.py` from physionet.org (open) | ODC-ODbL v1.0 | dataset 10.13026/v64v-d857 · paper 10.1097/CCM.0000000000004145 |
| 2 | MIMIC-IV (optional, chronic-disease cohorts) | **REAL — secondary (credentialed)** | EHR vital-sign time series + ICD diagnoses | Manual; requires CITI training + PhysioNet credentialing | PhysioNet Credentialed Health Data License 1.5.0 | dataset 10.13026/6mm1-ek67 · paper 10.1038/s41597-022-01899-x |
| 3 | PPG-DaLiA (optional, wearable front-end) | **REAL — secondary** | Wrist/chest PPG + 3D-accelerometer + ECG HR ground truth | Manual from UCI repo | CC BY 4.0 | dataset 10.24432/C53890 · paper 10.3390/s19143079 |
| 4 | PhysioNet platform | **REAL — infrastructure** | — | — | — | 10.1161/01.CIR.101.23.e215 |
| 5 | Tele-nursing interaction log | **SYNTHETIC** | Teleconsult flags, nurse response time | `src/synthetic/generate_synthetic_telenursing.py` (seed=42) | n/a (generated) | n/a — `data_type=SYNTHETIC` |
| 6 | Patient-Reported Outcomes (PRO) | **SYNTHETIC** | Daily PRO score 0–100 | same generator | n/a | n/a — `data_type=SYNTHETIC` |
| 7 | Medication / monitoring adherence | **SYNTHETIC** | Daily adherence 0–1 (random walk) | same generator | n/a | n/a — `data_type=SYNTHETIC` |

## Why a synthetic layer exists
No open dataset provides linked tele-nursing consultation records, PROs,
nurse response times, and adherence for the same patients whose vital-sign
streams we model. To demonstrate the **integration workflow** (how AI alerts
would route to a nurse and how PRO/adherence attach to a patient), we simulate
that layer with a transparent, seeded generator. It is **never** used to
compute clinical performance and is **never** reported as an outcome.

## Operational definition of "deterioration"
In Pathway D, a deterioration event = the Sepsis-3 onset label from PhysioNet
2019, a validated physiologic deterioration endpoint. This is a **proxy /
testbed** for the general early-deterioration task and is disclosed as such in
the manuscript Limitations. If you obtain MIMIC-IV credentialing, you can
re-run with cardiovascular/diabetic chronic cohorts (ICD-filtered) for an
on-topic endpoint.

## Ethics
- Items 1–4: de-identified, publicly released secondary data → typically
  exempt / non-human-subjects research; cite each dataset's data-use agreement.
- Items 5–7: fully synthetic → no human subjects, no IRB required, but must be
  labelled synthetic in every table/figure.
