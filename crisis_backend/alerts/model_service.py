"""
Model Service — Remote API client for crisis classification.

The dual-head DistilBERT model now runs on Hugging Face Spaces
to avoid the 265MB RAM cost on Render's free tier.

This module sends text to the HF Space microservice and returns
the prediction. If the API is unavailable (cold start, timeout),
it returns a fallback result.
"""

import requests

HF_API_URL = "https://shaurya20066-crisis-api.hf.space/predict"
HF_TIMEOUT = 15  # seconds — HF free tier can be slow on cold start


def classify_crisis(text: str) -> dict:
    """
    Classify a crisis text via the Hugging Face Spaces API.

    Args:
        text: The crisis description text to classify.

    Returns:
        dict with keys:
            - predicted_type (str): e.g. 'fire', 'flood', 'medical', 'routine', 'security'
            - confidence (float): 0.0-1.0 confidence of the prediction
            - severity_score (float): 0-100 severity score
            - all_scores (dict): probability for each class
    """
    try:
        response = requests.post(
            HF_API_URL,
            json={"text": text},
            timeout=HF_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

        return {
            'predicted_type': data.get('predicted_type', 'routine'),
            'confidence': data.get('confidence', 0.0),
            'severity_score': data.get('severity_score', 50.0),
            'severity_raw': 0.0,
            'all_scores': data.get('all_scores', {}),
        }

    except Exception as e:
        print(f"[ModelService] HF API error: {e}")
        return {
            'predicted_type': 'routine',
            'confidence': 0.0,
            'severity_score': 50.0,
            'severity_raw': 0.0,
            'all_scores': {},
        }
