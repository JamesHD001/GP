import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { register: reg, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (e) {
      alert('Login failed: ' + e.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...reg('email')} required />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" {...reg('password')} required />
          </div>
          <div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
}
