"""
AI Service module for crisis response platform.

Classification is handled by a remote Hugging Face Spaces microservice
(dual-head DistilBERT running at shaurya20066-crisis-api.hf.space).

Google Gemini API is used for:
- Real-time crisis guidance (chat)
- Incident summarization and suggestions
- Analytics insights
"""
import os
import json
import re

from .model_service import classify_crisis

# Try to load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))
except ImportError:
    pass

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Try to import google genai
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def _get_client():
    """Get a configured Gemini client."""
    if not GENAI_AVAILABLE or not GEMINI_API_KEY:
        return None
    return genai.Client(api_key=GEMINI_API_KEY)


def classify_threat(emergency_type: str, details: str, sensor_data: dict = None) -> dict:
    """
    Classify threat using the local dual-head BERT model.

    The model determines:
    - Crisis type (fire/flood/medical/routine/security)
    - Severity score (0-100)

    Gemini is optionally used for generating AI suggestion and summary text.
    """
    # ── Primary: Model-based classification ──
    # Use details text if available, otherwise use emergency_type as input
    classify_text = details.strip() if details and details.strip() else emergency_type
    model_result = classify_crisis(classify_text)

    predicted_type = model_result['predicted_type']
    confidence = model_result['confidence']
    severity_score = model_result['severity_score']

    # ── Adjust severity based on type and confidence ──
    # The model's severity head outputs sigmoid(raw) * 100, where routine items
    # land around ~50 (sigmoid(0) = 0.5). We adjust based on the predicted type:
    if predicted_type == 'routine':
        # Routine issues should be low severity — scale down
        severity_score = min(severity_score * 0.4, 30)
    else:
        # Real emergencies — boost if model is confident
        if confidence > 0.8:
            severity_score = max(severity_score, 75)  # At least 75 for confident emergencies
        elif confidence > 0.5:
            severity_score = max(severity_score, 55)

    # Boost severity if sensor data indicates impact
    if sensor_data and sensor_data.get('impact_detected'):
        severity_score = min(100, severity_score + 15)

    # Determine threat score (0-100) from model severity
    threat_score = int(round(severity_score))

    # Determine severity label
    if threat_score >= 70:
        severity = 'critical'
    elif threat_score >= 40:
        severity = 'medium'
    else:
        severity = 'low'

    # ── Optional: Gemini for AI suggestion/summary text ──
    ai_suggestion = ''
    ai_summary = ''

    client = _get_client()
    if client:
        try:
            prompt = f"""You are an emergency response AI for a hotel crisis management system.
An emergency has been classified by our ML model as:
- Type: {predicted_type}
- Severity: {severity} (score: {threat_score}/100)
- Confidence: {confidence:.1%}
- Details: {details}
- Sensor Data: {json.dumps(sensor_data or {})}

Provide a brief JSON response with ONLY:
{{
    "ai_suggestion": "<immediate action recommendation in 1-2 sentences>",
    "ai_summary": "<brief incident summary in 1 sentence>"
}}"""
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            text = response.text.strip()
            json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                ai_suggestion = result.get('ai_suggestion', '')
                ai_summary = result.get('ai_summary', '')
        except Exception as e:
            print(f"Gemini suggestion error: {e}")

    # Fallback suggestions if Gemini unavailable
    if not ai_suggestion:
        ai_suggestion = _get_suggestion(predicted_type, severity)
    if not ai_summary:
        ai_summary = f'{predicted_type.title()} incident detected — severity {severity} (confidence: {confidence:.0%}).'

    return {
        'threat_score': threat_score,
        'severity': severity,
        'ai_suggestion': ai_suggestion,
        'ai_summary': ai_summary,
        'predicted_type': predicted_type,
        'model_confidence': confidence,
    }


def _get_suggestion(emergency_type: str, severity: str) -> str:
    """Generate a deterministic action suggestion based on type."""
    suggestions = {
        'fire': 'Evacuate the affected floor immediately. Alert fire department. Activate fire suppression systems.',
        'medical': 'Dispatch on-site medical team. Prepare first-aid supplies. Call emergency medical services if needed.',
        'security': 'Lock down the affected area. Alert security team. Contact local law enforcement if threat is active.',
        'flood': 'Initiate flood response protocol. Move guests to higher floors. Shut off water mains if applicable.',
        'routine': 'Assess the situation on-site. Send nearest available staff to the reported location.',
    }
    return suggestions.get(emergency_type, suggestions['routine'])


def chat_with_gemini(user_message: str, context: str = '') -> str:
    """
    AI Assistant chat — provide real-time guidance during crises.
    Falls back to pre-built responses if Gemini is unavailable.
    """
    client = _get_client()

    if client:
        try:
            prompt = f"""You are an AI emergency assistant for a hotel crisis management system called "Rapid Crisis Response".
You help guests and staff with real-time guidance during emergencies.

Context: {context}

User question: {user_message}

Respond helpfully and concisely (2-4 sentences max). Focus on actionable advice.
If the question is about first aid, fire safety, evacuation, or security — give clear, step-by-step guidance.
If the question is casual or unrelated to emergencies, politely redirect to how you can help with safety."""

            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini chat error: {e}")

    # Fallback responses
    return _fallback_chat(user_message)


def _fallback_chat(user_message: str) -> str:
    """Pre-built responses when Gemini is unavailable."""
    msg = user_message.lower()

    if any(w in msg for w in ['fire', 'smoke', 'burning']):
        return ("🔥 **Fire Safety Steps:** 1) Stay low to avoid smoke inhalation. "
                "2) Feel doors before opening — if hot, find another exit. "
                "3) Proceed to the nearest emergency exit. Do NOT use elevators. "
                "4) Once outside, move to the designated assembly point and wait for staff.")

    if any(w in msg for w in ['medical', 'first aid', 'injured', 'bleeding', 'hurt', 'unconscious']):
        return ("🏥 **First Aid Guidance:** 1) Do not move the injured person unless they are in immediate danger. "
                "2) Apply pressure to any bleeding wounds with a clean cloth. "
                "3) If unconscious but breathing, place them in the recovery position. "
                "4) Our medical team has been notified and is on the way.")

    if any(w in msg for w in ['earthquake', 'quake', 'shaking']):
        return ("🌍 **Earthquake Response:** 1) DROP, COVER, and HOLD ON. "
                "2) Stay away from windows, mirrors, and heavy furniture. "
                "3) If in bed, stay there and protect your head with a pillow. "
                "4) After shaking stops, evacuate using stairs only. Watch for aftershocks.")

    if any(w in msg for w in ['flood', 'water', 'flooding']):
        return ("🌊 **Flood Response:** 1) Move to higher ground immediately. "
                "2) Avoid walking through moving water — 6 inches can knock you down. "
                "3) Stay away from electrical equipment and outlets. "
                "4) Wait for staff instructions before returning to lower floors.")

    if any(w in msg for w in ['security', 'attack', 'weapon', 'gun', 'threat', 'suspicious']):
        return ("🔒 **Security Threat Protocol:** 1) If safe, LOCK your door and turn off lights. "
                "2) Move away from the door and windows. Stay silent. "
                "3) Do NOT open the door for anyone you don't recognize. "
                "4) Security team has been alerted and local police are being contacted.")

    if any(w in msg for w in ['evacuate', 'evacuation', 'exit', 'escape']):
        return ("🚪 **Evacuation Guide:** 1) Remain calm and proceed to the nearest emergency exit. "
                "2) Do NOT use elevators. Use stairwells only. "
                "3) Follow the illuminated exit signs. "
                "4) Proceed to the parking lot assembly point and await further instructions from staff.")

    return ("🤖 I'm your emergency assistant. I can help with:\n"
            "• 🔥 Fire safety and evacuation\n"
            "• 🏥 First aid and medical guidance\n"
            "• 🔒 Security threat protocols\n"
            "• 🌊 Flood response\n"
            "• 🚪 Evacuation procedures\n\n"
            "What type of emergency do you need help with?")


def generate_analytics_insights(incident_data: list) -> dict:
    """Generate AI-powered analytics insights from incident history."""
    client = _get_client()

    if not incident_data:
        return {
            'summary': 'No incidents recorded yet.',
            'most_common': 'N/A',
            'high_risk_areas': [],
            'recommendations': ['Continue monitoring systems.'],
        }

    if client:
        try:
            prompt = f"""Analyze this hotel incident data and provide insights.
Data: {json.dumps(incident_data[:50])}

Respond with ONLY a valid JSON object:
{{
    "summary": "<2-3 sentence analytics summary>",
    "most_common": "<most common emergency type>",
    "high_risk_areas": ["<area1>", "<area2>"],
    "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
}}"""
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            text = response.text.strip()
            json_match = re.search(r'\{[^{}]*(?:\[[^\]]*\][^{}]*)*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            print(f"Gemini analytics error: {e}")

    # Fallback analytics
    type_counts = {}
    for inc in incident_data:
        t = inc.get('emergency_type', 'routine')
        type_counts[t] = type_counts.get(t, 0) + 1

    most_common = max(type_counts, key=type_counts.get) if type_counts else 'routine'

    return {
        'summary': f'Analyzed {len(incident_data)} incidents. Most frequent type: {most_common}.',
        'most_common': most_common,
        'high_risk_areas': ['Lobby', 'Pool Area'],
        'recommendations': [
            f'Increase monitoring during peak hours.',
            f'Review {most_common} response protocols.',
            'Conduct quarterly emergency drills.',
        ],
    }
