# Social Feed App

A full-stack social media feed application with JWT-based authentication, image uploads, and a paginated post feed. Built with React on the frontend and Node.js/Express on the backend, backed by MongoDB.

## Features

- User signup and login with JWT authentication and bcrypt password hashing
- Create, edit, and delete posts with image uploads
- Paginated feed of posts, newest first
- Per-user status updates
- Ownership checks — only a post's creator can edit or delete it

## Tech Stack

**Frontend**
- React
- React Router
- Vite (build tool and dev server)

**Backend**
- Node.js / Express
- MongoDB with Mongoose
- JWT (`jsonwebtoken`) for stateless authentication
- bcrypt for password hashing
- Multer for image upload handling
- express-validator for request validation

**Infrastructure**
- Docker and Docker Compose for local development
- MongoDB Atlas for the database

## Getting Started

### Prerequisites

- Docker and Docker Compose
- A MongoDB Atlas connection string (or a local MongoDB instance)

### Environment Variables

Create a `.env` file inside `server/` with:

```
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<a long, randomly generated string>
PORT=3001
```

Never commit this file — it's already excluded via `.gitignore`.

### Running Locally

From the project root:

```
docker compose up --build
```

- Backend API: http://localhost:3001
- Frontend: http://localhost:4000

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Authenticate and receive a JWT |
| GET | `/feed/posts` | Get a paginated list of posts (auth required) |
| POST | `/feed/post` | Create a new post with an image (auth required) |
| GET | `/feed/post/:postId` | Get a single post (auth required) |
| PUT | `/feed/post/:postId` | Update a post (auth required, creator only) |
| DELETE | `/feed/post/:postId` | Delete a post (auth required, creator only) |
| GET | `/feed/status` | Get the logged-in user's status |
| PUT | `/feed/status` | Update the logged-in user's status |

## Project Status

This project is under active development.

- Core authentication and post CRUD flows are functional
- Real-time updates via Socket.io are scaffolded (dependency installed, init module written) but not yet wired into the running app
- Automated tests have not yet been added
- Deployment to AWS (EC2) is in progress

## Live Demo

Coming soon.
