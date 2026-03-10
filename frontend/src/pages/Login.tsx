import { useState } from 'react'
import { api } from '../utils/api'

export default function Login({ onLogin }: { onLogin: (u: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.post('/auth/login', { email, password })
      onLogin(data.user)
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700'>
      <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-md'>
        <h1 className='text-2xl font-bold text-brand-900 mb-1'>The Event</h1>
        <p className='text-gray-500 mb-6'>Connexion au CRM LinkedIn</p>
        {error && <div className='bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm'>{error}</div>}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
          <input type='email' value={email} onChange={e => setEmail(e.target.value)} required
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent' />
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Mot de passe</label>
          <input type='password' value={password} onChange={e => setPassword(e.target.value)} required
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent' />
        </div>
        <button type='submit' disabled={loading}
          className='w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors'>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
