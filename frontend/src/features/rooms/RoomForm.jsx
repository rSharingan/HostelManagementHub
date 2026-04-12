// path: src/features/rooms/RoomForm.jsx
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/Card'

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

  const computedRent = useMemo(() => {
    const normalizedType = String(watchedType || '').toUpperCase() === 'SINGLE' ? 'SINGLE' : 'SHARED'
    let total = normalizedType === 'SINGLE' ? SINGLE_BASE_RENT : SHARED_BASE_RENT
    if (watchedHasAC) total += RENT_SURCHARGES.hasAC
    if (watchedHasAttachedBathroom) total += RENT_SURCHARGES.hasAttachedBathroom
    if (watchedHasWifi) total += RENT_SURCHARGES.hasWifi
    if (watchedHasBalcony) total += RENT_SURCHARGES.hasBalcony
    return total
  }, [watchedType, watchedHasAC, watchedHasAttachedBathroom, watchedHasWifi, watchedHasBalcony])

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Room Number"
              placeholder="101"
              {...register('roomNumber')}
              error={errors.roomNumber?.message}
            />
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
              helperText="Auto-calculated from room type and selected attributes"
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
              disabled={loading}
            >
              {loading ? 'Saving...' : room ? 'Update' : 'Create'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
