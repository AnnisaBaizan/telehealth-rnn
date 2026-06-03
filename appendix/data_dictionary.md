# DATA DICTIONARY (Lampiran B)

## Real model inputs (PhysioNet 2019 .psv → processed tensors)

| Field | Unit | Source col | Role |
|-------|------|-----------|------|
| HR | bpm | HR | input feature |
| O2Sat | % | O2Sat | input feature |
| Temp | °C | Temp | input feature |
| SBP | mmHg | SBP | input feature |
| MAP | mmHg | MAP | input feature |
| DBP | mmHg | DBP | input feature |
| Resp | breaths/min | Resp | input feature |
| SepsisLabel | 0/1 | SepsisLabel | deterioration label (per-hour) |

Processed tensors (`data/processed/`):
- `X_{train,val,test}.npy` — shape `(N, window_hours, n_features)`, z-scored on train stats
- `y_{train,val,test}.npy` — shape `(N,)`, 1 if deterioration within `lead_time_hours`
- `feature_mean.npy`, `feature_std.npy` — train normalisation stats

## Synthetic tele-nursing layer (`data/processed/synthetic/`) — ALL SYNTHETIC

`synthetic_patients.csv`

| Field | Type | Description |
|-------|------|-------------|
| patient_id | str | `SYN-XXXX` |
| age | int | 55–90 |
| sex | str | F/M |
| condition | str | cardiovascular / diabetes / both |
| data_type | str | always `SYNTHETIC` |
| source | str | `simulated_generator_v1` |

`synthetic_telenursing_log.csv`

| Field | Type | Description |
|-------|------|-------------|
| patient_id | str | FK to patients |
| day | int | 0..monitoring_days-1 |
| teleconsult | 0/1 | nurse teleconsult that day |
| pro_score | int | patient-reported outcome 0–100 |
| ai_alert | 0/1 | AI-generated alert raised |
| nurse_response_min | float | minutes to respond (NaN if no alert) |
| adherence | float | 0–1 daily adherence (random walk) |
| data_type | str | always `SYNTHETIC` |
| source | str | `simulated_generator_v1` |

## Result artifacts (`results/`)
- `metrics.json` — AUROC, AUPRC, sensitivity, specificity, precision, F1, false-alarm rate, confusion matrix
- `curves.npz` — ROC/PR curve points + raw probabilities for figures
