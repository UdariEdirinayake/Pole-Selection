# Stage 1: Build React + Vite frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend + pure Python engineering engine + built frontend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python dependencies & editable engineering engine
COPY backend/requirements.txt ./backend/requirements.txt
COPY engine/ ./engine/
RUN pip install --no-cache-dir -r backend/requirements.txt && \
    pip install --no-cache-dir -e ./engine

# Copy backend, reference data/docs, and built frontend dist
COPY backend/ ./backend/
COPY data/ ./data/
COPY docs/ ./docs/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
