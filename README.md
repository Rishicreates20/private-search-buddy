# Veilo 🔍

Veilo is a modern, privacy-focused hybrid search engine combining sparse keyword search (BM25 via SQLite FTS5) with dense semantic vector search (Sentence Transformers) using an asynchronous crawler and FastAPI backend.

url : https://private-search-buddy.vercel.app/

---

## 🏗️ System Architecture & Workflow

![Veilo Architecture Diagram]


### How It Works – Step by Step
1. **Ingestion:** Seed URLs are provided to an async web crawler that downloads web pages (HTML) using HTTPX and extracts clean text with Trafilatura/BeautifulSoup.
2. **Indexing:** Extracted content is stored as a Document Object and processed in two ways:
   - **Sparse Index:** Text is tokenized and stored in SQLite FTS5 for keyword-based search (BM25).
   - **Dense Index:** Text snippets are converted to vector embeddings using a Sentence Transformer model (384-dim) and stored in a vector table (BLOBS).
3. **Retrieval:** When a user searches, the query is sent to a FastAPI endpoint, which searches both indexes:
   - BM25 (keyword search) returns **Ranked List A**.
   - Dense search (semantic similarity) returns **Ranked List B**.
4. **Fusion:** The Reciprocal Rank Fusion (RRF) engine combines both results into a single, more accurate ranked list.
5. **Response:** The final ranked results are returned as JSON and displayed in a web UI (`index.html`).

---

## 🚀 Key Components
* **Async Web Crawler** – Downloads web pages in parallel for speed and efficiency.
* **HTTPX Client** – Fast and async HTTP requests.
* **Trafilatura / BS4** – Cleans and extracts readable text from HTML.
* **SQLite FTS5** – Keyword-based full-text search engine.
* **Sentence Transformer** – Converts text into semantic vector embeddings (384 dimensions).
* **RRF Engine** – Combines sparse and dense search results for better relevance.
* **FastAPI** – High-performance API for search and response handling.
* **Web UI** – Displays ranked search results in a clean interface.

---

## ✨ Benefits
* **High Accuracy:** Combines keyword and semantic search for better results.
* **Fast Search:** Optimized with SQLite FTS5 and vector embeddings.
* **Scalable:** Modular architecture for easy scaling.
* **Modern AI:** Uses state-of-the-art Sentence Transformers for semantic understanding.
* **Lightweight:** Built with open-source tools (SQLite, FastAPI, HTTPX).
* **User Friendly:** Simple and clean web interface for results.

---

## 📂 Project Structure

```text
Private search engine/
├── docker-compose.yml
├── README.md
├── BLOG.md               <-- Read our technical blog post here!
├── nginx/
│   └── nginx.conf
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── static/
    │   └── index.html
    └── app/
        ├── __init__.py
        ├── config.py
        ├── database.py
        ├── models.py
        ├── embeddings.py
        ├── crawler.py
        ├── search_engine.py
        └── main.py
