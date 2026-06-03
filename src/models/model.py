#!/usr/bin/env python3
"""
model.py
--------
Recurrent classifier (GRU or LSTM) for early-deterioration detection from
windowed multivariate vital-sign sequences. Sequence -> single risk score.
"""
import torch
import torch.nn as nn


class DeteriorationRNN(nn.Module):
    def __init__(self, n_features, hidden_size=64, num_layers=2,
                 dropout=0.3, rnn_type="GRU", bidirectional=False):
        super().__init__()
        rnn_cls = nn.GRU if rnn_type.upper() == "GRU" else nn.LSTM
        self.rnn = rnn_cls(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=bidirectional,
        )
        out_dim = hidden_size * (2 if bidirectional else 1)
        self.head = nn.Sequential(
            nn.LayerNorm(out_dim),
            nn.Linear(out_dim, out_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(out_dim // 2, 1),  # single logit
        )

    def forward(self, x):
        # x: (B, T, F)
        out, _ = self.rnn(x)
        last = out[:, -1, :]           # last timestep representation
        return self.head(last).squeeze(-1)  # (B,) logits


def build_model(cfg, n_features):
    m = cfg["model"]
    return DeteriorationRNN(
        n_features=n_features,
        hidden_size=m["hidden_size"],
        num_layers=m["num_layers"],
        dropout=m["dropout"],
        rnn_type=m["type"],
        bidirectional=m["bidirectional"],
    )
