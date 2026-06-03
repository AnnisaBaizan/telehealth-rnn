#!/usr/bin/env python3
"""
download_data.py
----------------
Downloads the REAL, openly-available PhysioNet/Computing in Cardiology
Challenge 2019 training data (early prediction of clinical deterioration /
sepsis onset from hourly vital-sign time series).

Data provenance (see appendix/data_provenance.md):
  - Source : https://physionet.org/content/challenge-2019/1.0.0/  (Open Access)
  - Files  : training/training_setA/*.psv and training/training_setB/*.psv
             (40,336 patients total, ~42 MB)
  - Dataset DOI : 10.13026/v64v-d857   | Paper DOI : 10.1097/CCM.0000000000004145
  - License     : Creative Commons Attribution 4.0 (CC BY 4.0)
  - Label       : "REAL secondary data" (not synthetic)

Method: PhysioNet's officially-documented recursive mirror with `wget`.
This is the reliable way to pull an Open-Access PhysioNet file tree; the old
`archive.physionet.org/users/shared/...` ZIP endpoints are gone (404).

macOS does NOT ship wget. Install it once with Homebrew:  brew install wget
(Linux usually has it; otherwise `sudo apt install wget`.)
"""
import os
import sys
import glob
import shutil
import argparse
import subprocess

BASE = "https://physionet.org/files/challenge-2019/1.0.0/training/"


def have(cmd):
    return shutil.which(cmd) is not None


def run_wget(out_dir):
    # -r recursive, -np no-parent, -nH no host dir, --cut-dirs strips the
    # files/challenge-2019/1.0.0 prefix, -N timestamping, -c continue,
    # -R index.html skips the directory-listing pages.
    cmd = [
        "wget", "-r", "-N", "-c", "-np", "-nH",
        "--cut-dirs=3", "-R", "index.html*",
        "-P", out_dir, BASE,
    ]
    print("[run ]", " ".join(cmd))
    return subprocess.call(cmd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/raw/physionet2019")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    if not have("wget"):
        print("[error] `wget` not found.")
        if sys.platform == "darwin":
            print("  macOS: install it with ->  brew install wget")
        else:
            print("  Linux: install it with ->  sudo apt install wget")
        print("\nOr download manually in a browser from:")
        print("  https://physionet.org/content/challenge-2019/1.0.0/")
        print(f"and place the training_setA / training_setB .psv files under: {args.out}")
        sys.exit(1)

    rc = run_wget(args.out)
    n = len(glob.glob(os.path.join(args.out, "**", "*.psv"), recursive=True))
    if rc == 0 and n > 0:
        print(f"\n[done] {n} .psv files under {args.out}")
        print("Next: python src/data_ingest/preprocess.py")
    else:
        print(f"\n[warn] wget exit={rc}, found {n} .psv files.")
        print("If 0 files, run this exact command yourself:")
        print(f"  wget -r -N -c -np -nH --cut-dirs=3 -R 'index.html*' -P {args.out} {BASE}")

    print(
        "\n--- Optional credentialed / extension datasets (download manually) ---\n"
        "MIMIC-IV (chronic-disease cohorts via ICD codes; vital-sign series):\n"
        "  https://physionet.org/content/mimiciv/  (requires CITI training + credentialing)\n"
        "  dataset DOI 10.13026/6mm1-ek67 | paper DOI 10.1038/s41597-022-01899-x\n"
        "PPG-DaLiA (wearable PPG/accelerometer for HR estimation front-end):\n"
        "  https://archive.ics.uci.edu/dataset/495/ppg+dalia  (CC BY 4.0)\n"
        "  dataset DOI 10.24432/C53890 | paper DOI 10.3390/s19143079\n"
    )


if __name__ == "__main__":
    main()
