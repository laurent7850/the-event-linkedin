import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Linkedin, Save, RefreshCw } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState<any>({})
  const [linkedin, setLinkedin] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then(setSettings).catch(console.error)
    api.get('/auth/linkedin/status').then(setLinkedin).catch(console.error)
    const params = new URLSearchParams(window.location.search)
    if (params.get('linkedin') === 'success') alert('LinkedIn connecté avec succès !')
    if (params.get('linkedin') === 'error') alert('Erreur de connexion LinkedIn')
  }, [])

  async function connectLinkedin() {
    const data = await api.get('/auth/linkedin/connect')
    window.location.href = data.url
  }

  async function saveSetting(key: string, value: any) {
    setSaving(true)
    try {
      await api.put('/admin/settings/' + key, { value })
      setSettings({ ...settings, [key]: value })
    } finally { setSaving(false) }
  }

  const editorial = settings.editorial_config || {}
  const linkedinConfig = settings.linkedin_config || {}

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h2>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Linkedin className="text-blue-600" /> LinkedIn</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className={"w-3 h-3 rounded-full " + (linkedin?.connected ? "bg-green-500" : "bg-red-500")} />
          <span>{linkedin?.connected ? 'Connecté' : 'Non connecté'}</span>
          {linkedin?.expiresAt && <span className="text-sm text-gray-400">Expire: {new Date(linkedin.expiresAt).toLocaleDateString('fr-BE')}</span>}
        </div>
        {linkedin?.profile?.name && <p className="text-sm text-gray-600 mb-4">Profil: {linkedin.profile.name}</p>}
        <button onClick={connectLinkedin} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          {linkedin?.connected ? 'Reconnecter' : 'Connecter LinkedIn'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm">Publication automatique</label>
          <input type="checkbox" checked={linkedinConfig.publish_enabled || false}
            onChange={e => saveSetting('linkedin_config', { ...linkedinConfig, publish_enabled: e.target.checked })}
            className="w-4 h-4 text-brand-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Configuration éditoriale</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Longueur max (caractères)</label>
            <input type="number" value={editorial.max_length || 1300}
              onChange={e => saveSetting('editorial_config', { ...editorial, max_length: parseInt(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Longueur min</label>
            <input type="number" value={editorial.min_length || 200}
              onChange={e => saveSetting('editorial_config', { ...editorial, min_length: parseInt(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max hashtags</label>
            <input type="number" value={editorial.max_hashtags || 5}
              onChange={e => saveSetting('editorial_config', { ...editorial, max_hashtags: parseInt(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm">Approbation manuelle</label>
            <input type="checkbox" checked={editorial.manual_approval || false}
              onChange={e => saveSetting('editorial_config', { ...editorial, manual_approval: e.target.checked })}
              className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Services actifs</h3>
        <ServicesList />
      </div>
    </div>
  )
}

function ServicesList() {
  const [services, setServices] = useState<any[]>([])
  useEffect(() => { api.get('/admin/services').then(setServices).catch(console.error) }, [])

  async function toggle(id: string, service: any) {
    await api.put('/admin/services/' + id, { ...service, is_active: !service.is_active })
    setServices(services.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s))
  }

  return (
    <div className="space-y-2">
      {services.map(s => (
        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
          <div>
            <span className="font-medium text-sm">{s.name}</span>
            <p className="text-xs text-gray-400">{s.description?.substring(0, 80)}</p>
          </div>
          <button onClick={() => toggle(s.id, s)}
            className={"px-3 py-1 rounded-full text-xs font-medium " + (s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
            {s.is_active ? 'Actif' : 'Inactif'}
          </button>
        </div>
      ))}
    </div>
  )
}
