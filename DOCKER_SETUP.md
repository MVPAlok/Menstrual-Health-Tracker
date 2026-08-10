# 🐳 NariCare Docker Setup Guide

This guide explains how to build, run, and manage NariCare using Docker and Docker Compose.

---

## 📋 Prerequisites

Make sure you have **Docker Desktop** installed on your system:
- [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 🚀 Quick Start (Recommended)

Run the entire application stack (Frontend, Backend API, Redis) with a single command:

```bash
docker compose up --build
```

### Access Services:
* 🎨 **Frontend (React UI)**: [http://localhost:5173](http://localhost:5173)
* ⚡ **Backend API**: [http://localhost:5000](http://localhost:5000)
* 🔴 **Redis Cache**: `localhost:6379`

To run in detached (background) mode:
```bash
docker compose up -d --build
```

To stop all services:
```bash
docker compose down
```

---

## 🛠️ Individual Container Commands

### 1. Build and Run Backend Container Only
```bash
cd backend
docker build -t naricare-backend .
docker run -p 5000:5000 --env-file .env naricare-backend
```

### 2. Build and Run Frontend Container Only
```bash
docker build -t naricare-frontend .
docker run -p 5173:80 naricare-frontend
```

---

## ⚙️ Environment Variables

The `docker-compose.yml` file picks up environment variables from your `.env` files or system environment. You can override database or secret values in your `.env` file before running `docker compose up`.
