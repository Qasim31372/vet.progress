# 🐾 Vet Learn Hub - Complete Veterinary Learning & Clinical Case Portal
### *Full-Stack Veterinary Case Registry, Diagnostic Library & Multi-Role Education Management System*

> **Ready-to-Deploy Node.js & Express SaaS with Isolated Student, Teacher & Doctor Panels + Google Drive Cloud Storage Sync.**

---

## 🌟 Overview
**Vet Learn Hub** is a state-of-the-art veterinary clinical management and medical learning platform built with **Node.js, Express, Tailwind CSS, and Google Drive Cloud Integration**. 

It provides an all-in-one digital solution for **Veterinary Universities, Animal Hospitals, Field Practitioners, and DVM Students**. Field veterinarians upload real-world patient cases, verified clinical professors/teachers review and approve records with pedagogical clinical pearls, and students study verified cases, dosages, and drug formularies.

---

## 🚀 Key Modules & 3 Isolated Panels

### 🎓 1. Student Learning Panel (`/` & `/student/dashboard.html`)
* **Interactive Case Study Explorer:** Browse approved clinical cases by species category (Cattle, Buffalo, Equine, Dogs, Cats, Poultry, Wildlife).
* **Clinical Search Engine:** Search by diagnosis, symptoms, prescribed medication, or doctor name.
* **Student Study Bookmarks:** Bookmark and save critical clinical cases to review before rounds and board exams (stored seamlessly).
* **Veterinary Drug & Medication Formulary:** Quick tabular reference of medications, active compounds, and dosages extracted from real-world successful treatments.
* **Student Case Inspector Modal:** High-resolution clinical media photos, species details, diagnosis, treatment regimens, and **Student Clinical Pearls / Study Takeaways**.
* **Student Authentication:** Dedicated registration and login supporting university name, semester, and degree level.

### 👨‍🏫 2. Teacher & Faculty Panel (`/teacher/login.html` & `/teacher/dashboard.html`)
* **Pending Case Review Queue:** Review doctor-submitted clinical cases with high-resolution photos and diagnostic findings.
* **One-Click Approval:** Approve verified cases to instantly publish them to the live Student Learning Hub.
* **Instructive Rejection Feedback:** Send pedagogical feedback notes to doctors explaining required revisions.
* **Enrolled Students Directory:** Monitor registered students, universities, and academic years.
* **Contributing Doctors Directory:** View verified veterinary practitioners contributing to the repository.
* **Google Drive Cloud Sync & Restore:** One-click backup and database restore directly from Google Drive.

### 🩺 3. Doctor / Practitioner Portal (`/doctor/login.html` & `/doctor/dashboard.html`)
* **Case Submission Form:** Submit clinical records with case title, species, category, symptoms, diagnosis, treatment/medication protocol, and outcome status (*Recovered, Under Treatment, Chronic, Deceased*).
* **Multi-Image Media Upload:** Attach clinical photos and diagnostics (automatically synced to Google Drive).
* **Doctor Case History:** Track the verification status of submitted cases (*Pending Review, Approved, or Rejected with teacher notes*).
* **Doctor Registration:** Practitioner authentication with clinic name and veterinary specialization.

---

## ⚡ Core Features & Technical Highlights

* **100% Responsive & Modern UI:** Designed with **Tailwind CSS**, FontAwesome icons, glassmorphism navigation, and dark/light modes.
* **Direct Google Drive Media & DB Sync:**
  * Media files sync to Google Drive via Google Apps Script or OAuth2 API.
  * Automatic fallback to local uploads directory if Drive credentials are not supplied.
  * Asynchronous background cloud sync prevents request blocking.
* **Robust Role-Based Access Control (RBAC):**
  * Secure password hashing with **bcryptjs**.
  * Stateless token authorization using **JSON Web Tokens (JWT)**.
  * Isolated endpoints for `/api/student`, `/api/teacher`, `/api/doctor`, and `/api/auth`.
* **Zero Complex Database Setup Required:**
  * Uses an atomic JSON-based local database engine with synchronous safe writes (`db.json.tmp` -> `db.json`).
  * Easily extensible to MongoDB, PostgreSQL, or MySQL if needed.
* **Ready for 1-Click Cloud Deployment:** Works out-of-the-box on **Render.com, Railway.app, Heroku, AWS, or Ubuntu VPS**.

---

## 🛠️ Technology Stack
* **Backend:** Node.js (v18, v20, v22), Express.js (v4.21+)
* **Frontend:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS (via CDN), FontAwesome 6
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
* **File Uploads:** `multer` with disk storage and cloud streaming
* **Cloud Integration:** Google Drive API v3 / Google Apps Script Web App
* **Data Storage:** High-performance atomic JSON database with Drive backup

---

## 📦 What's Included in the Download Package?
1. **Full Unminified Source Code** (Node.js & Express backend + complete frontend)
2. **Complete HTML Documentation** (`documentation/index.html`)
3. **Seed Database** with pre-configured demo users (Student, Teacher, Doctor)
4. **Google Apps Script code snippet** for 2-minute Drive setup
5. **Environment Configuration Template** (`.env.example`)
6. **Free Lifetime Updates**

---

## 🔑 Default Demo Login Credentials
* **Student Panel:**
  * URL: `http://localhost:3000/student/login.html`
  * Email: `student@vetlearnhub.com` | Password: `student123`
* **Teacher Panel:**
  * URL: `http://localhost:3000/teacher/login.html`
  * Email: `teacher@vetlearnhub.com` | Password: `teacher123`
* **Doctor Portal:**
  * URL: `http://localhost:3000/doctor/login.html`
  * Direct signup available from the portal!

---

## 🏷️ Relevant Tags & Keywords (For CodeCanyon / Gumroad)
`veterinary portal`, `vet medical portal`, `clinical case study`, `veterinary software`, `medical education saas`, `animal clinic script`, `vet hospital management`, `google drive upload`, `nodejs express saas`, `tailwind medical template`, `student learning portal`, `dvm education`
