# 🚗 Car Dealership Inventory System

A complete full-stack Car Dealership Inventory & Support Management System built with a **TDD-driven** workflow using **FastAPI** (backend) and **React + Tailwind CSS** (frontend). 

The system features real-time inventory tracking, role-based access control, promotional discount management, interactive customer support threads, and comprehensive test coverage.

---

## 🎨 Key Features

### 💻 Customer Dashboard
- **Glassmorphism Design**: Sleek modern dark mode UI with interactive indigo/violet gradients and hover effects.
- **Search & Filters**: Live search and filtering by make, model, category, minimum price, and maximum price.
- **Trending & Special Offers**: Interactive tabs highlighting *Trending Cars* (calculated dynamically by purchase volume) and *Special Offers* (cars currently marked on sale).
- **Real-Time Stock Updates**: Purchases decrement stock instantly on the UI without reloading.
- **Interactive Support Chat**: Guest and authenticated users can open live chat sessions with dealership staff. Regular users' chat histories are saved, and guests' chats are persisted via `localStorage`.

### 🛡️ Authentication & Authorization
- **JWT-Based Security**: Seamless login/registration with secure tokens stored in `localStorage` and sent with all API calls.
- **Session Protection**: Axios interceptors automatically attach authentication headers and redirect users to login upon token expiry (401 response).
- **Role-Based Controls**:
  - **Regular Users**: Can search inventory, purchase cars, view own purchase logs, and chat with support.
  - **Admins**: Granted full access to the Admin Panel. Forbidden from purchasing cars directly to prevent inventory manipulation.

### ⚙️ Admin Control Panel
- **Inventory Management**: Create, read, update, and delete vehicle listings. Supports multiple photo URLs (JSON array support) and customizable attributes (year, color, mileage, description).
- **Promotions / Sales**: Easily flag vehicles as "On Sale" with a discounted `sale_price` (includes server-side validation ensuring sale price is less than original price).
- **Customer Management**: View details of all registered non-admin customers and delete accounts when needed.
- **Global Purchase Logs**: Access a detailed activity log of all historical sales, user accounts, quantities, and transaction totals.
- **Support Inbox**: Manage and reply to customer support threads directly in real-time.

---

## 🏗️ Project Structure

```
Car_Inventory_System/
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── app/auth.py       # JWT helper utilities & password hashing
│   │   ├── app/database.py   # SQLAlchemy setup & session management
│   │   ├── app/models.py     # SQLAlchemy models (User, Vehicle, ActivityLog, etc.)
│   │   ├── app/schemas.py    # Pydantic validation schemas
│   │   ├── app/main.py       # FastAPI application initialisation & routers registry
│   │   └── app/routers/      # API Route Handlers
│   │       ├── auth.py       # Authentication routes
│   │       ├── customers.py  # Admin customer management
│   │       ├── enquiries.py  # Support ticket & chat endpoints
│   │       ├── inventory.py  # Purchase & restocking controls
│   │       └── vehicles.py   # Vehicle CRUD & Trends
│   ├── tests/                # 68 pytest test suites
│   ├── requirements.txt      # Backend dependencies
│   └── .env                  # Environment configurations
│
└── frontend/                 # React SPA (Vite-powered)
    ├── src/
    │   ├── api/client.js     # Centralized Axios client & API endpoints mapping
    │   ├── components/       # Reusable UI Components
    │   │   ├── EnquiryModal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── SearchBar.jsx
    │   │   ├── VehicleCard.jsx
    │   │   └── VehicleForm.jsx
    │   ├── context/          # Auth Context provider
    │   ├── pages/            # Core Pages (Login, Register, Dashboard, AdminPanel)
    │   └── __tests__/        # 32 Vitest component tests
    └── package.json
```

---

## 🔑 API Endpoints

### Authentication
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Log in and receive JWT token |

### Vehicles & Search
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/vehicles` | User | Add a new vehicle to the inventory |
| `GET` | `/api/vehicles` | None | List all vehicles |
| `GET` | `/api/vehicles/search` | None | Filter vehicles (by make, model, category, price) |
| `GET` | `/api/vehicles/trends` | None | Get top trending (most sold) and discounted vehicles |
| `PUT` | `/api/vehicles/{id}` | User | Update a vehicle's specifications |
| `DELETE` | `/api/vehicles/{id}` | **Admin** | Remove a vehicle from the system |

### Inventory & Purchases
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/vehicles/{id}/purchase` | User | Purchase a vehicle (decreases quantity; regular users only) |
| `POST` | `/api/vehicles/{id}/restock` | **Admin** | Restock a vehicle (increases quantity) |
| `GET` | `/api/vehicles/purchases/logs` | User | Fetch purchase history logs (Admins see all logs, Customers see own) |

### Customer & Support Tickets
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/customers` | **Admin** | Get a list of all registered customer accounts |
| `DELETE` | `/api/customers/{id}` | **Admin** | Permanently delete a customer account |
| `POST` | `/api/enquiries` | None/User | Start or send a message to a support chat thread |
| `GET` | `/api/enquiries` | **Admin** | Retrieve all support enquiries |
| `GET` | `/api/enquiries/my` | User | Retrieve support enquiries for current user |
| `GET` | `/api/enquiries/{id}/messages`| None/User | Retrieve all message logs for an enquiry thread |
| `POST` | `/api/enquiries/{id}/messages`| None/User | Reply to a support thread message |
| `DELETE` | `/api/enquiries/{id}` | **Admin** | Remove an enquiry thread and its messages |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** and npm

---

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows Command Prompt/PowerShell:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` configuration file from these parameters (or edit existing):
   ```env
   SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   DATABASE_URL=sqlite:///./dealership.db
   ```
5. Start the backend development server (this automatically performs db migrations & seeds the default admin account):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
* The API will run at `http://localhost:8000`
* Swagger UI Docs are available at `http://localhost:8000/docs`

**Default Admin Credentials**:
- **Username**: `admin`
- **Password**: `admin123`

---

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
* The app will run at `http://localhost:5173`

---

## 🧪 Testing

### Backend Unit & Integration Tests (68 tests)
The backend uses **pytest** and **httpx** to perform unit and integration tests against a mock SQLite test database.
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Unit & Component Tests (32 tests)
The frontend uses **Vitest** and **React Testing Library** to mock API calls and assert component behaviors.
```bash
cd frontend
npm test
```
