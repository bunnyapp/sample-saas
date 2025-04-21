import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventsSidebar from './EventsSidebar';
import BillingButton from './BillingButton';
import PortalButton from './PortalButton';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface TodoListProps {
  setIsAuthenticated: (value: boolean) => void;
}

interface AccountLimits {
  taskLimit: number;
}

const TodoList: React.FC<TodoListProps> = ({ setIsAuthenticated }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState('');
  const [accountLimits, setAccountLimits] = useState<AccountLimits>({ taskLimit: 5 }); // Default until server responds
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3051',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchAccountLimits();
    fetchTodos();
  }, []);

  const fetchAccountLimits = async () => {
    try {
      const response = await axiosInstance.get('/api/account/limits');
      setAccountLimits(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      console.error('Error fetching account limits');
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await axiosInstance.get('/api/todos');
      if (response.data.length === 0) {
        // Add welcome task for new accounts
        const welcomeResponse = await axiosInstance.post('/api/todos', {
          title: "👋 Welcome! This is your first task. Check it off when you're ready to start."
        });
        setTodos([welcomeResponse.data]);
      } else {
        setTodos(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      setError('Error fetching todos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    if (todos.length >= accountLimits.taskLimit) {
      setError(`You can only create up to ${accountLimits.taskLimit} tasks. Please complete or remove existing tasks first.`);
      return;
    }

    try {
      const response = await axiosInstance.post('/api/todos', {
        title: newTodo
      });
      setTodos([response.data, ...todos]);
      setNewTodo('');
      setError('');
    } catch (err: any) {
      if (err.response?.status === 403 && err.response.data?.error === 'TASK_LIMIT_EXCEEDED') {
        setError(`Task limit of ${accountLimits.taskLimit} reached. Please complete or remove existing tasks first.`);
      } else {
        setError('Error adding todo');
      }
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await axiosInstance.put(`/api/todos/${todo.id}`, {
        completed: !todo.completed
      });
      setTodos(todos.map(t =>
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      setError('Error updating todo');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await axiosInstance.delete(`/api/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Error deleting todo');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-800">Sample SaaS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <BillingButton axiosInstance={axiosInstance} />
              <PortalButton axiosInstance={axiosInstance} />
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pr-96">
        {/* Add Todo Form Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo}>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>

        {/* Todo List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Tasks ({todos.length}/{accountLimits.taskLimit})</h2>
            {todos.length >= accountLimits.taskLimit && (
              <span className="text-sm text-amber-600">Task limit reached</span>
            )}
          </div>
          <div className="space-y-2">
            {todos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <span
                    className={`${
                      todo.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-700'
                    } text-sm transition-all`}
                  >
                    {todo.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-all"
                  aria-label="Delete todo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {todos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No tasks yet. Add one above!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events Sidebar */}
      <EventsSidebar axiosInstance={axiosInstance} />
    </div>
  );
};

export default TodoList;