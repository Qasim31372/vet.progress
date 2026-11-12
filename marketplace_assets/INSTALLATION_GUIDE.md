# 📦 Vet Learn Hub - Installation & Setup Guide

Thank you for purchasing **Vet Learn Hub**! Follow this quick guide to set up the application on your computer, local server, or production cloud host.

---

## 📋 Prerequisites
Ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **NPM**: v9.0.0 or higher (comes bundled with Node.js)
* **Git**: (Optional, for version control)

---

## ⚡ Local Setup (Windows, macOS, Linux)

### Step 1: Extract Files
Extract the purchased `.zip` archive into your desired directory:
```bash
cd vet-learn-hub
```

### Step 2: Install NPM Dependencies
Open your terminal or command prompt inside the project folder and run:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your own `.env` file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```
Open `.env` in any text editor to customize your credentials or ports (default values are ready to use immediately).

### Step 4: Run the Server
Start the production server:
```bash
npm start
```
Or start in development mode with automatic restart on file changes:
```bash
npm run dev
```

Your server will start on: **`http://localhost:3000`**

---

## 🔑 Default Login Credentials

| Role | Portal URL | Email | Password |
|---|---|---|---|
| **Student** | `http://localhost:3000/student/login.html` | `student@vetlearnhub.com` | `student123` |
| **Teacher** | `http://localhost:3000/teacher/login.html` | `teacher@vetlearnhub.com` | `teacher123` |
| **Doctor** | `http://localhost:3000/doctor/login.html` | Create account directly via signup tab! | Any password |

---

## ☁️ Deploying to Render.com (Free Web Service)

1. Push this project to your GitHub account as a private or public repository.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Enter the following build settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
6. Under **Environment Variables**, add:
   * `PORT`: `10000` (or leave default)
   * `JWT_SECRET`: `your_random_secret_string`
   * `TEACHER_EMAIL`: `teacher@yourdomain.com`
   * `TEACHER_PASSWORD`: `your_secure_password`
7. Click **Create Web Service**. Your application will be live in 2 minutes!

---

## 📁 Project Directory Structure
```text
vet-learn-hub/
├── config/             # Google Drive & cloud integration logic
├── data/               # Atomic JSON database (db.json)
├── db/                 # Database engine & seed functions
├── middleware/         # JWT authentication & role-based access control (RBAC)
├── public/             # Frontend assets (HTML, CSS, JS)
│   ├── student/        # Student dashboard & login
│   ├── teacher/        # Teacher & faculty dashboard & login
│   ├── doctor/         # Doctor portal & login
│   ├── js/             # Client-side JavaScript
│   └── css/            # Custom styles & Tailwind integration
├── routes/             # REST API routing
│   ├── studentRoutes.js
│   ├── teacherRoutes.js
│   ├── doctorRoutes.js
│   └── authRoutes.js
├── uploads/            # Local media fallback storage
├── package.json        # NPM dependencies & scripts
├── server.js           # Main application entry point
└── .env.example        # Environment variable template
```

---

## 💡 Support & Customization
Need help installing or extending Vet Learn Hub with MongoDB, MySQL, or custom features? Reach out via our marketplace author profile support form.
