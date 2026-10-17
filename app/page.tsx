'use client'

import { useState, useEffect, useRef } from 'react'
import { Specialist, Trip } from '../lib/types'
import { Storage } from '../lib/storage'
import { SEED_DATA } from '../lib/seed-data'
import { Header } from '../components/Header'
import { Timeline } from '../components/Timeline'
import { Filters } from '../components/Filters'
import { TripModal } from '../components/TripModal'
import { Legend } from '../components/Legend'

interface AppData {
  specialists: Specialist[]
  trips: Trip[]
}

export default function Home() {
  const [data, setData] = useState<AppData>({ specialists: [], trips: [] })
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [specialistFilter, setSpecialistFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const authChecked = useRef(false)

  // CRITICAL: Check auth BEFORE rendering anything
  useEffect(() => {
    if (authChecked.current) return
    authChecked.current = true

    const isAuth = localStorage.getItem('trip_schedule_auth')
    if (isAuth !== 'true') {
      // Hard redirect - works even if JS partially loaded
      window.location.replace('/login')
      return
    }

    // Auth OK - load data
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const stored = await Storage.loadData()
      if (stored) {
        setData(stored)
        setFilteredTrips(stored.trips)
      } else {
        // Use seed data as fallback
        setData(SEED_DATA)
        setFilteredTrips(SEED_DATA.trips)
        await Storage.saveData(SEED_DATA)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      // Fallback to seed data
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
        const location = trip.location.toLowerCase()
        const comment = trip.comment?.toLowerCase() || ''
        return specialistName.includes(query) || location.includes(query) || comment.includes(query)
      })
    }

    if (specialistFilter) {
      filtered = filtered.filter(trip => trip.specialistId === specialistFilter)
    }

    if (monthFilter) {
      filtered = filtered.filter(trip => {
        const tripMonth = trip.startDate.substring(0, 7) // YYYY-MM
        return tripMonth === monthFilter
      })
    }

    setFilteredTrips(filtered)
  }, [data.trips, searchQuery, specialistFilter, monthFilter, data.specialists])

  const handleAddTrip = () => {
    setEditingTrip(null)
    setIsModalOpen(true)
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setIsModalOpen(true)
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Удалить эту командировку?')) return

    const updatedTrips = data.trips.filter(t => t.id !== tripId)
    const updatedData = { ...data, trips: updatedTrips }
    setData(updatedData)
    await Storage.saveData(updatedData)
  }

  const handleSaveTrip = async (trip: Trip) => {
    let updatedTrips: Trip[]

    if (editingTrip) {
      updatedTrips = data.trips.map(t => t.id === trip.id ? trip : t)
    } else {
      updatedTrips = [...data.trips, trip]
    }

    const updatedData = { ...data, trips: updatedTrips }
    setData(updatedData)
    await Storage.saveData(updatedData)
    setIsModalOpen(false)
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
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const imported = JSON.parse(text) as AppData
        if (imported.specialists && imported.trips) {
          setData(imported)
          await Storage.saveData(imported)
          alert('Данные успешно импортированы!')
        } else {
          alert('Неверный формат файла')
        }
      } catch (error) {
        alert('Ошибка при импорте файла')
      }
    }
    input.click()
  }

  const handleReset = async () => {
    if (!confirm('Сбросить все данные к начальному состоянию? Это действие нельзя отменить.')) return

    await Storage.resetData()
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
          {/* Fallback redirect if JS doesn't execute */}
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

      <main style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
        <Filters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          specialistFilter={specialistFilter}
          onSpecialistFilterChange={setSpecialistFilter}
          monthFilter={monthFilter}
          onMonthFilterChange={setMonthFilter}
          specialists={data.specialists}
        />

        <Timeline
          specialists={data.specialists}
          trips={filteredTrips}
          onEditTrip={handleEditTrip}
          onDeleteTrip={handleDeleteTrip}
        />

        <Legend />
      </main>

      {isModalOpen && (
        <TripModal
          trip={editingTrip}
          specialists={data.specialists}
          onSave={handleSaveTrip}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
