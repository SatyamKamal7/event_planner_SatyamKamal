# Event Planner Application  
Author: Satyam Kamal  
Repository: [event_planner_SatyamKamal](https://github.com/SatyamKamal/event_planner_SatyamKamal)  
Deployed App:[Live on Vercel](https://event-planner-satyam-kamal.vercel.app/)  
Demo link: (https://drive.google.com/file/d/1xo0F-2WDyYSBn7lAywUlBgVygmGYGalc/view?usp=drivesdk)

---

# Project Overview
The Event Planner Application is a full-stack web solution designed to help users manage and participate in events seamlessly.  
It allows admins to create and manage events and view RSVP summaries, while users can explore upcoming events, view event details, and RSVP with options like Going, Maybe, or Decline.  
All actions are validated and securely managed using JWT-based authentication and a PostgreSQL database.

This project fulfills these following properties:
- Secure authentication
- Role-based access (Admin/User)
- CRUD operations for events
- RSVP management with constraints
- Responsive UI & meaningful feedback
- Data validation & testing
- Proper documentation and demo video

---

# Objectives
- Build a responsive web application for event planning and participation.
- Implement CRUD functionality for events.
- Ensure proper authentication and authorization using JWT.
- Allow users to RSVP and modify their response before the event date.
- Enforce backend validations (no duplicate RSVPs, valid dates, etc.).
- Provide clear API documentation and testing coverage.
- Deploy a working demo with live access.

---

# Features

# Admin
- Create, update, and delete events.  
- View RSVP summary for each event.  
- View all users who have RSVP’d for specific events.

# User
- Register and login securely (JWT-based).  
- View all upcoming events.  
- View event details with description, date, time, and location.  
- RSVP as Going, Maybe, or Decline.  
- Edit RSVP before the event date.
- Prevent duplicate RSVPs.

# General
- Fully responsive UI (desktop + mobile).  
- Real-time validation and feedback messages.  
- Secure REST API using Express.js.  
- Data stored in PostgreSQL with Sequelize ORM.  
- Deployed and accessible on Vercel.

---

# ER Diagram (Entity Relationship Overview)

Entities:
1. User
   - `id (PK)`
   - `name`
   - `email`
   - `passwordHash`
   - `role` (Admin/User)
   - `createdAt`

2. Event
   - `id (PK)`
   - `title`
   - `description`
   - `date`
   - `start_time`
   - `end_time`
   - `location`
   - `created_by (FK -> User.id)`

3. RSVP
   - `id (PK)`
   - `user_id (FK -> User.id)`
   - `event_id (FK -> Event.id)`
   - `status` (Going/Maybe/Decline)
   - `updated_at`

Relationships:
- A User can create many Events.
- A User can RSVP to many Events (Many-to-Many via `RSVP`).
- Each RSVP is unique per (user_id, event_id) → prevents duplicates.

---

# Tech Stack

# Frontend
- React (JavaScript)
- Axios
- React Router
- Tailwind CSS / CSS Modules

# Backend
- Node.js
- Express.js
- PostgreSQL (via Sequelize ORM)
- JWT Authentication (jsonwebtoken, bcrypt)
- CORS enabled REST API

---

# Installation & Setup

# Prerequisites
- Node.js (v16+)
- PostgreSQL
- Git

1- Clone the repository
```bash
git clone https://github.com/SatyamKamal/event_planner_SatyamKamal.git
cd event_planner_SatyamKamal

2- setup backend
cd backend
npm install

I- create a .env file inside /backend with:
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/event_planner
JWT_SECRET=your_jwt_secret

II- run migration and seed data
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

III- start backend
npm run dev

3- setup frontend
cd ../frontend
npm install
npm run dev
