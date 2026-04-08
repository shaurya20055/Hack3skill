"""
AI Service module integrating with Google Gemini API for:
- Threat classification and severity scoring
- Real-time crisis guidance
- Incident summarization
- Smart detection from text input
"""
import os
import json
import re

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
    Use Gemini to classify threat severity and generate suggestions.
    Falls back to rule-based scoring if Gemini is unavailable.
    """
    client = _get_client()

    if client:
        try:
            prompt = f"""You are an emergency response AI for a hotel crisis management system.
Analyze the following emergency report and respond ONLY with a valid JSON object.

Emergency Type: {emergency_type}
Details: {details}
Sensor Data: {json.dumps(sensor_data or {})}

Respond with this exact JSON structure:
{{
    "threat_score": <integer 0-100>,
    "severity": "<low|medium|critical>",
    "ai_suggestion": "<immediate action recommendation in 1-2 sentences>",
    "ai_summary": "<brief incident summary in 1 sentence>"
}}

Rules:
- Fire/security threats with panic keywords = critical (80-100)
- Medical emergencies = medium-high (60-90)
- Vague/minor reports = low (20-50)
- Impact detected in sensors = boost score by 20
"""
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            text = response.text.strip()
            # Extract JSON from response
            json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return {
                    'threat_score': max(0, min(100, int(result.get('threat_score', 50)))),
                    'severity': result.get('severity', 'medium'),
                    'ai_suggestion': result.get('ai_suggestion', ''),
                    'ai_summary': result.get('ai_summary', ''),
                }
        except Exception as e:
            print(f"Gemini classify_threat error: {e}")

    # Fallback: rule-based scoring
    return _fallback_classify(emergency_type, details, sensor_data)


def _fallback_classify(emergency_type: str, details: str, sensor_data: dict = None) -> dict:
    """Rule-based fallback when Gemini is unavailable."""
    import random

    details_lower = (details or '').lower()
    score = 40

    # Type-based scoring
    type_scores = {
        'fire': 80,
        'security': 75,
        'medical': 65,
        'natural_disaster': 85,
        'other': 40,
    }
    score = type_scores.get(emergency_type, 40)

    # Keyword boosting
    panic_keywords = ['help', 'trapped', 'shooting', 'fire', 'smoke', 'blood',
                      'unconscious', 'attack', 'bomb', 'weapon', 'gun', 'dying',
                      'earthquake', 'flood', 'collapse']
    keyword_hits = sum(1 for kw in panic_keywords if kw in details_lower)
    score = min(100, score + keyword_hits * 8)

    # Sensor data boost
    if sensor_data and sensor_data.get('impact_detected'):
        score = min(100, score + 15)

    # Add randomness
    score = min(100, max(10, score + random.randint(-5, 10)))

    # Determine severity
    if score >= 75:
        severity = 'critical'
    elif score >= 45:
        severity = 'medium'
    else:
        severity = 'low'

    # Generate suggestion based on type
    suggestions = {
        'fire': 'Evacuate the affected floor immediately. Alert fire department. Activate fire suppression systems.',
        'medical': 'Dispatch on-site medical team. Prepare first-aid supplies. Call emergency medical services if needed.',
        'security': 'Lock down the affected area. Alert security team. Contact local law enforcement if threat is active.',
        'natural_disaster': 'Initiate evacuation protocol. Guide guests to designated safe zones. Monitor for aftershocks.',
        'other': 'Assess the situation on-site. Send nearest available staff to the reported location.',
    }

    summaries = {
        'fire': f'Fire emergency reported. Threat level: {severity}.',
        'medical': f'Medical emergency reported. Threat level: {severity}.',
        'security': f'Security threat reported. Threat level: {severity}.',
        'natural_disaster': f'Natural disaster alert. Threat level: {severity}.',
        'other': f'Incident reported. Threat level: {severity}.',
    }

    return {
        'threat_score': score,
        'severity': severity,
        'ai_suggestion': suggestions.get(emergency_type, suggestions['other']),
        'ai_summary': summaries.get(emergency_type, summaries['other']),
    }


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
            "• 🌍 Natural disaster response\n"
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
        t = inc.get('emergency_type', 'other')
        type_counts[t] = type_counts.get(t, 0) + 1

    most_common = max(type_counts, key=type_counts.get) if type_counts else 'other'

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
