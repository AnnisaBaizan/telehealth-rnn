#!/usr/bin/env python3
"""
preprocess.py
-------------
Turns the raw PhysioNet 2019 per-patient .psv files (one row per hour) into
fixed-length windowed sequences for early-deterioration detection.

For each patient we slide a window of `window_hours`. A window is labelled
positive (1) if a deterioration onset occurs within the next
`lead_time_hours`; otherwise 0. This frames the task as "predict
deterioration BEFORE it is clinically recognised" — the core claim of the
manuscript, evaluated on REAL secondary data.

Outputs: data/processed/{X_train,y_train,X_val,y_val,X_test,y_test}.npy
"""
import os
import glob
import yaml
import numpy as np
import pandas as pd
from tqdm import tqdm
from sklearn.model_selection import train_test_split


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def read_patient(psv_path, feats, label_col):
    df = pd.read_csv(psv_path, sep="|")
    # keep only needed columns that exist
    cols = [c for c in feats if c in df.columns]
    if label_col not in df.columns or not cols:
        return None
    # forward/backward fill within patient, then column median, then 0
    x = df[cols].ffill().bfill()
    x = x.fillna(x.median(numeric_only=True)).fillna(0.0)
    y = df[label_col].fillna(0).astype(int).values
    return x[cols].values.astype(np.float32), y, cols


def make_windows(x, y, window, lead):
    """Return list of (window_array, label)."""
    out = []
    n = len(x)
    for t in range(window, n):
        seq = x[t - window:t]                      # past `window` hours
        future = y[t:min(t + lead, n)]             # next `lead` hours
        label = int(future.max() if len(future) else 0)
        out.append((seq, label))
    return out


def main():
    cfg = load_cfg()
    np.random.seed(cfg["seed"])
    d = cfg["data"]
    raw_dir = d["raw_dir"]
    feats = d["feature_columns"]
    window = d["window_hours"]
    lead = d["lead_time_hours"]

    psv_files = sorted(glob.glob(os.path.join(raw_dir, "**", "*.psv"), recursive=True))
    if not psv_files:
        raise SystemExit(
            f"No .psv files in {raw_dir}. Run src/data_ingest/download_data.py first."
        )

    X, Y, used_cols = [], [], None
    for p in tqdm(psv_files, desc="patients"):
        res = read_patient(p, feats, d["label_column"])
        if res is None:
            continue
        x, y, cols = res
        used_cols = cols
        for seq, label in make_windows(x, y, window, lead):
            X.append(seq)
            Y.append(label)

    X = np.stack(X)            # (N, window, F)
    Y = np.array(Y, dtype=np.int64)
    print(f"windows={X.shape}, positives={Y.mean():.4f}, features={used_cols}")

    # normalise per feature using TRAIN statistics only (fit after split)
    X_tmp, X_test, y_tmp, y_test = train_test_split(
        X, Y, test_size=d["test_size"], stratify=Y, random_state=cfg["seed"]
    )
    val_rel = d["val_size"] / (1 - d["test_size"])
    X_train, X_val, y_train, y_val = train_test_split(
        X_tmp, y_tmp, test_size=val_rel, stratify=y_tmp, random_state=cfg["seed"]
    )

    mu = X_train.reshape(-1, X_train.shape[-1]).mean(0)
    sd = X_train.reshape(-1, X_train.shape[-1]).std(0) + 1e-6
    norm = lambda a: ((a - mu) / sd).astype(np.float32)

    out = d["processed_dir"]
    os.makedirs(out, exist_ok=True)
    np.save(f"{out}/X_train.npy", norm(X_train))
    np.save(f"{out}/y_train.npy", y_train)
    np.save(f"{out}/X_val.npy", norm(X_val))
    np.save(f"{out}/y_val.npy", y_val)
    np.save(f"{out}/X_test.npy", norm(X_test))
    np.save(f"{out}/y_test.npy", y_test)
    np.save(f"{out}/feature_mean.npy", mu)
    np.save(f"{out}/feature_std.npy", sd)
    with open(f"{out}/feature_columns.txt", "w") as f:
        f.write("\n".join(used_cols))
    print(f"[done] saved tensors to {out}")


if __name__ == "__main__":
    main()
