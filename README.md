# Car Dealership Inventory System

A full-stack TDD-driven Car Dealership Inventory System built with **FastAPI** (backend) and **React + Tailwind CSS** (frontend).

## 🏗 Project Structure

```
Car_Inventory_System/
├── backend/           # FastAPI + SQLite REST API
│   ├── app/           # Application code
│   ├── tests/         # 48 pytest tests
│   └── requirements.txt
└── frontend/          # React + Vite + Tailwind CSS SPA
    ├── src/
    │   ├── api/       # Axios API client
    │   ├── components/# UI components
    │   ├── context/   # AuthContext
    │   ├── pages/     # Login, Register, Dashboard, AdminPanel
    │   └── __tests__/ # Vitest tests
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+ 
- Node.js 18+ and npm ([Download](https://nodejs.org/))

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-creates SQLite DB + seeds admin account)
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

**Default Admin Account** (auto-seeded):
- Username: `admin`  
- Password: `admin123`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🧪 Running Tests

### Backend Tests (48 tests)
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🔑 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, get JWT token |
| POST | `/api/vehicles` | User | Add vehicle |
| GET | `/api/vehicles` | User | List all vehicles |
| GET | `/api/vehicles/search` | User | Search/filter vehicles |
| PUT | `/api/vehicles/{id}` | User | Update vehicle |
| DELETE | `/api/vehicles/{id}` | **Admin** | Delete vehicle |
| POST | `/api/vehicles/{id}/purchase` | User | Purchase (decrease qty) |
| POST | `/api/vehicles/{id}/restock` | **Admin** | Restock (increase qty) |

### Search Query Parameters
```
GET /api/vehicles/search?make=Toyota&model=Camry&category=Sedan&min_price=20000&max_price=50000
```

---

## 🎨 Features

- **Dark mode** glassmorphism design with indigo/violet gradient accents
- **JWT authentication** — token stored in localStorage, auto-attached to all API calls
- **Role-based access** — admin users get extra controls (add/edit/delete/restock)
- **Real-time stock updates** — purchase updates the card without page reload
- **Search/filter** — live filtering by make, model, category, and price range
- **Skeleton loading** — placeholder cards while data loads
- **Toast notifications** — success/error feedback for all actions
- **Responsive** — mobile-first layout

---

## 🔐 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Regular | Register via `/register` | — |
