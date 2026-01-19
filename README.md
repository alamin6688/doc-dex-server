# 🏥 DocDex Server

DocDex is a comprehensive **Doctor Appointment Booking System** backend built with robust technologies to facilitate seamless interaction between doctors, patients, and administrators. It features role-based access control, secure authentication, real-time scheduling, and payment integration.

---

## 🚀 Key Features

- **👨‍⚕️ Doctor Management**: Doctors can manage their profiles, set schedules, and view appointments.
- **🏥 Patient Portal**: Patients can search for doctors, book appointments, and manage medical records.
- **📅 Smart Scheduling**: Dynamic scheduling system with conflict detection and cron-job cleanup for unpaid appointments.
- **💳 Payment Integration**: Secure stripe payment gateway for appointment fees.
- **💊 Prescriptions**: Digital prescription management.
- **⭐ Reviews & Ratings**: Platform for patients to review doctors.
- **📊 Admin Dashboard**: Comprehensive analytics and user management.
- **🔐 Secure Auth**: JWT-based authentication with role-based authorization.

---

## 🛠 Tech Stack

### Core
- ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) **TypeScript**: Strongly typed language for reliability.
- ![Express.js](https://img.shields.io/badge/express.svg?style=for-the-badge&logo=express&logoColor=white) **Express.js**: Fast, unopinionated web framework.
- ![NodeJS](https://img.shields.io/badge/node.js-6DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white) **Node.js**: Runtime environment.

### Database & ORM
- ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) **PostgreSQL**: Relational database.
- ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) **Prisma**: Next-generation ORM for TypeScript.

### Tools & Libraries
- **Validation**: `Zod` (Schema validation)
- **Auth**: `bcryptjs`, `jsonwebtoken`
- **Payment**: `Stripe`
- **File Upload**: `Multer`, `Cloudinary`
- **Scheduling**: `node-cron`
- **AI Integration**: `OpenAI`

---

## 📂 Project Structure

The project follows a modular pattern for scalability.

```
src/
├── app/
│   ├── modules/            # Feature-based modules
│   │   ├── auth/           # Authentication
│   │   ├── user/           # User management
│   │   ├── doctor/         # Doctor specific logic
│   │   ├── patient/        # Patient specific logic
│   │   ├── appointment/    # Booking management
│   │   ├── schedule/       # Master schedule management
│   │   ├── doctorSchedule/ # Doctor availability
│   │   ├── payment/        # Payment processing
│   │   └── ...
│   ├── middlewares/        # Global middlewares (Auth, Validation)
│   └── routes/             # Main route aggregator
├── helper/                 # Utility functions
├── shared/                 # Shared resources (Prisma client, etc.)
└── server.ts               # Entry point
```

---

## 👥 Roles & Capabilities

The system defines 4 primary roles:

| Role | Description | Key Capabilities |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Root Access | Manage admins, System-wide settings. |
| **ADMIN** | Manager | Manage users, doctors, master schedules. |
| **DOCTOR** | Service Provider | Set availability, Prescribe, View Appointments. |
| **PATIENT** | End User | Book appointments, Pay, Review. |

---

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd docDex-server
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/docdex"
    NODE_ENV="development"
    PORT=5000
    JWT_SECRET="your_secret"
    STRIPE_SECRET_KEY="sk_test_..."
    CLOUDINARY_CLOUD_NAME="..."
    CLOUDINARY_API_KEY="..."
    CLOUDINARY_API_SECRET="..."
    ```

4.  **Database Migration**
    ```bash
    npx prisma migrate dev
    ```

5.  **Run Server**
    ```bash
    pnpm dev
    ```

---

## 🔌 API Endpoints (POST Methods)

Here is a list of key `POST` endpoints for resource creation.

### Auth
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/user/create-doctor` - Register a new doctor (Multipart/form-data)
- `POST /api/v1/user/create-patient` - Register a new patient (Multipart/form-data)
- `POST /api/v1/user/create-admin` - Register a new admin (Multipart/form-data)

### Scheduling
- `POST /api/v1/schedule` - Create master schedule slots (Admin)
- `POST /api/v1/doctor-schedule` - Create doctor availability slots (Doctor)

### Appointment & Payment
- `POST /api/v1/appointment` - Book an appointment
- `POST /api/v1/payment/init-payment/:appointmentId` - Initialize payment

### Medical
- `POST /api/v1/prescription` - Create a prescription (Doctor)
- `POST /api/v1/review` - specific endpoints for review creation

### Other
- `POST /api/v1/specialties` - Create medical specialty (Multipart/form-data)

---
*Generated by Antigravity*
