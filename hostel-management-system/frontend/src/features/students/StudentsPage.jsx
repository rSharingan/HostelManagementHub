// path: src/features/students/StudentsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useStudents, useDeleteStudent } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

export const StudentsPage = () => {
  const navigate = useNavigate()
  const { data: students = [], isLoading } = useStudents()
  const deleteStudent = useDeleteStudent()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteStudent.mutateAsync(deleteId)
      toast.success('Student deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete student')
    }
  }

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Registration Number',
      accessorKey: 'registrationNumber',
    },
    {
      header: 'Department',
      accessorKey: 'department',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'ACTIVE'
              ? 'success'
              : row.original.status === 'INACTIVE'
                ? 'warning'
                : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/students/${row.original.id}`)}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage hostel students"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Students' },
        ]}
        action={
          <Button
            onClick={() => navigate('/students/new')}
            className="gap-2"
          >
            <Plus size={16} />
            Add Student
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          onRowClick={(row) => navigate(`/students/${row.id}`)}
          searchKey="name"
          searchPlaceholder="Search students..."
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteStudent.isPending}
      />
    </div>
  )
}
