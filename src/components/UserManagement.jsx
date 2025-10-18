import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function UserManagement() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('secretaire'); // valeur par défaut

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signUp(email, role);
    setEmail('');
    setRole('secretaire');
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Ajouter un utilisateur</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email de l'utilisateur"
          required
          className="border p-2 rounded"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="secretaire">Secrétaire</option>
          <option value="comptable">Comptable</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Ajouter
        </button>
      </form>
    </div>
  );
}
