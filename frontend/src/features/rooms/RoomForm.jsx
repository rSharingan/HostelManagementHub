// path: src/features/rooms/RoomForm.jsx
import { useEffect } from 'react'
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
  rentalCost: z.coerce.number().min(0, 'Rental cost must be 0 or more'),
})

export const RoomForm = ({ room, onSubmit, loading, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
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
            <Input
              label="Room Type"
              placeholder="DOUBLE"
              {...register('type')}
              error={errors.type?.message}
            />
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
              label="Rental Cost"
              type="number"
              placeholder="500"
              {...register('rentalCost')}
              error={errors.rentalCost?.message}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Room Attributes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('hasAC')} />
                Air Conditioning (AC)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('hasAttachedBathroom')} />
                Attached Bathroom
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('hasWifi')} />
                Wi-Fi
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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
