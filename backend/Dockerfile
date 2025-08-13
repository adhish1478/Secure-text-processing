FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install required system packages (netcat for wait-for-db.sh, libpq for psycopg2)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        netcat-openbsd \
        libpq5 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Ensure the entrypoint script is executable
RUN chmod +x wait-for-db.sh

# Expose port 8000
EXPOSE 8000

# Entrypoint (runs after DB is up)
# CMD ["./wait-for-db.sh", "sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]