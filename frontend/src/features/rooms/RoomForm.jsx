// path: src/features/rooms/RoomForm.jsx
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/Card'
import { checkRoomNumberAvailabilityAPI } from './api'

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  block: z.string().min(1, 'Block is required'),
  floor: z.string().min(1, 'Floor is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  type: z.string().min(1, 'Room type is required'),
  hasAC: z.boolean().default(false),
  hasAttachedBathroom: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasBalcony: z.boolean().default(false),
})

const SHARED_BASE_RENT = 2000
const SINGLE_BASE_RENT = 4000
const RENT_SURCHARGES = {
  hasAC: 1200,
  hasWifi: 300,
  hasBalcony: 500,
  hasAttachedBathroom: 800,
}

export const RoomForm = ({ room, onSubmit, loading, onCancel }) => {
  const [numberCheckState, setNumberCheckState] = useState({
    checking: false,
    available: null,
    message: '',
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      type: 'SHARED',
      hasAC: false,
      hasAttachedBathroom: false,
      hasWifi: false,
      hasBalcony: false,
      ...room,
    },
  })

  useEffect(() => {
    if (room) {
      reset(room)
    }
  }, [room, reset])

  const watchedType = watch('type')
  const watchedHasAC = watch('hasAC')
  const watchedHasAttachedBathroom = watch('hasAttachedBathroom')
  const watchedHasWifi = watch('hasWifi')
  const watchedHasBalcony = watch('hasBalcony')
  const watchedRoomNumber = watch('roomNumber')
  const watchedBlock = watch('block')

  useEffect(() => {
    const roomNumber = String(watchedRoomNumber || '').trim()
    const block = String(watchedBlock || '').trim()

    if (!roomNumber || !block) {
      setNumberCheckState({ checking: false, available: null, message: '' })
      return
    }

    let cancelled = false
    setNumberCheckState((prev) => ({ ...prev, checking: true }))

    const timer = setTimeout(async () => {
      try {
        const response = await checkRoomNumberAvailabilityAPI({
          roomNumber,
          block,
          excludeId: room?.id,
        })

        if (cancelled) {
          return
        }

        setNumberCheckState({
          checking: false,
          available: Boolean(response?.available),
          message: response?.message || '',
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setNumberCheckState({
          checking: false,
          available: null,
          message: error?.response?.data?.message || 'Could not validate room number right now',
        })
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [room?.id, watchedBlock, watchedRoomNumber])

  const computedRent = useMemo(() => {
    const normalizedType = String(watchedType || '').toUpperCase() === 'SINGLE' ? 'SINGLE' : 'SHARED'
    let total = normalizedType === 'SINGLE' ? SINGLE_BASE_RENT : SHARED_BASE_RENT
    if (watchedHasAC) total += RENT_SURCHARGES.hasAC
    if (watchedHasAttachedBathroom) total += RENT_SURCHARGES.hasAttachedBathroom
    if (watchedHasWifi) total += RENT_SURCHARGES.hasWifi
    if (watchedHasBalcony) total += RENT_SURCHARGES.hasBalcony
    return total
  }, [watchedType, watchedHasAC, watchedHasAttachedBathroom, watchedHasWifi, watchedHasBalcony])

  const handleFormSubmit = (data) => {
    if (numberCheckState.available === false) {
      return
    }

    onSubmit(data)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Room Number"
                placeholder="101"
                {...register('roomNumber')}
                error={errors.roomNumber?.message || (numberCheckState.available === false ? 'Room number already exists in this block' : undefined)}
              />
              {(String(watchedRoomNumber || '').trim() && String(watchedBlock || '').trim()) && (
                <>
                  <div className={`mt-2 h-1 rounded ${
                    numberCheckState.checking
                      ? 'bg-gray-300 dark:bg-dark-600'
                      : numberCheckState.available === true
                        ? 'bg-green-500'
                        : numberCheckState.available === false
                          ? 'bg-red-500'
                          : 'bg-gray-300 dark:bg-dark-600'
                  }`} />
                  <p className={`text-sm mt-2 ${
                    numberCheckState.available === true
                      ? 'text-green-600 dark:text-green-400'
                      : numberCheckState.available === false
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-dark-400'
                  }`}>
                    {numberCheckState.checking
                      ? 'Checking availability...'
                      : numberCheckState.message || ''}
                  </p>
                </>
              )}
            </div>
            <Input
              label="Block"
              placeholder="A"
              {...register('block')}
              error={errors.block?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Floor"
              placeholder="1st"
              {...register('floor')}
              error={errors.floor?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-100 mb-2">Room Type</label>
              <select
                className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-900 dark:text-dark-50 rounded-lg"
                {...register('type')}
              >
                <option value="SHARED">Shared</option>
                <option value="SINGLE">Single</option>
              </select>
              {errors.type?.message && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.type?.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              placeholder="2"
              {...register('capacity')}
              error={errors.capacity?.message}
            />
            <Input
              label="Calculated Rent"
              type="number"
              value={computedRent}
              readOnly
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-3">Room Attributes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
                <input type="checkbox" {...register('hasAC')} />
                Air Conditioning (AC)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
                <input type="checkbox" {...register('hasAttachedBathroom')} />
                Attached Bathroom
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
                <input type="checkbox" {...register('hasWifi')} />
                Wi-Fi
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
                <input type="checkbox" {...register('hasBalcony')} />
                Balcony
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex gap-3 w-full justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || numberCheckState.checking || numberCheckState.available === false}
            >
              {loading ? 'Saving...' : room ? 'Update' : 'Create'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
