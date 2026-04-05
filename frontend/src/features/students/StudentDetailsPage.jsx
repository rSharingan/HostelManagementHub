// path: src/features/students/StudentDetailsPage.jsx
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateStudent, useStudent, useUpdateStudent } from './hooks'
import { StudentForm } from './StudentForm'
import { Button } from '../../components/ui/Button'
import { DetailPageSkeleton } from '../../components/common/Skeletons'
import { toast } from 'sonner'

export const StudentDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === 'new'

  const { data: student, isLoading } = useStudent(id, !isNew)
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const handleSubmit = async (data) => {
    try {
      if (isNew) {
        await createStudent.mutateAsync(data)
        toast.success('Student created successfully')
      } else {
        // Update existing student
        await updateStudent.mutateAsync({
          id,
          data,
        })
        toast.success('Student updated successfully')
      }
      navigate('/students')
    } catch (error) {
      toast.error('Failed to save student')
    }
  }

  if (!isNew && isLoading) {
    return <DetailPageSkeleton />
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/students')}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Add New Student' : student?.name}
        </h1>
      </div>

      <StudentForm
        student={student}
        onSubmit={handleSubmit}
        loading={isNew ? createStudent.isPending : updateStudent.isPending}
        onCancel={() => navigate('/students')}
      />
    </div>
  )
}
