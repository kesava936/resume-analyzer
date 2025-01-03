# 📄 Resume Analyzer & Scoring System

A full-stack web application that analyzes resumes (PDF), extracts text, detects skills, and calculates a score based on predefined criteria.

---

## 🚀 Features

- 📤 Upload resume (PDF)
- 📑 Extract text using pdf-parse
- 🧠 Detect skills using regex matching
- 📊 Calculate score (10 points per skill, max 100)
- 💾 Store data in MySQL database
- 🔍 Search functionality for resumes
- 🌐 Simple frontend for students & admin

---

## 🛠 Tech Stack

### Backend
- Node.js
- Express.js
- Multer
- pdf-parse

### Frontend
- HTML
- CSS (Tailwind)
- JavaScript

### Database
- MySQL

---

## 📂 Project Structure
resume-system/
│
├── backend/
│ ├── config/
│ │ └── db.js
│ │
│ ├── controllers/
│ │ ├── searchController.js
│ │ ├── skillsController.js
│ │ └── uploadController.js
│ │
│ ├── middleware/
│ │ └── multerConfig.js
│ │
│ ├── models/
│ │
│ ├── routes/
│ │ ├── searchRoutes.js
│ │ ├── skillsRoutes.js
│ │ └── uploadRoutes.js
│ │
│ ├── services/
│ │ ├── scoringService.js
│ │ ├── skillService.js
│ │ └── uploadService.js
│ │
│ ├── uploads/
│ │
│ ├── .env
│ ├── package.json
│ ├── package-lock.json
│ └── server.js
│
├── frontend/
│ ├── admin.html
│ ├── admin.js
│ ├── index.html
│ ├── student.html
│ └── student.js
│
├── .gitignore
└── README.md


---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/kesavasasank/resume-analyzer.git
cd resume-system

2. Install dependencies
cd backend
npm install

3. Setup MySQL Database
CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255),
    stored_name VARCHAR(255),
    file_path TEXT,
    mime_type VARCHAR(100),
    size INT,
    skills TEXT,
    score INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

4. Configure Environment Variables

Create .env file inside backend/:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=resume_db
PORT=3000

5. Run the server
npm start
Server runs on:
http://localhost:3000

📡 API Endpoints
Upload Resume
POST /upload
Search Resumes
GET /search
Get Skills Data
GET /skills
🧠 Scoring Logic
Each detected skill = 10 points
Maximum score = 100
🔄 Application Flow

Upload → Extract Text → Detect Skills → Calculate Score → Save to Database → Response

⚠️ Notes
Only PDF files are supported
Skills are matched using predefined list
Uploaded files are stored in /uploads
🤝 Contribution Rules
Do not modify backend without approval
Work mainly in frontend
Use separate branches for new features
Always create Pull Requests before merging
📌 Future Improvements
AI-based skill extraction
Resume ranking system
Job-role based scoring
Improved UI/UX
👨‍💻 Author

Kesava Sasank

📄 License

This project is for educational purposes.


---

## ✅ After pasting

Run:

```bash
git add README.md
git commit -m "Updated README"
git push origin update-changes
