import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { Plus, Search, Filter } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  generated: { label: 'Généré', color: 'bg-blue-100 text-blue-800' },
  review_pending: { label: 'À valider', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  published: { label: 'Publié', color: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Erreur', color: 'bg-red-100 text-red-800' },
  queued: { label: 'En file', color: 'bg-purple-100 text-purple-800' },
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
}

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [generating, setGenerating] = useState(false)

  function load() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    api.get('/posts?' + params.toString()).then(d => { setPosts(d.posts); setTotal(d.total) })
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function generate() {
    setGenerating(true)
    try {
      await api.post('/posts/generate')
      load()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Posts LinkedIn</h2>
        <button onClick={generate} disabled={generating}
          className='flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50'>
          <Plus size={18} /> {generating ? 'Génération...' : 'Générer un post'}
        </button>
      </div>

      <div className='flex gap-3 mb-4'>
        <div className='relative flex-1'>
          <Search size={18} className='absolute left-3 top-2.5 text-gray-400' />
          <input type='text' placeholder='Rechercher...' value={search} onChange={e => setSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500' />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className='border rounded-lg px-3 py-2 text-sm'>
          <option value=''>Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className='bg-white rounded-xl shadow-sm border divide-y'>
        {posts.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>Aucun post trouvé</div>
        ) : posts.map(p => (
          <Link key={p.id} to={'/posts/' + p.id} className='block p-4 hover:bg-gray-50 transition-colors'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (STATUS_LABELS[p.status]?.color || 'bg-gray-100')}>
                    {STATUS_LABELS[p.status]?.label || p.status}
                  </span>
                  {p.service_tags?.map((t: string) => (
                    <span key={t} className='text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full'>{t}</span>
                  ))}
                </div>
                <p className='text-sm font-medium text-gray-900 truncate'>{p.title || p.hook || 'Sans titre'}</p>
                <p className='text-sm text-gray-500 line-clamp-2 mt-1'>{p.body?.substring(0, 150)}</p>
              </div>
              <div className='text-xs text-gray-400 whitespace-nowrap'>
                {new Date(p.generated_at).toLocaleDateString('fr-BE')}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className='text-sm text-gray-400 mt-3'>{total} posts au total</div>
    </div>
  )
}
