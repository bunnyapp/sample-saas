import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import Bunny, { Subscription, Transaction } from '@bunnyapp/api-client';

// Load environment variables
dotenv.config();

// Initialize  Bunny SDK
const bunny = new Bunny({
  baseUrl: process.env.BUNNY_BASE_URL || '',
  accessToken: process.env.BUNNY_ACCESS_TOKEN || ''
});

// Type definitions
interface User {
  id: number;
  email: string;
  password: string;
  created_at: string;
}

interface Event {
  id: number;
  user_id: number;
  type: string;
  status: 'success' | 'error';
  details: string;
  created_at: string;
}

interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

interface AccountLimits {
  task_limit: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
  };
}

interface RegisterRequest extends Request {
  body: {
    email: string;
    name: string;
    companyName: string;
  }
}

interface BunnyError extends Error {
  message: string;
  code?: string;
  status?: number;
}

// GraphQL connection pattern types
interface PageInfo {
  startCursor: string;
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Edge<T> {
  cursor: string;
  node: T;
}

interface Connection<T> {
  edges: Array<Edge<T>>;
  totalCount: number;
  pageInfo: PageInfo;
}

const app = express();
const PORT = process.env.PORT || 3051;

// Update CORS configuration with environment variable support
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
app.use(
  cors({
    origin: corsOrigin, // Allow requests from specified origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  })
);
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./todo.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase(): void {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      tenant_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Account limits table
    db.run(`CREATE TABLE IF NOT EXISTS account_limits (
      user_id INTEGER PRIMARY KEY,
      task_limit INTEGER NOT NULL DEFAULT 5,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Events table
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Todos table
    db.run(`CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
  });
}

// Authentication middleware
const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader); // Debug log
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided'); // Debug log
    res.status(401).json({ error: 'Access denied' });
    return;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    (err: any, user: any) => {
      if (err) {
        console.log('Token verification error:', err); // Debug log
        res.status(403).json({ error: 'Invalid token' });
        return;
      }
      console.log('Token verified successfully for user:', user); // Debug log
      req.user = user;
      next();
    }
  );
};

// Helper function to create events
const createEvent = (userId: number, type: string, status: 'success' | 'error', details?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO events (user_id, type, status, details) VALUES (?, ?, ?, ?)',
      [userId, type, status, details || null],
      (err) => {
        if (err) {
          console.error('Error creating event:', err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

// Auth Routes
const registerHandler: RequestHandler = async (req, res) => {
  const { email, name, companyName } = req.body;

  if (!email || !name || !companyName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate Bunny SDK configuration
  if (!process.env.BUNNY_BASE_URL || !process.env.BUNNY_ACCESS_TOKEN ||
      !process.env.BUNNY_PRICE_LIST_CODE) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Bunny SDK configuration is incomplete'
    });
  }

  try {
    // Generate unique tenant code
    const tenantCode = `samplesaas-user-${randomUUID()}`;

    // Create user in our database (no password required)
    db.run(
      'INSERT INTO users (email, name, company_name, tenant_code) VALUES (?, ?, ?, ?)',
      [email, name, companyName, tenantCode],
      async function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }

        const userId = this.lastID;

        try {
          // Split the name into first and last name
          const nameParts = name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const subscriptionData = {
            trial: true,
            evergreen: true,
            accountName: companyName,
            firstName,
            lastName,
            email,
            tenantCode: tenantCode, // Using the stored unique tenant code
          };

          console.log('Creating Bunny subscription with data:', {
            priceListCode: process.env.BUNNY_PRICE_LIST_CODE,
            subscriptionData,
            bunnyConfig: {
              baseUrl: process.env.BUNNY_BASE_URL,
              hasAccessToken: !!process.env.BUNNY_ACCESS_TOKEN
            }
          });

          const subscription: Subscription = await bunny.subscriptionCreate(process.env.BUNNY_PRICE_LIST_CODE || '', subscriptionData);

          console.log('Bunny subscription creation response:', {
            subscription,
            subscriptionId: subscription?.id,
            subscriptionState: subscription?.state,
            hasSubscription: !!subscription
          });

          if (!subscription || !subscription.id) {
            // If subscription creation fails without throwing, clean up and return error
            await new Promise((resolve, reject) => {
              db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });
            await createEvent(userId, 'subscription_create', 'error', 'Invalid subscription response from Bunny');
            return res.status(500).json({
              error: 'Error creating subscription',
              details: 'Invalid subscription response from Bunny'
            });
          }

          // Log successful subscription creation
          await createEvent(userId, 'subscription_create', 'success',
            `Created subscription ${subscription.id} (${subscription.state})`);

          // Create JWT token
          const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
          );

          res.json({
            token,
            subscription: {
              id: subscription.id,
              status: subscription.state
            }
          });
        } catch (error: any) {
          console.error('Bunny subscription creation failed:', {
            error: error.message,
            errorStack: error.stack,
            errorCode: error.code,
            errorStatus: error.status,
            errorResponse: error.response?.data,
            userId,
            tenantCode,
            email,
            bunnyConfig: {
              baseUrl: process.env.BUNNY_BASE_URL,
              hasAccessToken: !!process.env.BUNNY_ACCESS_TOKEN,
              priceListCode: process.env.BUNNY_PRICE_LIST_CODE
            }
          });

          // If Bunny subscription creation fails, delete the user we just created
          await new Promise((resolve) => {
            db.run('DELETE FROM users WHERE id = ?', [userId], () => resolve(true));
          });

          await createEvent(userId, 'subscription_create', 'error',
            error.message || 'Unknown error occurred');

          res.status(500).json({
            error: 'Error creating subscription',
            details: error.message || 'Failed to create subscription'
          });
        }
      }
    );
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message || 'Unknown server error occurred'
    });
  }
};

app.post('/api/register', registerHandler);

app.post('/api/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  db.get<User>('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  });
});

// Account Limits Routes
app.get('/api/account/limits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.get<AccountLimits>(
    `SELECT task_limit FROM account_limits WHERE user_id = ?`,
    [req.user?.userId],
    (err, limits) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching account limits' });
      }
      // If no limits are set, return default values
      if (!limits) {
        // Insert default limits for the user
        db.run(
          'INSERT INTO account_limits (user_id, task_limit) VALUES (?, ?)',
          [req.user?.userId, 5],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error setting default limits' });
            }
            return res.json({ taskLimit: 5 });
          }
        );
      } else {
        res.json({ taskLimit: limits.task_limit });
      }
    }
  );
});

// Todo Routes
app.get('/api/todos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.all<Todo>(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    [req.user?.userId],
    (err, todos) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching todos' });
      }
      res.json(todos);
    }
  );
});

app.post('/api/todos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { title } = req.body;

  // First check the user's current todo count and limits
  db.get<{ todo_count: number; task_limit: number }>(
    `SELECT
      (SELECT COUNT(*) FROM todos WHERE user_id = ?) as todo_count,
      (SELECT task_limit FROM account_limits WHERE user_id = ?) as task_limit`,
    [req.user?.userId, req.user?.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking todo limits' });
      }

      const taskLimit = result?.task_limit || 5; // Default to 5 if no limit is set

      if ((result?.todo_count || 0) >= taskLimit) {
        return res.status(403).json({
          error: 'TASK_LIMIT_EXCEEDED',
          message: `Task limit of ${taskLimit} reached`,
        });
      }

      // If within limits, create the todo
      db.run(
        'INSERT INTO todos (user_id, title) VALUES (?, ?)',
        [req.user?.userId, title],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating todo' });
          }

          db.get<Todo>(
            'SELECT * FROM todos WHERE id = ?',
            [this.lastID],
            (err, todo) => {
              if (err) {
                return res.status(500).json({ error: 'Error fetching created todo' });
              }
              res.json(todo);
            }
          );
        }
      );
    }
  );
});

app.put('/api/todos/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { completed } = req.body;

  db.run(
    'UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?',
    [completed ? 1 : 0, req.params.id, req.user?.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating todo' });
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/todos/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.run(
    'DELETE FROM todos WHERE id = ? AND user_id = ?',
    [req.params.id, req.user?.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting todo' });
      }
      res.json({ success: true });
    }
  );
});

// Events Routes
app.get('/api/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.all<Event>(
    'SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC',
    [req.user?.userId],
    (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching events' });
      }
      res.json(events);
    }
  );
});

// Billing Routes
app.get('/api/billing/portal-session', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user details from database
    const user = await new Promise<User>((resolve, reject) => {
      db.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [req.user?.userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create portal session using Bunny client
    const tenantCode = `samplesaas-user-${user.id.toString()}`;
    console.log('Tenant code:', tenantCode);
    const portalSession = await bunny.portalSessionCreate(tenantCode);

    res.json({ token: portalSession });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Error creating portal session',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Transactions Routes
app.get('/api/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user details from database
    const user = await new Promise<User>((resolve, reject) => {
      db.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [req.user?.userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Graphql query
    const query = `
      query transactions ($after: String, $before: String, $first: Int, $last: Int, $filter: String, $sort: String, $viewId: ID, $format: String) {
        transactions (after: $after, before: $before, first: $first, last: $last, filter: $filter, sort: $sort, viewId: $viewId, format: $format) {
          edges {
            cursor
            node {
              accountId
              amount
              createdAt
              currencyId
              description
              id
              state
              transactionableId
            }
          }
          totalCount
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    // Fetch transactions using Bunny client with typed response
    const transactions = await bunny.query<{
      transactions: Connection<Transaction>;
    }>(query, {});

    res.json({ transactions });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Error creating portal session',
      details: error.message || 'Unknown error occurred'
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});