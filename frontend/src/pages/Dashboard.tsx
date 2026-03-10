import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { Calendar, CheckCircle, AlertCircle, BarChart3, Linkedin } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [linkedin, setLinkedin] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/dashboard').then(setData).catch(console.error)
    api.get('/auth/linkedin/status').then(setLinkedin).catch(console.error)
  }, [])

  if (!data) return <div className='animate-pulse'>Chargement...</div>

  const nextThursday = getNextThursday()

  return (
    <div>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Dashboard</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <StatCard icon={<BarChart3 className='text-brand-600' />} label='Posts totaux' value={data.totalPosts} />
        <StatCard icon={<CheckCircle className='text-green-600' />} label='Publiés'
          value={data.statusCounts.find((s: any) => s.status === 'published')?.count || 0} />
        <StatCard icon={<Calendar className='text-amber-600' />} label='Prochain jeudi' value={nextThursday} />
        <StatCard icon={<Linkedin className='text-blue-600' />} label='LinkedIn'
          value={linkedin?.connected ? 'Connecté' : 'Non connecté'}
          accent={linkedin?.connected ? 'text-green-600' : 'text-red-600'} />
      </div>

      {data.lastPublished && (
        <div className='bg-white rounded-xl shadow-sm border p-6 mb-6'>
          <h3 className='text-lg font-semibold mb-2'>Dernier post publié</h3>
          <p className='text-gray-600 text-sm mb-2'>{new Date(data.lastPublished.published_at).toLocaleDateString('fr-BE', { dateStyle: 'full' })}</p>
          <p className='text-gray-800 whitespace-pre-line line-clamp-4'>{data.lastPublished.body}</p>
          <Link to={'/posts/' + data.lastPublished.id} className='text-brand-600 text-sm mt-2 inline-block hover:underline'>Voir le détail</Link>
        </div>
      )}

      {data.recentErrors.length > 0 && (
        <div className='bg-red-50 rounded-xl border border-red-200 p-6'>
          <h3 className='text-lg font-semibold text-red-800 mb-3 flex items-center gap-2'>
            <AlertCircle size={20} /> Erreurs récentes
          </h3>
          {data.recentErrors.map((e: any) => (
            <div key={e.id} className='bg-white rounded-lg p-3 mb-2 text-sm'>
              <span className='text-red-600 font-medium'>{e.error_message}</span>
              <span className='text-gray-400 ml-2'>{new Date(e.updated_at).toLocaleString('fr-BE')}</span>
            </div>
          ))}
        </div>
      )}

      {data.serviceCounts.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border p-6 mt-6'>
          <h3 className='text-lg font-semibold mb-3'>Répartition par service</h3>
          <div className='space-y-2'>
            {data.serviceCounts.slice(0, 8).map((s: any) => (
              <div key={s.service} className='flex items-center gap-3'>
                <div className='w-32 text-sm text-gray-600 truncate'>{s.service}</div>
                <div className='flex-1 bg-gray-100 rounded-full h-4'>
                  <div className='bg-brand-500 rounded-full h-4 transition-all'
                    style={{ width: Math.min(100, (s.count / Math.max(...data.serviceCounts.map((x: any) => parseInt(x.count)))) * 100) + '%' }} />
                </div>
                <div className='w-8 text-sm text-gray-500 text-right'>{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent?: string }) {
  return (
    <div className='bg-white rounded-xl shadow-sm border p-5'>
      <div className='flex items-center gap-3 mb-2'>{icon}<span className='text-sm text-gray-500'>{label}</span></div>
      <div className={'text-2xl font-bold ' + (accent || 'text-gray-900')}>{value}</div>
    </div>
  )
}

function getNextThursday(): string {
  const now = new Date()
  const day = now.getDay()
  const daysUntilThursday = (4 - day + 7) % 7 || 7
  const next = new Date(now)
  next.setDate(now.getDate() + daysUntilThursday)
  return next.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })
}
