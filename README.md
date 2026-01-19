<h1 align="center">🏥 Doc Dex Server</h1>

<p align="center">
  <b>Robust Backend System for a Full-Scale Telemedicine & Doctor Appointment Platform</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-6DA55F?style=flat&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-black?style=flat&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=prisma&logoColor=white" />
</p>

---

<h2>📌 About the Project</h2>

<p>
<b>DocDex Server</b> is a production-ready backend for a Doctor Appointment Booking & Telemedicine system. It powers authentication, scheduling, payments, prescriptions, reviews, and AI-assisted features with a secure, scalable, and modular architecture.
</p>

---

<h2>🔗 Live & Repository</h2>

<ul>
  <li><b>Live APP:</b> <a href="https://doc-dex-client.vercel.app" target="_blank">https://doc-dex-client.vercel.app</a></li>
  <li><b>Live API:</b> <a href="https://doc-dex-server-production.up.railway.app" target="_blank">https://doc-dex-server-production.up.railway.app</a></li>
  <li><b>Backend Source Code:</b> <a href="https://github.com/alamin6688/doc-dex-client.git" target="_blank">https://github.com/alamin6688/doc-dex-client.git</a></li>
</ul>

---

<h2>🚀 Key Features</h2>

<ul>
  <li><b>🤖 AI Features:</b> Smart symptom analysis and intelligent doctor recommendations using OpenAI.</li>
  <li><b>🔐 Secure Authentication:</b> JWT-based auth with role-based authorization.</li>
  <li><b>👨‍⚕️ Doctor Management:</b> Profile management, schedule setup, appointment tracking.</li>
  <li><b>👤 Patient Portal:</b> Search doctors, book appointments, manage records.</li>
  <li><b>📅 Smart Scheduling:</b> Conflict detection, slot validation, cron-job cleanup for unpaid bookings.</li>
  <li><b>💳 Payment Integration:</b> Secure Stripe payment gateway.</li>
  <li><b>💊 Prescriptions:</b> Digital prescription creation & tracking.</li>
  <li><b>⭐ Reviews & Ratings:</b> Patients can review and rate doctors.</li>
  <li><b>📊 Admin Dashboard:</b> User management, analytics, and system controls.</li>
</ul>

---

<h2>🛠 Tech Stack</h2>

<h3>Core</h3>
<ul>
  <li><b>TypeScript</b> — Strongly typed backend development</li>
  <li><b>Node.js</b> — Runtime environment</li>
  <li><b>Express.js</b> — Web framework</li>
</ul>

<h3>Database & ORM</h3>
<ul>
  <li><b>PostgreSQL</b> — Relational database</li>
  <li><b>Prisma</b> — Type-safe ORM</li>
</ul>

<h3>Tools & Libraries</h3>
<ul>
  <li><b>Validation:</b> Zod</li>
  <li><b>Authentication:</b> bcryptjs, jsonwebtoken</li>
  <li><b>Payments:</b> Stripe</li>
  <li><b>File Upload:</b> Multer, Cloudinary</li>
  <li><b>Scheduling:</b> node-cron</li>
  <li><b>AI Integration:</b> OpenAI API</li>
</ul>

---

<h2>📂 Project Structure</h2>

<pre><code>src/
├── app/
│   ├── modules/            # Feature-based modules
│   │   ├── auth/           # Authentication
│   │   ├── user/           # User management
│   │   ├── doctor/         # Doctor logic
│   │   ├── patient/        # Patient logic
│   │   ├── appointment/    # Booking management
│   │   ├── schedule/       # Master schedule
│   │   ├── doctorSchedule/ # Doctor availability
│   │   ├── payment/        # Payment processing
│   │   └── ...
│   ├── middlewares/        # Auth, validation, error handling
│   └── routes/             # Main route aggregator
├── helper/                 # Utility functions
├── shared/                 # Shared resources (Prisma client, config)
└── server.ts               # Application entry point
</code></pre>

---

<h2>👥 Roles & Capabilities</h2>

<table>
  <tr>
    <th>Role</th>
    <th>Description</th>
    <th>Key Capabilities</th>
  </tr>
  <tr>
    <td><b>SUPER_ADMIN</b></td>
    <td>Root Access</td>
    <td>Manage admins, system-wide settings</td>
  </tr>
  <tr>
    <td><b>ADMIN</b></td>
    <td>Manager</td>
    <td>Manage users, doctors, master schedules</td>
  </tr>
  <tr>
    <td><b>DOCTOR</b></td>
    <td>Service Provider</td>
    <td>Set availability, prescribe, view appointments</td>
  </tr>
  <tr>
    <td><b>PATIENT</b></td>
    <td>End User</td>
    <td>Book appointments, pay, review doctors</td>
  </tr>
</table>

---

<h2>⚙️ Installation & Setup</h2>

<h3>1️⃣ Clone the Repository</h3>
<pre><code>git clone https://github.com/alamin6688/doc-dex-server.git
cd doc-dex-server
</code></pre>

<h3>2️⃣ Install Dependencies</h3>
<pre><code>pnpm install
# or
npm install
</code></pre>

<h3>3️⃣ Environment Setup</h3>
<p>Create a <b>.env</b> file in the root directory:</p>
<pre><code>DATABASE_URL="postgresql://user:password@localhost:5432/docdex"
NODE_ENV="development"
PORT=5000
JWT_SECRET="your_secret"
STRIPE_SECRET_KEY="sk_test_..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
</code></pre>

<h3>4️⃣ Database Migration</h3>
<pre><code>npx prisma migrate dev
</code></pre>

<h3>5️⃣ Run the Server</h3>
<pre><code>pnpm dev
</code></pre>

---

<h2>🔌 API Endpoints (POST)</h2>

<h3>Auth</h3>
<ul>
  <li>POST /api/v1/auth/login</li>
  <li>POST /api/v1/auth/refresh-token</li>
  <li>POST /api/v1/user/create-doctor</li>
  <li>POST /api/v1/user/create-patient</li>
  <li>POST /api/v1/user/create-admin</li>
</ul>

<h3>Scheduling</h3>
<ul>
  <li>POST /api/v1/schedule</li>
  <li>POST /api/v1/doctor-schedule</li>
</ul>

<h3>Appointment & Payment</h3>
<ul>
  <li>POST /api/v1/appointment</li>
  <li>POST /api/v1/payment/init-payment/:appointmentId</li>
</ul>

<h3>Medical</h3>
<ul>
  <li>POST /api/v1/prescription</li>
  <li>POST /api/v1/review</li>
</ul>

<h3>Other</h3>
<ul>
  <li>POST /api/v1/specialties</li>
</ul>

---

<h2>📜 License</h2>
<p>This project is licensed under the MIT License.</p>

<p align="center">⚡ Built for scalable, intelligent healthcare systems</p>
