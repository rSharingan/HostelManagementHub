// path: src/features/students/StudentForm.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/Card'

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  department: z.string().min(1, 'Department is required'),
  yearOfStudy: z.string().min(1, 'Year of study is required'),
  emergencyContact: z.string().min(2, 'Emergency contact name is required'),
  emergencyPhone: z.string().min(10, 'Emergency phone is required'),
})

export const StudentForm = ({ student, onSubmit, loading, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: student || {},
  })

  useEffect(() => {
    if (student) {
      reset(student)
    }
  }, [student, reset])

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="+1 234 567 8900"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Registration Number"
              placeholder="REG-2024-001"
              {...register('registrationNumber')}
              error={errors.registrationNumber?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Department"
              placeholder="Computer Science"
              {...register('department')}
              error={errors.department?.message}
            />
            <Input
              label="Year of Study"
              placeholder="2nd Year"
              {...register('yearOfStudy')}
              error={errors.yearOfStudy?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Emergency Contact Name"
              placeholder="Jane Doe"
              {...register('emergencyContact')}
              error={errors.emergencyContact?.message}
            />
            <Input
              label="Emergency Contact Phone"
              placeholder="+1 234 567 8900"
              {...register('emergencyPhone')}
              error={errors.emergencyPhone?.message}
            />
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
              {loading ? 'Saving...' : student ? 'Update' : 'Create'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
