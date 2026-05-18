# CityFix Server

Backend API for Public Infrastructure Issue Reporting System

---

## About

CityFix Server is a backend API that powers the CityFix platform.

It handles:
- User authentication
- Issue reporting system
- Role management (Citizen, Staff, Admin)
- Payment system
- Issue tracking

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Firebase Admin
- Stripe (Payment)

---

## Features

### Authentication
- Email/password login
- Google login support
- JWT token system

### Role System
- Citizen → report issues
- Staff → handle issues
- Admin → manage system

### Issue System
- Create / update / delete issues
- Status flow:
  Pending → In Progress → Working → Resolved → Closed

### Payment System
- Issue boost payment
- Premium subscription
- Stripe integration

### Other Features
- Role-based access control
- Search and filter
- Pagination
- Timeline tracking

---

## Database Collections

- users
- issues
- payments
- timelines
- subscriptions

---

## Installation

git clone https://github.com/amimahedihasan/CityFix-Server.git
cd CityFix-Server
npm install
npm run dev

---

## Environment Variables

PORT=5000
DB_USER=your_db_user
DB_PASS=your_db_pass
ACCESS_TOKEN_SECRET=your_secret
STRIPE_SECRET_KEY=your_key
FIREBASE_PROJECT_ID=your_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY=your_key

---

## API Overview

### User
- Register
- Login
- Update profile

### Issues
- Create issue
- Get issues
- Update issue
- Delete issue

### Staff
- Assign issues
- Update status

### Payments
- Create payment
- Save payment data

---

## Project Goal

CityFix Server is built to simulate a real-world municipal issue management system.

---

## Summary

- REST API backend
- Authentication system
- Role-based access
- Payment integration
- Issue tracking system
