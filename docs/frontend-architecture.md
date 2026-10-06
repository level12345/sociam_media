# Frontend Architecture — Sociam_media client

| | |
|---|---|
| **Scope** | React client (`client/`) and how it talks to the Express API (`server/`) |
| **Stack** | React 19, React Router 7 (declarative mode), Vite 6 dev server, `fetch` for HTTP |
| **Status** | Mid-migration from class components to hooks. Converted: `App`, `SinglePost`, `Login`. Remaining: `Signup`, `Feed`, `FeedEdit`. Gaps are listed in [Known issues](#7-known-issues) |
| **Last updated** | 2026-10-05 |

## Contents

1. [System context](#1-system-context)
2. [Component tree](#2-component-tree)
3. [Route map](#3-route-map)
4. [Auth session state machine](#4-auth-session-state-machine)
5. [Sequence diagrams](#5-sequence-diagrams)
6. [Feed page state machine](#6-feed-page-state-machine)
7. [Known issues](#7-known-issues)

---

## 1. System context

Where the client sits. Ports come from `docker-compose.yml`.

```mermaid
flowchart LR
    user(["User"])
    subgraph browser["Browser"]
        spa["React SPA<br/>(JS bundle)"]
        ls[("localStorage<br/>token, userId, expiryDate")]
    end
    vite["Vite dev server<br/>:4000<br/>serves index.html + bundle"]
    api["Express API<br/>:3001<br/>/auth, /feed"]
    db[("MongoDB")]
    img[("server/images<br/>uploaded files")]

    user --> spa
    vite -- "HTML + JS (once, on load)" --> spa
    spa <--> ls
    spa -- "JSON over HTTP<br/>Authorization: Bearer JWT" --> api
    api --> db
    api --> img
```

---

## 2. Component tree

What renders inside what. `App` owns auth and UI-chrome state and passes it down as props.

```mermaid
flowchart TD
    index["index.jsx<br/>createRoot().render()"] --> br["BrowserRouter<br/>holds current URL"]
    br --> app["App<br/>state: isAuth, token, userId,<br/>authLoading, error,<br/>showBackdrop, showMobileNav"]

    app --> backdrop["Backdrop<br/>(when showBackdrop)"]
    app --> err["ErrorHandler<br/>modal when error is set"]
    app --> layout["Layout"]
    layout --> routes["Routes (children, inside main)<br/>table chosen by isAuth"]

    layout --> toolbar["Toolbar"] --> mainnav["MainNavigation"]
    mainnav --> logo["NavLink to / (Logo)"]
    mainnav --> navitems1["NavigationItems"]
    layout --> mobilenav["MobileNavigation"] --> navitems2["NavigationItems (mobile)"]

    routes -- "logged out" --> login["LoginPage"]
    routes -- "logged out" --> signup["SignupPage"]
    routes -- "logged in" --> feed["FeedPage"]
    routes -- "logged in" --> single["SinglePostPage"]

    feed --> feedEdit["FeedEdit modal"]
    feed --> paginator["Paginator"] --> post["Post (x N)"]
```

**Props that cross the tree**

| From | To | Props |
|---|---|---|
| `App` | `MainNavigation`, `MobileNavigation` → `NavigationItems` | `isAuth`, `onLogout` (+ `onChoose` for mobile) |
| `App` | `LoginPage` / `SignupPage` | `onLogin` / `onSignup`, `loading` |
| `App` | `FeedPage`, `SinglePostPage` | `token`, `userId` |
| `FeedPage` | `FeedEdit` | `editing`, `selectedPost`, `loading`, `onCancelEdit`, `onFinishEdit` |
| `FeedPage` | `Post` | `id`, `author`, `date`, `title`, `onDelete` |

---

## 3. Route map

Frontend route → screen → backend calls it makes. Two route tables exist; `isAuth` picks one.

| Table | Path | Renders | API calls on mount | API calls from user actions |
|---|---|---|---|---|
| Logged out | `/` | `LoginPage` | none | `POST /auth/login` |
| Logged out | `/signup` | `SignupPage` | none | `PUT /auth/signup` |
| Logged out | `*` | `Navigate` → `/` | — | — |
| Logged in | `/` | `FeedPage` | `GET /feed/status`, `GET /feed/posts?page=1` | `PUT /feed/status`, `POST /feed/post`, `DELETE /feed/post/:id`, `GET /feed/posts?page=N` |
| Logged in | `/:postId` | `SinglePostPage` | `GET /feed/post/:postId` | none |
| Logged in | `*` | `Navigate` → `/` | — | — |

All `/feed/*` calls send `Authorization: Bearer <token>`.

---

## 4. Auth session state machine

The session lives in `App` state and is mirrored to `localStorage` so it survives a reload. The token expires after 1 hour (server `expiresIn: "1h"`, client timer).

```mermaid
stateDiagram-v2
    [*] --> CheckingStorage: app mounts

    CheckingStorage --> LoggedOut: no token or no expiryDate
    CheckingStorage --> LoggedOut: expiryDate in the past / clear storage
    CheckingStorage --> LoggedIn: valid token / restore state, start timer

    LoggedOut --> Authenticating: submit login form
    Authenticating --> LoggedIn: 200 / save token, userId, expiryDate, start 1h timer
    Authenticating --> LoggedOut: 401 or 422 / show error modal

    LoggedOut --> SigningUp: submit signup form
    SigningUp --> LoggedOut: 201 / navigate to "/" (login)
    SigningUp --> LoggedOut: 422 / show error modal

    LoggedIn --> LoggedOut: Logout clicked / clear storage
    LoggedIn --> LoggedOut: timer fires / clear storage
```

| State | `isAuth` | `authLoading` | Route table | Nav links shown |
|---|---|---|---|---|
| CheckingStorage | false | false | logged out | Login, Signup |
| LoggedOut | false | false | logged out | Login, Signup |
| Authenticating / SigningUp | false | true | logged out | Login, Signup (button shows "Loading...") |
| LoggedIn | true | false | logged in | Feed, Logout |

---

## 5. Sequence diagrams

### 5.1 Initial load (logged out) and NavLink click

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant B as Browser
    participant V as Vite server
    participant RR as React Router
    participant A as App
    participant R as Routes

    U->>B: open http://host:4000/
    B->>V: GET /
    V-->>B: index.html + JS bundle
    B->>A: run index.jsx, createRoot().render()
    RR->>B: read window.location.pathname
    B-->>RR: "/"
    A->>A: mount effect: no token in localStorage
    A->>R: isAuth false, logged-out table
    R->>R: match "/" to LoginPage
    R-->>B: DOM for login page, browser paints

    U->>B: click Signup link
    B->>RR: click event on the a tag
    RR->>RR: preventDefault(), navigate("/signup")
    RR->>B: history.pushState("/signup")
    Note over B,V: No request to the server
    RR->>R: location changed, re-render
    R->>R: match "/signup" to SignupPage
    R-->>B: DOM for signup page, browser paints
```

### 5.2 Login

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant L as LoginPage
    participant A as App
    participant API as Express API
    participant LS as localStorage

    U->>L: submit form
    L->>A: onLogin(event, {email, password})
    A->>A: preventDefault(), authLoading = true
    A->>API: POST /auth/login
    alt 200 OK
        API-->>A: { token, userId }
        A->>A: isAuth = true, token, userId, authLoading = false
        A->>LS: set token, userId, expiryDate (now + 1h)
        A->>A: setAutoLogout(1h)
        Note over A: Re-render picks the logged-in table. URL stays "/" but "/" now renders FeedPage
    else 401 / 422 / network error
        API-->>A: error
        A->>A: isAuth = false, authLoading = false, error = err
        Note over A: ErrorHandler shows modal
    end
```

### 5.3 Session restore on reload

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant A as App
    participant LS as localStorage
    participant F as FeedPage

    B->>A: first render (isAuth false, login screen)
    A->>LS: mount effect: read token, expiryDate
    alt token valid
        LS-->>A: token, expiryDate, userId
        A->>A: isAuth = true, token, userId
        A->>A: setAutoLogout(remaining ms)
        A->>F: re-render with logged-in table
        Note over B,A: Login screen flashes briefly before the feed (effect runs after first paint)
    else missing or expired
        A->>LS: clear token, expiryDate, userId
        Note over A: stays on login screen
    end
```

### 5.4 Feed load and pagination

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant F as FeedPage
    participant API as Express API

    F->>API: GET /feed/status (Bearer token)
    API-->>F: { status }
    F->>API: GET /feed/posts?page=1
    API-->>F: { posts, totalItems }
    F->>F: posts, totalPosts, postsLoading = false
    Note over F: Paginator lastPage = ceil(totalPosts / 2)

    U->>F: click Next
    F->>F: postsLoading = true, posts = [], postPage + 1
    F->>API: GET /feed/posts?page=2
    API-->>F: { posts, totalItems }
    F->>F: render page 2
```

### 5.5 Create and delete a post

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant F as FeedPage
    participant E as FeedEdit
    participant API as Express API

    U->>F: click New Post
    F->>F: isEditing = true
    F->>E: editing = true, modal opens
    U->>E: fill title, image, content, click Accept
    E->>F: onFinishEdit({title, image, content})
    F->>F: editLoading = true
    F->>API: POST /feed/post (multipart FormData)
    API-->>F: 201 { post }
    F->>F: isEditing = false, editLoading = false
    Note over F: New post is NOT added to the list (see Known issues)

    U->>F: click Delete on a post
    F->>F: postsLoading = true
    F->>API: DELETE /feed/post/:id
    API-->>F: 200
    F->>API: GET /feed/posts?page=N (reload page)
```

---

## 6. Feed page state machine

```mermaid
stateDiagram-v2
    [*] --> Loading: mount / fetch status + posts

    Loading --> Empty: 0 posts
    Loading --> Showing: posts returned
    Loading --> ErrorModal: fetch failed

    Showing --> Loading: Next / Previous
    Showing --> Loading: Delete (then reload page)
    Showing --> Editing: New Post
    Empty --> Editing: New Post

    Editing --> Showing: Cancel
    Editing --> Saving: Accept
    Saving --> Showing: 201
    Saving --> ErrorModal: request failed

    ErrorModal --> Showing: Okay / backdrop click
```

---

## 7. Known issues

Found while documenting. Ordered by impact.

| # | Area | Issue | Effect |
|---|---|---|---|
| 1 | `SinglePost` | ~~Reads `this.props.match.params` (removed API)~~ | **Fixed 2026-10-05:** converted to a function component using `useParams` |
| 2 | `Feed` create | `POST` success branch never inserts the new post (`addPost` is unused, socket emits are commented out server-side) | New post doesn't appear until reload or page change |
| 3 | `Feed` edit | Edit button commented out in `Post`, `updatePost` is empty | Editing is unreachable |
| 4 | `App` layout | ~~Routes render as a sibling of `Layout`~~ | **Fixed 2026-10-05:** routes passed as `Layout` children, render inside `<main>` |
| 5 | Auth | Bad/expired token returns **500** from `is-auth` middleware instead of 401, and the client has no 401 handling | Server-side expiry shows a generic error instead of logging out |
| 6 | Auth | Auto-logout `setTimeout` is never cleared | Stale timer can fire after a manual logout + new login |
| 7 | Auth | `logoutHandler` doesn't reset `userId` | Stale `userId` in state after logout |
| 8 | Auth | Session restore runs in an effect after first paint | Brief login-page flash on reload when logged in |
| 9 | `Feed` | `socket.io-client` imported but unused | Dead import |
| 11 | `GET /feed/status` | ~~`User.findById` not awaited, so `status` was missing from the response~~ | **Fixed 2026-10-05:** added `await` (caused the controlled-to-uncontrolled input warning) |
| 10 | `NavigationItems` | `NavLink exact` prop (removed in v6+) | Console warning. Use `end` |
