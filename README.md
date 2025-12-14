# VibeQuery 🎬

## Overview

**VibeQuery** is a full-stack, AI-powered movie discovery platform that revolutionizes how you find films. Instead of relying on rigid keywords, VibeQuery allows you to search using natural language, vibes, or complex thematic queries. It leverages the power of vector embeddings and a high-performance vector database to understand the *vibe* of your search and deliver uniquely relevant movie recommendations.

---
## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Usage](#usage)
---

## Features

- **Semantic Search:** Find movies by describing plots, themes, moods, or even abstract concepts (e.g., "a mind-bending sci-fi movie with a lonely protagonist").
- **AI-Powered Engine:** Uses modern embedding models to translate text into high-dimensional vectors for nuanced understanding.
- **High-Performance Vector DB:** Built on Pinecone for fast and scalable similarity searches.
- **Clean & Responsive UI:** A simple, modern interface built with React and Tailwind CSS for a seamless user experience.
- **Full-Stack Architecture:** A robust Express.js backend serves the AI logic, while a dynamic Vite-powered frontend handles user interaction.
---

## Demo

🔗 **Live Demo:** NA

*(Feel free to add screenshots of your application here!)*

---

## Tech Stack

**Frontend:**
- React
- Vite
- React Router
- Tailwind CSS
- DaisyUI
- Axios

**Backend:**
- Node.js
- Express.js
- Pinecone (Vector Database)
- MongoDB (with Mongoose for metadata)
- Transformers.js (for embeddings)
- dotenv, cors

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (a local instance or a cloud-based one like MongoDB Atlas)
- A [Pinecone](https://www.pinecone.io/) account for the vector database.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/VibeQuery.git
    cd VibeQuery
    ```

2.  **Set up the backend:**
    ```bash
    cd Backend
    npm install
    ```
    Create a `.env` file in the `Backend` directory with the following variables. You will also need a MongoDB collection with movie data to populate the vector index.
    ```
    MONGO_URI=your_mongodb_connection_string
    PINECONE_API_KEY=your_pinecone_api_key
    ```

3.  **Set up the frontend:**
    ```bash
    cd ../Frontend
    npm install
    ```
    Create a `.env` file in the `Frontend` directory if your API is not running on the default localhost port:
    ```
    VITE_SERVER_URL=http://localhost:3000/api
    ```

4.  **Run the application:**
    This project requires two terminals to run concurrently for development.

    - **In Terminal 1 (from the `Backend` directory), start the server:**
      ```bash
      # In ./Backend
      npm run dev
      ```
    - **In Terminal 2 (from the `Frontend` directory), start the frontend:**
       ```bash
       # In ./Frontend
       npm run dev
       ```

5.  **Visit the app** at the address provided by Vite (usually `http://localhost:5173`).

---

## Folder Structure

```
VibeQuery/
├── Backend/    # Backend API (Node.js, Express, Pinecone)
└── Frontend/   # Frontend app (React, Vite, Tailwind CSS)
```

---

## Usage

- Once the application is running, use the search bar to enter a query.
- Instead of just a title, try describing the kind of movie you want to watch.
- **Examples:**
  - "A heist movie with a lot of twists"
  - "Cozy fantasy film that feels like a warm hug"
  - "Dark, rainy, futuristic detective story"
- The system will return a list of movies that match the vibe of your query.
