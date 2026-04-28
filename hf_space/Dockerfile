FROM python:3.11-slim

# Create non-root user (strict HF requirement)
RUN useradd -m -u 1000 user

# Set working directory
WORKDIR /home/user/app

# Install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY --chown=user hf_space/app.py .
# Switch to non-root user
USER user

# Expose HF Spaces port
EXPOSE 7860

# Run on port 7860 (HF requirement — NOT 8000)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
