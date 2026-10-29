# Social Feed App

A full-stack social media feed with JWT authentication, image uploads, and a paginated post feed.

## Features

- Signup and login (JWT + bcrypt)
- Create and delete posts with images (stored in S3)
- Paginated feed, newest first
- Per-user status updates

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite; served by Nginx in production
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Infrastructure:** Docker Compose, MongoDB Atlas, AWS (EC2, S3)

## Configuration

Each machine needs its own env files. All are gitignored — never commit them.

| File | Variables | Used by |
|------|-----------|---------|
| `server/.env` | `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_ORIGIN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Backend (dev and prod) |
| `.env` (project root) | `VITE_API_URL` | Prod compose — passed to the frontend image as a build arg |
| `client/.env` | `VITE_API_URL` | Dev compose only |

- `FRONTEND_ORIGIN` is the URL the frontend is served from (CORS), e.g. `http://localhost:4000`.
- `VITE_API_URL` is the backend URL the browser calls, e.g. `http://localhost:3001`. On a server, use its public address, not `localhost`.
- Check what the prod compose resolves: `docker compose config | grep VITE`

## Running

Run from the project root.

**Development** (live reload — source is bind-mounted into the containers):

```
docker compose -f docker-compose.dev.yml up --build
```

**Production** (frontend built with `vite build` and served by Nginx; backend runs with `node`):

```
docker compose up --build
```

Frontend: http://localhost:4000 — Backend API: http://localhost:3001

After adding a package in dev, recreate the `node_modules` volumes: `docker compose -f docker-compose.dev.yml down -v`

`VITE_API_URL` is baked into the prod bundle at build time, so changing it requires a rebuild.

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/auth/signup` | Create an account |
| POST | `/auth/login` | Log in and receive a JWT |
| GET | `/feed/posts` | List posts |
| POST | `/feed/post` | Create a post (multipart, `image` field) |
| GET | `/feed/post/:postId` | Get a post |
| PUT | `/feed/post/:postId` | Update a post (not used by the UI) |
| DELETE | `/feed/post/:postId` | Delete a post |
| GET | `/feed/status` | Get your status |
| PUT | `/feed/status` | Update your status |

## Deployment

Runs privately on AWS EC2 with the production compose file. Deploy: `git pull`, then `docker compose up --build -d`, then `docker image prune -f`.

## Status

- Client fully on function components + hooks
- Post editing is not a feature (Edit button disabled)
- Socket.io scaffolded but not wired in; no automated tests yet
- Next: single-node k3s deployment

## Documentation

- [Frontend architecture](docs/frontend-architecture.md): component tree, route map, state diagrams, sequence diagrams, known issues
