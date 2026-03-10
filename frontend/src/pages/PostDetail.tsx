import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { ArrowLeft, Send, CheckCircle, Copy, Trash2, Clock } from 'lucide-react'

export default function PostDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    api.get('/posts/' + id).then(p => { setPost(p); setForm(p) }).catch(() => nav('/posts'))
  }, [id])

  if (!post) return <div className="animate-pulse">Chargement...</div>

  async function approve() { await api.post('/posts/' + id + '/approve'); setPost({ ...post, status: 'approved' }) }
  async function publish() {
    if (!confirm('Publier ce post sur LinkedIn ?')) return
    const r = await api.post('/posts/' + id + '/publish')
    if (r.success) setPost({ ...post, status: 'published', linkedin_post_url: r.postUrl })
    else alert('Erreur: ' + r.error)
  }
  async function queue() { await api.post('/posts/' + id + '/queue'); setPost({ ...post, status: 'queued' }) }
  async function clone() { const r = await api.post('/posts/' + id + '/clone'); nav('/posts/' + r.id) }
  async function save() { await api.put('/posts/' + id, form); setPost(form); setEditing(false) }
  async function remove() { if (!confirm('Supprimer ?')) return; await api.del('/posts/' + id); nav('/posts') }

  return (
    <div>
      <button onClick={() => nav('/posts')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Retour
      </button>
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{post.title || 'Post LinkedIn'}</h2>
          <div className="flex gap-2">
            {['generated','review_pending'].includes(post.status) && (
              <button onClick={approve} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"><CheckCircle size={16} /> Approuver</button>
            )}
            {['approved','generated','queued'].includes(post.status) && (
              <button onClick={publish} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Send size={16} /> Publier</button>
            )}
            {post.status === 'failed' && (
              <button onClick={queue} className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm"><Clock size={16} /> Remettre en file</button>
            )}
            <button onClick={clone} className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-sm"><Copy size={16} /> Cloner</button>
            <button onClick={remove} className="flex items-center gap-1 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm"><Trash2 size={16} /></button>
          </div>
        </div>
        {editing ? (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Accroche</label>
              <input value={form.hook||''} onChange={e => setForm({...form, hook: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Corps</label>
              <textarea value={form.body||''} onChange={e => setForm({...form, body: e.target.value})} rows={10} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={form.notes||''} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full border rounded-lg px-3 py-2" /></div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-brand-600 text-white px-4 py-2 rounded-lg">Sauver</button>
              <button onClick={() => { setForm(post); setEditing(false) }} className="border px-4 py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        ) : (
          <div>
            {post.hook && <p className="text-lg font-semibold text-brand-700 mb-3">{post.hook}</p>}
            <div className="whitespace-pre-line text-gray-800 leading-relaxed mb-4">{post.body}</div>
            {post.hashtags?.length > 0 && <div className="flex gap-2 flex-wrap mb-4">{post.hashtags.map((h: string) => <span key={h} className="text-sm text-brand-600">#{h}</span>)}</div>}
            <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:underline">Modifier</button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Infos</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div><dt className="text-gray-400">Statut</dt><dd className="font-medium">{post.status}</dd></div>
          <div><dt className="text-gray-400">Modèle</dt><dd>{post.generation_model}</dd></div>
          <div><dt className="text-gray-400">Similarité</dt><dd>{((post.similarity_score||0) * 100).toFixed(1)}%</dd></div>
          <div><dt className="text-gray-400">Généré</dt><dd>{new Date(post.generated_at).toLocaleString('fr-BE')}</dd></div>
          {post.published_at && <div><dt className="text-gray-400">Publié</dt><dd>{new Date(post.published_at).toLocaleString('fr-BE')}</dd></div>}
          {post.linkedin_post_url && <div><dt className="text-gray-400">LinkedIn</dt><dd><a href={post.linkedin_post_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">Voir</a></dd></div>}
        </dl>
        {post.error_message && <div className="mt-3 bg-red-50 p-3 rounded-lg text-sm text-red-700">{post.error_message} (tentatives: {post.retry_count})</div>}
      </div>
    </div>
  )
}
