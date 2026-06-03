#!/usr/bin/env python3
"""
generate_synthetic_telenursing.py
----------------------------------
=====================================================================
 !!  ALL DATA PRODUCED BY THIS SCRIPT IS SYNTHETIC (SIMULATED).      !!
 !!  It does NOT come from real patients and MUST NEVER be reported  !!
 !!  as a clinical outcome. Every row is stamped data_type=SYNTHETIC.!!
 !!  Purpose: demonstrate the tele-nursing INTEGRATION layer / data  !!
 !!  schema only (PRO, nurse response, adherence) which no open      !!
 !!  dataset provides. See appendix/data_provenance.md.              !!
=====================================================================

The generator uses transparent, documented stochastic rules so the
synthetic process is fully reproducible and auditable.
"""
import os
import yaml
import numpy as np
import pandas as pd


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def main():
    cfg = load_cfg()
    s = cfg["synthetic"]
    rng = np.random.default_rng(cfg["seed"])
    n = s["n_patients"]
    days = s["monitoring_days"]

    # --- patient registry (synthetic) ---
    patients = pd.DataFrame({
        "patient_id": [f"SYN-{i:04d}" for i in range(n)],
        "age": rng.integers(55, 90, n),
        "sex": rng.choice(["F", "M"], n),
        "condition": rng.choice(
            ["cardiovascular", "diabetes", "both"], n, p=[0.45, 0.35, 0.20]
        ),
        "data_type": "SYNTHETIC",
        "source": "simulated_generator_v1",
    })

    # --- daily tele-nursing interaction log (synthetic) ---
    rows = []
    for pid in patients["patient_id"]:
        # baseline adherence + slow random walk
        adh = rng.uniform(0.6, 0.95)
        for day in range(days):
            adh = float(np.clip(adh + rng.normal(0, 0.02), 0.3, 1.0))
            contacted = rng.random() < 0.15  # ~ every 6-7 days a teleconsult
            pro_score = int(np.clip(rng.normal(70, 12), 0, 100))  # patient-reported outcome
            # nurse response time (minutes) to an AI-generated alert, if any
            alert = rng.random() < 0.05
            resp_min = float(np.clip(rng.normal(18, 7), 2, 120)) if alert else np.nan
            rows.append({
                "patient_id": pid,
                "day": day,
                "teleconsult": int(contacted),
                "pro_score": pro_score,
                "ai_alert": int(alert),
                "nurse_response_min": resp_min,
                "adherence": round(adh, 3),
                "data_type": "SYNTHETIC",
                "source": "simulated_generator_v1",
            })
    log = pd.DataFrame(rows)

    out = s["out_dir"]
    os.makedirs(out, exist_ok=True)
    patients.to_csv(f"{out}/synthetic_patients.csv", index=False)
    log.to_csv(f"{out}/synthetic_telenursing_log.csv", index=False)

    # provenance stamp
    with open(f"{out}/_SYNTHETIC_README.txt", "w") as f:
        f.write(
            "DATA TYPE: SYNTHETIC (simulated). NOT real patients.\n"
            "Do not report as clinical results. Integration-layer demo only.\n"
            f"Generator: simulated_generator_v1, seed={cfg['seed']}\n"
            f"patients={n}, monitoring_days={days}\n"
        )
    print(f"[done] wrote SYNTHETIC tele-nursing data to {out}/ ({len(log)} rows)")
    print("       Reminder: this layer is for workflow demonstration only.")


if __name__ == "__main__":
    main()
