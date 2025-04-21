# Todo Application with Authentication

A full-stack todo application built with Node.js, Express, React, SQLite3, and Tailwind CSS.

## Features

- User authentication (register/login)
- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Modern UI with Tailwind CSS
- SQLite3 database for data persistence

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm run dev
   ```
2. In a new terminal, start the frontend development server:
   ```bash
   cd client
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3051
JWT_SECRET=your-super-secret-key-change-this-in-production

# Bunny SDK Configuration
BUNNY_BASE_URL=https://rich.bunny.com
BUNNY_ACCESS_TOKEN=xxx
BUNNY_PRICE_LIST_CODE=notes_monthly
```

## API Endpoints

### Authentication

- POST `/api/register` - Register a new user
- POST `/api/login` - Login user

### Todos

- GET `/api/todos` - Get all todos for authenticated user
- POST `/api/todos` - Create a new todo
- PUT `/api/todos/:id` - Update a todo
- DELETE `/api/todos/:id` - Delete a todo
