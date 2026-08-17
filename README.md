# Prime Kingdom CRM Platform

An enterprise-grade, role-based CRM and HR management platform built specifically for the Prime Kingdom Pvt Ltd call center operations. 

## 🏗️ Architecture Stack
* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Python, FastAPI, Pydantic, SlowAPI
* **Database:** PostgreSQL (via Supabase), Row Level Security (RLS)
* **DevOps:** Docker, Docker Compose

## 🔐 Core Security Features
* **Zero-Trust Database:** Enforced PostgreSQL Row Level Security (RLS). Users cannot query data outside of their UUID or Role.
* **Server-Side Auth:** Cryptographically secure JWT tokens via PyJWT & Passlib (Bcrypt).
* **Input Validation:** Strict Pydantic schemas block field tampering before database insertion.
* **Rate Limiting:** Login routes protected against brute-force attacks via SlowAPI.

## 🚀 Quickstart (Local Development)

This project uses Docker to guarantee parity between your local machine and the production environment.

### Prerequisites
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Create a free [Supabase](https://supabase.com/) project to host the PostgreSQL database.

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/prime-kingdom-crm.git](https://github.com/yourusername/prime-kingdom-crm.git)
   cd prime-kingdom-crm