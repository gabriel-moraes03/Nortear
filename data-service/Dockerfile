FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install --with-deps chromium

COPY scrape.py process.py ./

# Por padrão roda o scraper; para rodar o processor:
# docker run ... nortear-scraper python process.py
CMD ["python", "scrape.py"]
