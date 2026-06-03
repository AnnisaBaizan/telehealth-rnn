#!/usr/bin/env python3
"""
download_data.py
----------------
Downloads the REAL, openly-available PhysioNet/Computing in Cardiology
Challenge 2019 training data (early prediction of clinical deterioration /
sepsis onset from hourly vital-sign time series).

Data provenance (see appendix/data_provenance.md):
  - Source : PhysioNet (https://physionet.org/content/challenge-2019/1.0.0/)
  - Dataset DOI : 10.13026/v64v-d857
  - Paper DOI   : 10.1097/CCM.0000000000004145
  - License : Open Data Commons Open Database License v1.0
  - Label = "REAL secondary data" (not synthetic)

The two training cohorts (training_setA, training_setB) are public and do
NOT require credentialed access. MIMIC-IV and PPG-DaLiA require separate
manual / credentialed download (instructions printed below).
"""
import os
import sys
import zipfile
import argparse
import requests
from tqdm import tqdm

# Official PhysioNet mirror for the 2019 challenge training sets.
URLS = {
    "training_setA": "https://archive.physionet.org/users/shared/challenge-2019/training_setA.zip",
    "training_setB": "https://archive.physionet.org/users/shared/challenge-2019/training_setB.zip",
}


def download(url: str, dest: str) -> None:
    if os.path.exists(dest):
        print(f"[skip] already present: {dest}")
        return
    print(f"[get ] {url}")
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        with open(dest, "wb") as f, tqdm(
            total=total, unit="B", unit_scale=True, desc=os.path.basename(dest)
        ) as bar:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                bar.update(len(chunk))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/raw/physionet2019")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    try:
        for name, url in URLS.items():
            zpath = os.path.join(args.out, f"{name}.zip")
            download(url, zpath)
            print(f"[unzip] {zpath}")
            with zipfile.ZipFile(zpath) as z:
                z.extractall(args.out)
        print("\n[done] PhysioNet 2019 training data ready under:", args.out)
    except Exception as e:  # noqa
        print(f"\n[error] automatic download failed: {e}")
        print("Manually download the training sets from:")
        print("  https://physionet.org/content/challenge-2019/1.0.0/")
        print(f"and unzip the per-patient .psv files into: {args.out}")

    print(
        "\n--- Optional credentialed datasets (download manually) ---\n"
        "MIMIC-IV (chronic-disease cohorts via ICD codes; vital-sign series):\n"
        "  https://physionet.org/content/mimiciv/  (requires CITI training + credentialing)\n"
        "  dataset DOI 10.13026/6mm1-ek67 | paper DOI 10.1038/s41597-022-01899-x\n"
        "PPG-DaLiA (wearable PPG/accelerometer for HR estimation front-end):\n"
        "  https://archive.ics.uci.edu/dataset/495/ppg+dalia  (CC BY 4.0)\n"
        "  dataset DOI 10.24432/C53890 | paper DOI 10.3390/s19143079\n"
    )


if __name__ == "__main__":
    main()
