"""
Crisis Classifier API — Hugging Face Spaces
Dual-Head DistilBERT model for crisis type classification + severity scoring.
"""

import os
import json
import torch
import torch.nn as nn
from tokenizers import Tokenizer
from fastapi import FastAPI
from pydantic import BaseModel
from huggingface_hub import hf_hub_download

# ══════════════════════════════════════════════════════════════
#  Model Architecture — Dual-Head DistilBERT
# ══════════════════════════════════════════════════════════════

class DistilBertEmbeddings(nn.Module):
    def __init__(self, vocab_size=30522, dim=768, max_position=512):
        super().__init__()
        self.word_embeddings = nn.Embedding(vocab_size, dim)
        self.position_embeddings = nn.Embedding(max_position, dim)
        self.LayerNorm = nn.LayerNorm(dim)

    def forward(self, input_ids):
        seq_len = input_ids.size(1)
        position_ids = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)
        word_emb = self.word_embeddings(input_ids)
        pos_emb = self.position_embeddings(position_ids)
        return self.LayerNorm(word_emb + pos_emb)


class MultiHeadSelfAttention(nn.Module):
    def __init__(self, dim=768, n_heads=12):
        super().__init__()
        self.n_heads = n_heads
        self.dim = dim
        self.head_dim = dim // n_heads
        self.q_lin = nn.Linear(dim, dim)
        self.k_lin = nn.Linear(dim, dim)
        self.v_lin = nn.Linear(dim, dim)
        self.out_lin = nn.Linear(dim, dim)

    def forward(self, x, attention_mask=None):
        bs, seq_len, _ = x.size()
        q = self.q_lin(x).view(bs, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        k = self.k_lin(x).view(bs, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        v = self.v_lin(x).view(bs, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        scores = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim ** 0.5)
        if attention_mask is not None:
            scores = scores + attention_mask
        attn = torch.softmax(scores, dim=-1)
        context = torch.matmul(attn, v)
        context = context.transpose(1, 2).contiguous().view(bs, seq_len, self.dim)
        return self.out_lin(context)


class FFN(nn.Module):
    def __init__(self, dim=768, hidden_dim=3072):
        super().__init__()
        self.lin1 = nn.Linear(dim, hidden_dim)
        self.lin2 = nn.Linear(hidden_dim, dim)
        self.activation = nn.GELU()

    def forward(self, x):
        return self.lin2(self.activation(self.lin1(x)))


class TransformerBlock(nn.Module):
    def __init__(self, dim=768, hidden_dim=3072, n_heads=12):
        super().__init__()
        self.attention = MultiHeadSelfAttention(dim, n_heads)
        self.sa_layer_norm = nn.LayerNorm(dim)
        self.ffn = FFN(dim, hidden_dim)
        self.output_layer_norm = nn.LayerNorm(dim)

    def forward(self, x, attention_mask=None):
        attn_out = self.attention(x, attention_mask)
        x = self.sa_layer_norm(x + attn_out)
        ffn_out = self.ffn(x)
        return self.output_layer_norm(x + ffn_out)


class Transformer(nn.Module):
    def __init__(self, n_layers=6, dim=768, hidden_dim=3072, n_heads=12):
        super().__init__()
        self.layer = nn.ModuleList([
            TransformerBlock(dim, hidden_dim, n_heads) for _ in range(n_layers)
        ])

    def forward(self, x, attention_mask=None):
        for layer in self.layer:
            x = layer(x, attention_mask)
        return x


class DistilBert(nn.Module):
    def __init__(self):
        super().__init__()
        self.embeddings = DistilBertEmbeddings()
        self.transformer = Transformer()

    def forward(self, input_ids, attention_mask=None):
        x = self.embeddings(input_ids)
        if attention_mask is not None:
            extended_mask = attention_mask.unsqueeze(1).unsqueeze(2)
            extended_mask = (1.0 - extended_mask) * -1e9
        else:
            extended_mask = None
        return self.transformer(x, extended_mask)


class DualHeadCrisisModel(nn.Module):
    """
    Dual-head DistilBERT:
      Head 1 — Classification (768 → 5): fire, flood, medical, routine, security
      Head 2 — Severity regression (768 → 64 → 1): continuous 0-100 score
    """
    def __init__(self, num_labels=5):
        super().__init__()
        self.bert = DistilBert()
        self.classifier = nn.Sequential(nn.Dropout(0.1), nn.Linear(768, num_labels))
        self.severity_head = nn.Sequential(
            nn.Dropout(0.1), nn.Linear(768, 64), nn.ReLU(), nn.Linear(64, 1)
        )

    def forward(self, input_ids, attention_mask=None):
        outputs = self.bert(input_ids, attention_mask)
        cls_output = outputs[:, 0, :]
        logits = self.classifier(cls_output)
        severity = self.severity_head(cls_output)
        return logits, severity


# ══════════════════════════════════════════════════════════════
#  Download & Load Model from Hugging Face Hub
# ══════════════════════════════════════════════════════════════

REPO_ID = "shaurya20066/crisis_classifier"

print("[*] Downloading model weights from Hugging Face Hub...")
model_path = hf_hub_download(repo_id=REPO_ID, filename="dual_head_best.pt")
tokenizer_path = hf_hub_download(repo_id=REPO_ID, filename="tokenizer.json")
id2label_path = hf_hub_download(repo_id=REPO_ID, filename="id2label.json")

# Load label mapping
with open(id2label_path, "r") as f:
    id2label = json.load(f)

# Load tokenizer
tokenizer = Tokenizer.from_file(tokenizer_path)
tokenizer.enable_truncation(max_length=512)
tokenizer.enable_padding(length=512)

# Load model
model = DualHeadCrisisModel(num_labels=len(id2label))
state_dict = torch.load(model_path, map_location="cpu", weights_only=False)
model.load_state_dict(state_dict)
model.eval()
print(f"[✓] Model loaded. Labels: {id2label}")


# ══════════════════════════════════════════════════════════════
#  FastAPI App
# ══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Crisis Classifier API",
    description="Dual-head DistilBERT for crisis type classification and severity scoring.",
    version="1.0.0",
)


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    predicted_type: str
    confidence: float
    severity_score: float
    all_scores: dict


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "model": "DualHeadCrisisModel",
        "labels": list(id2label.values()),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    # Tokenize
    encoding = tokenizer.encode(request.text)
    input_ids = torch.tensor([encoding.ids], dtype=torch.long)
    attention_mask = torch.tensor([encoding.attention_mask], dtype=torch.long)

    # Inference
    with torch.no_grad():
        logits, severity = model(input_ids, attention_mask)

    # Classification
    probabilities = torch.softmax(logits, dim=-1).squeeze(0)
    predicted_idx = probabilities.argmax().item()
    predicted_type = id2label[str(predicted_idx)]
    confidence = round(probabilities[predicted_idx].item(), 4)

    # All scores
    all_scores = {
        id2label[str(i)]: round(probabilities[i].item(), 4)
        for i in range(len(id2label))
    }

    # Severity — sigmoid normalize to 0-100
    severity_raw = severity.squeeze().item()
    severity_score = round(torch.sigmoid(torch.tensor(severity_raw)).item() * 100, 1)

    # Adjust severity based on type + confidence
    if predicted_type == "routine":
        severity_score = min(severity_score * 0.4, 30)
    else:
        if confidence > 0.8:
            severity_score = max(severity_score, 75)
        elif confidence > 0.5:
            severity_score = max(severity_score, 55)

    return PredictResponse(
        predicted_type=predicted_type,
        confidence=confidence,
        severity_score=round(severity_score, 1),
        all_scores=all_scores,
    )
