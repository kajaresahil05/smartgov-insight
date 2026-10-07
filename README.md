# SmartGov Insight Platform

A modernized governance platform facilitating Citizen and Vendor interactions via a unified, high-performance web application.

## Tech Stack
* **Frontend:** React, TypeScript, Tailwind CSS, Vite
* **Backend:** FastAPI, Python, SQLAlchemy
* **Database:** SQLite (local development) / PostgreSQL (production)

## Getting Started

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On MacOS/Linux:
source .venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Configure Environment Variables:
Copy the `.env.example` file to create your own configuration file.
```bash
cp .env.example .env
```
Open `.env` and fill in your Gmail credentials for `EMAIL_USERNAME` and `EMAIL_PASSWORD` (use an App Password if using 2FA) to enable real OTP delivery.

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 5000
```
*Note: The server runs on port 5000 explicitly to match frontend CORS proxy setups.*

### 2. Frontend Setup

Open a new terminal session and navigate to the `frontend` directory:
```bash
cd frontend
```

Install JavaScript dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 3. Usage
The platform will now be available at `http://localhost:3002` (or whatever Vite assigns!). 
All API requests starting with `/api` are automatically proxied safely to the FastAPI backend. You can securely register, receive live OTP emails, and submit reports in real-time.
