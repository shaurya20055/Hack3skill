"""
Model Service — Loads and serves the dual-head DistilBERT crisis classification model.

The model has two output heads:
  1. Classifier head (768 → 5): predicts crisis type (fire/flood/medical/routine/security)
  2. Severity head (768 → 64 → 1): predicts a continuous severity score

The model is loaded once as a singleton and reused for all inference requests.
"""
import os
import json
import torch
import torch.nn as nn
from tokenizers import Tokenizer

# ─── Model architecture ───────────────────────────────────────────────

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
        embeddings = word_emb + pos_emb
        return self.LayerNorm(embeddings)


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
        x = self.output_layer_norm(x + ffn_out)
        return x


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
    Dual-head DistilBERT model for crisis classification.
    Head 1: Crisis type classification (5 classes)
    Head 2: Severity regression (continuous score)
    """
    def __init__(self, num_labels=5):
        super().__init__()
        self.bert = DistilBert()
        self.classifier = nn.Sequential(
            nn.Dropout(0.1),
            nn.Linear(768, num_labels),
        )
        self.severity_head = nn.Sequential(
            nn.Dropout(0.1),
            nn.Linear(768, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def forward(self, input_ids, attention_mask=None):
        outputs = self.bert(input_ids, attention_mask)
        # Use [CLS] token representation
        cls_output = outputs[:, 0, :]
        logits = self.classifier(cls_output)
        severity = self.severity_head(cls_output)
        return logits, severity


# ─── Singleton loader ──────────────────────────────────────────────────

_model = None
_tokenizer = None
_id2label = None

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model')


def _load_model():
    """Load the model and tokenizer once (singleton pattern)."""
    global _model, _tokenizer, _id2label

    if _model is not None:
        return

    print(f"[ModelService] Loading crisis model from {MODEL_DIR}...")

    # Load label mapping
    with open(os.path.join(MODEL_DIR, 'id2label.json'), 'r') as f:
        _id2label = json.load(f)

    # Load tokenizer (HuggingFace tokenizers library)
    _tokenizer = Tokenizer.from_file(os.path.join(MODEL_DIR, 'tokenizer.json'))
    _tokenizer.enable_truncation(max_length=512)
    _tokenizer.enable_padding(length=512)

    # Load model
    _model = DualHeadCrisisModel(num_labels=len(_id2label))
    state_dict = torch.load(
        os.path.join(MODEL_DIR, 'dual_head_best.pt'),
        map_location='cpu',
        weights_only=False,
    )
    _model.load_state_dict(state_dict)
    _model.eval()

    print(f"[ModelService] Model loaded successfully. Labels: {_id2label}")


def classify_crisis(text: str) -> dict:
    """
    Classify a crisis text using the dual-head model.

    Args:
        text: The crisis description text to classify.

    Returns:
        dict with keys:
            - predicted_type (str): e.g. 'fire', 'flood', 'medical', 'routine', 'security'
            - confidence (float): 0.0-1.0 confidence of the prediction
            - severity_raw (float): raw severity score from the model
            - all_scores (dict): probability for each class
    """
    _load_model()

    # Tokenize
    encoding = _tokenizer.encode(text)
    input_ids = torch.tensor([encoding.ids], dtype=torch.long)
    attention_mask = torch.tensor([encoding.attention_mask], dtype=torch.long)

    # Inference
    with torch.no_grad():
        logits, severity = _model(input_ids, attention_mask)

    # Process classification output
    probabilities = torch.softmax(logits, dim=-1).squeeze(0)
    predicted_idx = probabilities.argmax().item()
    predicted_type = _id2label[str(predicted_idx)]
    confidence = probabilities[predicted_idx].item()

    # Build all scores
    all_scores = {}
    for idx, label in _id2label.items():
        all_scores[label] = round(probabilities[int(idx)].item(), 4)

    # Severity — the severity head outputs a raw continuous value
    # We clamp it to 0-100 range for use as a threat score
    severity_raw = severity.squeeze().item()
    # Sigmoid to normalize, then scale to 0-100
    severity_normalized = torch.sigmoid(torch.tensor(severity_raw)).item() * 100

    return {
        'predicted_type': predicted_type,
        'confidence': round(confidence, 4),
        'severity_raw': round(severity_raw, 4),
        'severity_score': round(severity_normalized, 1),
        'all_scores': all_scores,
    }
