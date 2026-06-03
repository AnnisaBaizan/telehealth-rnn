#!/usr/bin/env python3
"""
train.py
--------
Trains the recurrent deterioration detector on the preprocessed PhysioNet
2019 tensors. Handles class imbalance, early stopping, and saves the best
checkpoint to results/model.pt.

Run from project root:  python -m src.models.train
"""
import os
import sys
import yaml
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.model import build_model  # noqa: E402


def load_cfg(path="config.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def get_device(pref):
    if pref == "cpu":
        return torch.device("cpu")
    if pref == "cuda" or (pref == "auto" and torch.cuda.is_available()):
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device("cpu")


def load_split(proc, name):
    X = np.load(f"{proc}/X_{name}.npy")
    y = np.load(f"{proc}/y_{name}.npy")
    return torch.tensor(X), torch.tensor(y, dtype=torch.float32)


def main():
    cfg = load_cfg()
    torch.manual_seed(cfg["seed"])
    np.random.seed(cfg["seed"])
    proc = cfg["data"]["processed_dir"]
    device = get_device(cfg["train"]["device"])
    print("device:", device)

    Xtr, ytr = load_split(proc, "train")
    Xva, yva = load_split(proc, "val")
    n_features = Xtr.shape[-1]

    train_dl = DataLoader(TensorDataset(Xtr, ytr),
                          batch_size=cfg["train"]["batch_size"], shuffle=True)
    val_dl = DataLoader(TensorDataset(Xva, yva),
                        batch_size=cfg["train"]["batch_size"])

    model = build_model(cfg, n_features).to(device)

    pos_weight = None
    if cfg["train"]["pos_weight_auto"]:
        pos = ytr.sum().item()
        neg = len(ytr) - pos
        pos_weight = torch.tensor([neg / max(pos, 1)], device=device)
        print(f"pos_weight={pos_weight.item():.2f}")
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    opt = torch.optim.Adam(model.parameters(), lr=cfg["train"]["lr"],
                           weight_decay=cfg["train"]["weight_decay"])

    best_val, bad, best_state = float("inf"), 0, None
    os.makedirs(cfg["eval"]["results_dir"], exist_ok=True)
    for epoch in range(cfg["train"]["epochs"]):
        model.train()
        tr_loss = 0.0
        for xb, yb in train_dl:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            opt.step()
            tr_loss += loss.item() * len(xb)
        tr_loss /= len(train_dl.dataset)

        model.eval()
        va_loss = 0.0
        with torch.no_grad():
            for xb, yb in val_dl:
                xb, yb = xb.to(device), yb.to(device)
                va_loss += criterion(model(xb), yb).item() * len(xb)
        va_loss /= len(val_dl.dataset)
        print(f"epoch {epoch+1:02d}  train={tr_loss:.4f}  val={va_loss:.4f}")

        if va_loss < best_val - 1e-4:
            best_val, bad, best_state = va_loss, 0, model.state_dict()
            torch.save({"state_dict": best_state, "n_features": n_features},
                       f"{cfg['eval']['results_dir']}/model.pt")
        else:
            bad += 1
            if bad >= cfg["train"]["patience"]:
                print("early stopping")
                break
    print(f"[done] best val loss={best_val:.4f}, checkpoint -> results/model.pt")


if __name__ == "__main__":
    main()
