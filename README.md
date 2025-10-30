<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg" width="60" alt="Balance Logo" />
  <h1>Balance</h1>
  <p><strong>A beautifully crafted, agent-assisted expense sharing platform.</strong></p>
  <p>Track direct debts, split expenses across groups, and optimize group settlements using Global Minimum Cash Flow algorithms.</p>
  
  <br/>

  [![Live Demo](https://img.shields.io/badge/Live_Demo-View_Site-2ecc71?style=for-the-badge)](https://balance-app-2vfq.onrender.com)
  [![Tech Stack](https://img.shields.io/badge/Stack-React_|_Express_|_Prisma-3498db?style=for-the-badge)](#)
</div>

---

## 🌟 Overview

**Balance** makes splitting bills, tracking group trip expenses, and settling 1-on-1 debts completely effortless. Built with a sleek, modern glassmorphic interface and a high-performance backend, it doesn't just track who paid what—it actively calculates the absolute most efficient way for everyone to pay each other back.

### 🔗 Live Preview
Check out the fully deployed application here: **[Balance App Live](https://balance-app-2vfq.onrender.com)**

---

## ⚡ Core Features

### 1. 🌍 Global Payment Simplification (The Magic Feature)
The flagship feature of **Balance** is its **Global Minimum Cash Flow Engine**. 
Most expense trackers only simplify debts *within a specific group*. Balance takes this a massive step further: it simplifies your debts **globally across your entire network of friends and groups**.

If you owe Alice $50 from a trip, Alice owes Bob $30 from a dinner, and Bob owes you $20 for coffee—Balance will automatically detect this global cycle and restructure it so you only make the absolute minimal transactions required. 
- **True Global Routing:** Automatically cancels out overlapping debts across 1-on-1 ledgers and multiple different groups simultaneously.
- **Unified Settlement:** You don't need to settle up group by group. You get one unified "Who do I pay?" list that factors in all your overlapping financial relationships.
- **Instant Previews:** Visualizes exactly how debts are being routed across the network before you execute a settlement.

### 2. Intelligent Direct Settlements
Balance differentiates between the psychology of debt.
- **You owe money:** A standard "Record as Paid" approval workflow.
- **They owe you money:** A nuanced "Send Reminder" nudge workflow.
- In both cases, the system uses dual-sided approvals to ensure the ledger remains perfectly accurate and synced across the globe.

### 3. Real-Time Group Management
Create dedicated groups, invite users via global search, and record expenses split perfectly among multiple users on the fly. When you use the "Fresh Start" feature, group debts are seamlessly collapsed into optimized 1-on-1 ledgers without destroying the group history. 

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 (Custom Glassmorphism tokens)
- **State Management:** Zustand
- **Icons:** Lucide React

### Backend
- **Server:** Node.js + Express.js v5
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (Hosted on Render)
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs
- **Language:** TypeScript

### Deployment
- **Platform:** Render (Web Service Blueprint)
- **Infrastructure:** Unified CI/CD build process serving optimized static frontend bundles directly from the Express backend via Catch-All routing.

---

## 🚀 Local Development Setup

To run this application on your local machine:

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally

### 2. Clone the Repository
```bash
git clone https://github.com/prabhu-omkar/Balance.git
cd Balance
```

### 3. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/balance"
JWT_SECRET="your_super_secret_key"
PORT=3001
```
Run Prisma migrations and start the dev server:
```bash
npx prisma db push
npm run dev
```

### 4. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 📄 Deployment Details (Render)

This repository is pre-configured with a `render.yaml` Blueprint for 1-click zero-configuration deployment to Render.
The deployment process uses an efficient monorepo strategy:
1. `npm install` and compiles the React application via Vite.
2. `npm install` and compiles the TypeScript Express backend.
3. Automatically executes `npx prisma db push` during application startup to guarantee schema alignment with the connected PostgreSQL database.

---
<p align="center">Designed & Developed for seamless expense management.</p>
    