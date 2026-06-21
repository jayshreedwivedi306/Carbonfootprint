# 🌱 CarbonAware – Carbon Footprint Awareness Platform

A full-stack sustainability platform that empowers users to measure, monitor, and reduce their carbon footprint through intelligent analytics, carbon tracking, and actionable eco-friendly recommendations.

Built with the MERN ecosystem, CarbonAware transforms everyday activities into meaningful environmental insights, helping users make informed decisions for a greener future.

---

## 📸 Application Preview

### 📊 Dashboard

Track your environmental impact with interactive analytics:

* Cumulative CO₂ savings
* Current emission status
* Carbon footprint trends
* Emissions breakdown by category
* CSV report export

### 🧮 Carbon Footprint Calculator

Estimate emissions based on:

* 🚗 Travel & commuting habits
* ⚡ Household energy consumption
* 🥗 Dietary footprint
* Personalized carbon impact analysis

### ✅ Habits & Action Suggestions

Reduce emissions through sustainable lifestyle changes:

* Personalized eco-friendly recommendations
* Travel, Energy, and Diet categories
* Weekly carbon reduction estimates
* Habit adoption tracking
* Achievement monitoring

---

## ✨ Key Features

### Authentication & Security

* User Registration & Login
* JWT Authentication
* Protected Routes
* Password Reset Support
* OAuth-Compatible Authentication Flow

### Carbon Tracking

* Carbon log creation and management
* Historical emissions tracking
* Category-based footprint calculation
* Progress monitoring

### Analytics Dashboard

* Real-time sustainability metrics
* Emission trend visualization
* Emission source breakdown
* CO₂ savings tracking
* Export reports as CSV

### Sustainability Recommendations

* Personalized eco-friendly actions
* Habit adoption tracking
* Active checklist management
* Environmental impact estimation

---

## 🛠 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Chart.js / Recharts

### Backend

* Node.js
* Express.js
* TypeScript

### Database & ORM

* Prisma ORM
* SQLite / PostgreSQL

### DevOps & Infrastructure

* Docker
* Docker Compose
* Terraform

---

## 📂 Project Structure

```text
carbon-aware/
│
├── client/              # React + Vite frontend
├── server/              # Express API & Prisma
├── terraform/           # Infrastructure as Code
├── docker-compose.yml   # Container orchestration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 24+
* npm
* Git
* Docker & Docker Compose (optional)

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/carbon-aware.git

cd carbon-aware
```

---

### 2️⃣ Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

### 3️⃣ Configure Environment Variables

Create a `.env` file inside `server/`:

```env
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

---

### 4️⃣ Initialize Database

```bash
cd server

npx prisma generate
npx prisma migrate dev --name init
```

Optional:

```bash
npm run db:seed
```

---

## ▶ Running the Application

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

### Docker Setup

```bash
docker compose up --build
```

Services:

| Service     | Port |
| ----------- | ---- |
| Database    | 5432 |
| Backend API | 5000 |
| Frontend    | 3000 |

---

## 📜 Available Scripts

### Backend

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
npm test
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

---

## 🎯 Project Objectives

* Increase awareness of personal carbon emissions
* Encourage sustainable lifestyle choices
* Provide actionable environmental insights
* Visualize carbon footprint trends
* Promote measurable carbon reduction habits

---

## 🔮 Future Enhancements

* AI-powered sustainability recommendations
* Carbon offset integrations
* Gamification and reward badges
* Community sustainability challenges
* Mobile application support
* Smart emission forecasting

## 👨‍💻 Author [This project is made by Antigravity to solve real world problem and make environment green :).]

Developed with 💚 to promote sustainability through technology.

If you found this project interesting, consider giving it a ⭐ on GitHub.
