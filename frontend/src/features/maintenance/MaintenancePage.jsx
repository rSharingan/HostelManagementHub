import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useCreateMaintenance, useDeleteMaintenance, useMaintenance } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'
import { useStaff } from '../staff/hooks'
import { useRooms } from '../rooms/hooks'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

const statusVariant = (status) => {
  switch (status) {
    case 'CLOSED':
      return 'success'
    case 'RESOLVED_PENDING_APPROVAL':
      return 'primary'
    case 'ASSIGNED':
      return 'warning'
    default:
      return 'secondary'
  }
}

const canAssignComplaint = (userRole, complaint) => {
  return userRole === 'ADMIN' && ['PENDING_ASSIGNMENT', 'ASSIGNED'].includes(complaint.status)
}

const canResolveComplaint = (userId, userRole, complaint) => {
  return ['WARDEN', 'CARETAKER'].includes(userRole)
    && String(complaint.staffId || complaint.assignedTo || '') === String(userId)
    && complaint.status === 'ASSIGNED'
}

const canApproveComplaint = (userEmail, userRole, complaint) => {
  return userRole === 'STUDENT'
    && String((complaint.studentEmail || '').toLowerCase()) === String((userEmail || '').toLowerCase())
    && complaint.status === 'RESOLVED_PENDING_APPROVAL'
}

export const MaintenancePage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: complaints = [], isLoading } = useMaintenance()
  const { data: staff = [] } = useStaff()
  const { data: rooms = [] } = useRooms()
  const createMaintenance = useCreateMaintenance()
  const deleteMaintenance = useDeleteMaintenance()

  const [form, setForm] = useState({
    description: '',
    roomId: '',
    priority: 'MEDIUM',
  })

  const [assignmentDrafts, setAssignmentDrafts] = useState({})

  const visibleComplaints = useMemo(() => {
    if (!user) {
      return complaints
    }

    if (user.role === 'STUDENT') {
      return complaints.filter((complaint) => String((complaint.studentEmail || '').toLowerCase()) === String((user.email || '').toLowerCase()))
    }

    if (['WARDEN', 'CARETAKER'].includes(user.role)) {
      return complaints.filter((complaint) => String(complaint.staffId || complaint.assignedTo || '') === String(user.id))
    }

    return complaints
  }, [complaints, user])

  const getDraft = (complaint) => {
    const existing = assignmentDrafts[complaint.id]
    if (existing) {
      return existing
    }

    return {
      roomId: complaint.roomId ? String(complaint.roomId) : '',
      staffId: complaint.staffId ? String(complaint.staffId) : '',
    }
  }

  const setDraft = (complaintId, key, value) => {
    setAssignmentDrafts((prev) => ({
      ...prev,
      [complaintId]: {
        ...(prev[complaintId] || {}),
        [key]: value,
      },
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    try {
      const room = rooms.find((item) => String(item.id) === String(form.roomId))
      await createMaintenance.mutateAsync({
        description: form.description,
        roomId: user?.role === 'STUDENT' ? null : (form.roomId ? Number(form.roomId) : null),
        room: user?.role === 'STUDENT' ? null : (room?.roomNumber || null),
        priority: form.priority,
        studentId: null,
        studentEmail: user?.role === 'STUDENT' ? user.email : null,
        status: 'PENDING_ASSIGNMENT',
      })
      toast.success('Complaint submitted')
      setForm({ description: '', roomId: '', priority: 'MEDIUM' })
    } catch {
      toast.error('Failed to submit complaint')
    }
  }

  const handleAssign = async (complaint) => {
    const draft = getDraft(complaint)

    if (!draft.staffId) {
      toast.error('Select a staff member before assigning')
      return
    }

    try {
      await axios.put(API_ENDPOINTS.COMPLAINTS.UPDATE(complaint.id), {
        action: 'ASSIGN',
        actorUserId: user?.id,
        roomId: draft.roomId ? Number(draft.roomId) : null,
        staffId: Number(draft.staffId),
      })
      toast.success('Complaint assigned to staff')
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    } catch {
      toast.error('Failed to assign complaint')
    }
  }

  const handleResolve = async (complaint) => {
    try {
      await axios.put(API_ENDPOINTS.COMPLAINTS.UPDATE(complaint.id), {
        action: 'RESOLVE',
        actorUserId: user?.id,
      })
      toast.success('Marked as resolved. Waiting for student approval.')
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    } catch {
      toast.error('Failed to update complaint')
    }
  }

  const handleStudentDecision = async (complaint, decision) => {
    try {
      await axios.put(API_ENDPOINTS.COMPLAINTS.UPDATE(complaint.id), {
        action: 'STUDENT_APPROVE',
        actorUserId: user?.id,
        decision,
      })
      toast.success(decision === 'APPROVED' ? 'Complaint approved and closed' : 'Complaint rejected and reopened')
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    } catch {
      toast.error('Failed to submit approval decision')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMaintenance.mutateAsync(id)
      toast.success('Complaint deleted')
    } catch {
      toast.error('Failed to delete complaint')
    }
  }

  const assignableStaff = staff.filter((member) => ['WARDEN', 'CARETAKER'].includes(member.role))

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Description', accessorKey: 'description' },
    {
      header: 'Room',
      cell: ({ row }) => row.original.roomNumber || row.original.room || 'Not linked',
    },
    {
      header: 'Student',
      cell: ({ row }) => row.original.studentName || row.original.studentId || 'N/A',
    },
    {
      header: 'Assigned Staff',
      cell: ({ row }) => row.original.staffName || 'Unassigned',
    },
    { header: 'Priority', accessorKey: 'priority' },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
          {row.original.studentApprovalStatus && (
            <span className="text-xs text-gray-500 dark:text-dark-400">Student: {row.original.studentApprovalStatus}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const complaint = row.original
        const draft = getDraft(complaint)

        return (
          <div className="flex flex-col gap-2 min-w-[260px]">
            {canAssignComplaint(user?.role, complaint) && (
              <>
                <select
                  className="w-full px-2 py-1 border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                  value={draft.staffId}
                  onChange={(e) => setDraft(complaint.id, 'staffId', e.target.value)}
                >
                  <option value="">Select staff</option>
                  {assignableStaff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                <select
                  className="w-full px-2 py-1 border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                  value={draft.roomId}
                  onChange={(e) => setDraft(complaint.id, 'roomId', e.target.value)}
                >
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={() => handleAssign(complaint)}>
                  Assign
                </Button>
              </>
            )}

            {canResolveComplaint(user?.id, user?.role, complaint) && (
              <Button size="sm" variant="secondary" onClick={() => handleResolve(complaint)}>
                Mark Resolved
              </Button>
            )}

            {canApproveComplaint(user?.email, user?.role, complaint) && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleStudentDecision(complaint, 'APPROVED')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleStudentDecision(complaint, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <Button size="sm" variant="danger" onClick={() => handleDelete(complaint.id)}>
                Delete
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Complaints & Maintenance"
        description="Assign staff, track resolutions, and close complaints with student approval"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Maintenance' },
        ]}
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Submit Complaint</h3>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreate}>
            {user?.role !== 'STUDENT' && (
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={form.roomId}
                onChange={(e) => setForm((prev) => ({ ...prev, roomId: e.target.value }))}
              >
                <option value="">Select room (optional)</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomNumber}
                  </option>
                ))}
              </select>
            )}
            <Input
              name="description"
              placeholder="Issue description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <Button type="submit" disabled={createMaintenance.isPending}>
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          {isLoading ? (
            <p className="text-gray-600 dark:text-dark-400">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={visibleComplaints}
              searchKey="description"
              searchPlaceholder="Search complaints..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
