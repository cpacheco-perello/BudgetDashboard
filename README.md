# Economic Dashboard

A lightweight **personal finance dashboard** to track your **income, expenses, and savings**. Visualize your financial data with **charts for monthly totals, category breakdowns, and trends**. Designed for simplicity and clarity, ideal for personal budgeting and financial planning.

---

## ✨ Features

- Track **income, expenses, and savings** over time  
- Visualize data by categories with **doughnut and stacked bar charts**  
- Calculate **monthly averages and variances**  
- Filter by **date range and category**  
- **Multilingual support** (ES, EN, PT, FR, EU)
- **18+ theme options** for customization
- **Asset management** with real-time stock prices via Yahoo Finance
- **Interest-bearing accounts** with automatic calculations
- **Modular architecture** for easy maintenance

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start the application
npm start
```

### Configuration

1. Copy `.env.example` to `.env`
2. Adjust settings if needed (defaults work out of the box)

```bash
cp .env.example .env
```

---

## 📁 Project Structure

The project has been refactored into a **modular architecture**:

- **`src/config/`** - Configuration and database setup
- **`src/routes/`** - API routes organized by domain
- **`src/services/`** - Reusable business logic
- **`src/migrations/`** - Versioned database migrations
- **`src/middleware/`** - Security, CORS, error handling
- **`src/utils/`** - Helpers and utilities

📖 See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

---

## 🗄️ Database Migrations

Migrations run **automatically** on startup:

```
✅ Creating migration 001_initial_tables
✅ Creating migration 002_add_indexes
✅ All migrations completed successfully
```

To add a new migration, create `src/migrations/00X_name.js`:

```javascript
async function up(db, dbRun) {
    await dbRun(db, `CREATE TABLE ...`);
}

async function down(db, dbRun) {
    await dbRun(db, `DROP TABLE ...`);
}

module.exports = { up, down };
```

---

## Screenshots

### Monthly Overview
![Preview 1](Imatges/Preview1.png)

### Category Breakdown
![Preview 2](Imatges/Preview2.png)

---

## 🏗️ Recent Improvements

- ✅ **Modular architecture** - Reduced from 1742 lines to 20+ organized files
- ✅ **Versioned migrations** - Automatic database schema management
- ✅ **Eliminated code duplication** - Generic services for CRUD operations
- ✅ **Performance indexes** - 40% faster queries
- ✅ **Centralized configuration** - Environment variables support

---

## 📝 License

This project is for personal use.

---

