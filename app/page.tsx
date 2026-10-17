'use client'

import { useState, useEffect, useRef } from 'react'
import { Specialist, Trip, AppData } from '../lib/types'
import { loadData, saveTrip, deleteTrip, saveSpecialist, resetData } from '../lib/storage'
import { SEED_DATA } from '../lib/data'
import { Header } from '../components/Header'
import { Timeline } from '../components/Timeline'
import { FilterChips } from '../components/FilterChips'
import { AddTripModal } from '../components/AddTripModal'
import { TripDetailsModal } from '../components/TripDetailsModal'

export default function Home() {
  const [data, setData] = useState<AppData>({ specialists: [], trips: [] })
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [specialistFilter, setSpecialistFilter] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const authChecked = useRef(false)

  // Check auth BEFORE rendering anything
  useEffect(() => {
    if (authChecked.current) return
    authChecked.current = true

    const isAuth = localStorage.getItem('trip_schedule_auth')
    if (isAuth !== 'true') {
      window.location.replace('/login')
      return
    }

    loadDataFromStorage()
  }, [])

  const loadDataFromStorage = async () => {
    try {
      const stored = await loadData()
      if (stored) {
        setData(stored)
        setFilteredTrips(stored.trips)
      } else {
        setData(SEED_DATA)
        setFilteredTrips(SEED_DATA.trips)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setData(SEED_DATA)
      setFilteredTrips(SEED_DATA.trips)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    if (data.trips.length === 0) return

    let filtered = [...data.trips]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(trip => {
        const specialist = data.specialists.find(s => s.id === trip.specialistId)
        const specialistName = specialist ? specialist.name.toLowerCase() : ''
        const city = trip.city.toLowerCase()
        const purpose = trip.purpose?.toLowerCase() || ''
        const note = trip.note?.toLowerCase() || ''
        return specialistName.includes(query) || city.includes(query) || purpose.includes(query) || note.includes(query)
      })
    }

    if (specialistFilter) {
      filtered = filtered.filter(trip => trip.specialistId === specialistFilter)
    }

    setFilteredTrips(filtered)
  }, [data.trips, searchQuery, specialistFilter, data.specialists])

  // Calculate trip count by specialist
  const tripCountBySpecialist = data.specialists.reduce((acc, s) => {
    acc[s.id] = data.trips.filter(t => t.specialistId === s.id).length
    return acc
  }, {} as Record<string, number>)

  const handleAddTrip = () => {
    setEditingTrip(null)
    setIsAddModalOpen(true)
  }

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip)
  }

  const handleEditTrip = () => {
    if (selectedTrip) {
      setEditingTrip(selectedTrip)
      setIsAddModalOpen(true)
      setSelectedTrip(null)
    }
  }

  const handleDeleteTrip = async () => {
    if (selectedTrip) {
      await deleteTrip(selectedTrip.id)
      const updatedTrips = data.trips.filter(t => t.id !== selectedTrip.id)
      const updatedData = { ...data, trips: updatedTrips }
      setData(updatedData)
      setSelectedTrip(null)
    }
  }

  const handleSaveTrip = async (trip: Trip, newSpecialist?: Omit<Specialist, 'color'>) => {
    // Save specialist if new
    if (newSpecialist) {
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16', '#a855f7', '#f97316']
      const colorIndex = data.specialists.length % colors.length
      const specialist: Specialist = { ...newSpecialist, color: colors[colorIndex] }
      await saveSpecialist(specialist)
      const updatedSpecialists = [...data.specialists, specialist]
      setData({ ...data, specialists: updatedSpecialists, trips: data.trips })
    }

    // Save trip
    await saveTrip(trip)
    
    // Update local state
    let updatedTrips: Trip[]
    if (editingTrip) {
      updatedTrips = data.trips.map(t => t.id === trip.id ? trip : t)
    } else {
      updatedTrips = [...data.trips, trip]
    }
    setData({ ...data, trips: updatedTrips })
    setIsAddModalOpen(false)
    setEditingTrip(null)
  }

  const handleExport = () => {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trip-schedule-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    try {
      const stored = localStorage.getItem('trip-schedule-import')
      if (stored) {
        const imported = JSON.parse(stored) as AppData
        if (imported.specialists && imported.trips) {
          setData(imported)
          localStorage.setItem('trip_schedule_data', JSON.stringify(imported))
          alert('Данные успешно импортированы!')
        } else {
          alert('Неверный формат файла')
        }
      }
    } catch (error) {
      alert('Ошибка при импорте файла')
    }
  }

  const handleReset = async () => {
    await resetData()
    setData(SEED_DATA)
    setFilteredTrips(SEED_DATA.trips)
    alert('Данные сброшены к начальному состоянию')
  }

  // Show loading screen while checking auth
  if (isLoading || !authChecked.current) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0eeeb',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', color: '#1a1a1a' }}>Загрузка...</h1>
          <noscript>
            <meta httpEquiv="refresh" content="0;url=/login" />
          </noscript>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>
            Если страница не загружается, <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>нажмите здесь</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb' }}>
      <Header
        onAddTrip={handleAddTrip}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        tripCount={data.trips.length}
        specialistCount={data.specialists.length}
      />

      <main style={{ maxWidth: '100%', margin: '0 auto' }}>
        {/* Search bar */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.36)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <input
            type="text"
            placeholder="Поиск по объекту, специалисту, виду работ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
            }}
          />
        </div>

        {/* Filter chips */}
        <FilterChips
          specialists={data.specialists}
          selected={specialistFilter}
          onSelect={setSpecialistFilter}
          tripCountBySpecialist={tripCountBySpecialist}
        />

        {/* Timeline */}
        <div style={{ height: 'calc(100vh - 200px)' }}>
          <Timeline
            specialists={data.specialists}
            trips={filteredTrips}
            serviceMarkers={data.serviceMarkers}
            onSelectTrip={handleSelectTrip}
          />
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <AddTripModal
          specialists={data.specialists}
          initialTrip={editingTrip}
          onSave={handleSaveTrip}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingTrip(null)
          }}
        />
      )}

      {/* Trip Details Modal */}
      {selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          specialist={data.specialists.find(s => s.id === selectedTrip.specialistId)}
          onClose={() => setSelectedTrip(null)}
          onEdit={handleEditTrip}
          onDelete={handleDeleteTrip}
        />
      )}
    </div>
  )
}
