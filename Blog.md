Here is a professional, complete `README.md` file tailored for your project **Veilo**, featuring your architecture diagram and a section linking to a blog post file.

You can create a file named `README.md` in your root project directory and paste the following content into it:

```markdown
# Veilo 🔍

Veilo is a modern, privacy-focused hybrid search engine combining sparse keyword search (BM25 via SQLite FTS5) with dense semantic vector search (Sentence Transformers) using an asynchronous crawler and FastAPI backend.

---

## 🏗️ System Architecture & Workflow

![Veilo Architecture Diagram](1000144469.png)

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

```

---

## 📖 Blog & Technical Write-up

Want to dive deeper into the design decisions, mathematical models (like RRF and Cosine Similarity), and challenges faced while building Veilo? Check out our dedicated documentation:
👉 **[Read the Full Blog Post (`BLOG.md`)](https://www.google.com/search?q=./BLOG.md)**

---

## 🛠️ Getting Started & Local Setup

1. Clone the repository:
```bash
git clone [https://github.com/Rishicreates20/private-search-buddy.git](https://github.com/Rishicreates20/private-search-buddy.git)
cd private-search-buddy

```


2. Build and run using Docker Compose:
```bash
docker compose up -d --build

```


3. Open your browser and visit `http://localhost`.

```

---

### Plus, your `BLOG.md` file!
Since you mentioned wanting to add a blog file, create a companion file named **`BLOG.md`** in your root directory and paste this inside it:

```markdown
# Building Veilo: A Privacy-First Hybrid Search Engine from Scratch

Modern search engines are massive black boxes. They track every query, harvest personal data, and lock down your search habits. We wanted to build something different: **Veilo**, a lightweight, self-hosted hybrid search engine that runs entirely locally, respects your privacy, and combines the best of keyword precision with semantic AI understanding.

Here is the engineering breakdown of how we built it.

## 1. The Core Challenge: Keywords vs. Meaning
Traditional search engines rely purely on keywords (like SQLite FTS5 / BM25). If you search for *"how to fix a flat tire"*, it looks for exact text matches. But what if a page says *"patching a punctured rubber wheel"* without using the exact words? Keyword search fails.

Modern AI introduced **Dense Vector Search**, which converts text into semantic embeddings. This finds concepts, not just words. However, vector search can sometimes miss exact product names, IDs, or specific technical terms.

**The Solution:** We combined *both* using a hybrid pipeline.

## 2. The Three-Stage Architecture
As illustrated in our system diagram, Veilo breaks down into three clear phases:

* **Ingestion:** An asynchronous crawler built with `httpx` sweeps target sites concurrently. It passes raw HTML into `trafilatura` to strip away clutter (ads, sidebars, navigation) and isolates clean article text.
* **Indexing:** The text is split into two distinct paths:
  1. Sent to SQLite's **FTS5 engine** to create a lightning-fast sparse keyword index.
  2. Passed to a local **Sentence Transformer model** (`all-MiniLM-L6-v2`) to generate 384-dimensional vector embeddings, stored securely as binary blobs in SQLite.
* **Retrieval & Fusion:** When a query hits the FastAPI backend, it runs a sparse BM25 search and a dense vector cosine similarity search simultaneously. We then merge the two lists using **Reciprocal Rank Fusion (RRF)** to guarantee top-tier relevance.

## 3. Why Local SQLite & Docker?
By keeping storage inside a portable SQLite database and packaging the backend with Docker, Veilo can be spun up on a local laptop, a Raspberry Pi, or a low-cost cloud node in seconds. No external heavy vector databases (like Pinecone or Milvus) are required.

## Conclusion
Building Veilo bridges the gap between old-school full-text search and modern transformer-based NLP. Whether you host it locally or wire it up to a frontend like Lovable, you get complete ownership over your search infrastructure. 

*Try it out, index your favorite documentation sites, and take back your search privacy!*

```