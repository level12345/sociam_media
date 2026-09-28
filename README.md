# Social Feed App

A full-stack social media feed with JWT authentication, image uploads, and a paginated post feed.

## Features

- Signup and login (JWT + bcrypt)
- Create and delete posts with images
- Paginated feed, newest first
- Per-user status updates

## Tech Stack

- **Frontend:** React, React Router, Vite
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Infrastructure:** Docker Compose, MongoDB Atlas, AWS (EC2, S3)

## Running Locally

1. Create `server/.env` (MongoDB URI, JWT secret, AWS credentials) and `client/.env` (`VITE_API_URL`).
2. From the project root, run `docker compose up --build`.
3. Frontend: http://localhost:4000 — Backend API: http://localhost:3001

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/auth/signup` | Create an account |
| POST | `/auth/login` | Log in and receive a JWT |
| GET | `/feed/posts` | List posts |
| POST | `/feed/post` | Create a post |
| GET | `/feed/post/:postId` | Get a post |
| PUT | `/feed/post/:postId` | Update a post |
| DELETE | `/feed/post/:postId` | Delete a post |
| GET | `/feed/status` | Get your status |
| PUT | `/feed/status` | Update your status |

## Deployment

Runs privately on AWS EC2 with Docker Compose.

## Status

- Post editing is temporarily disabled
- Socket.io and automated tests not yet added
