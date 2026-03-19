// path: src/components/common/ConfirmDialog.jsx
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { AlertCircle } from 'lucide-react'

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  variant = 'danger',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <AlertCircle
            size={20}
            className={
              variant === 'danger'
                ? 'text-red-600'
                : 'text-yellow-600'
            }
          />
          <DialogTitle>{title}</DialogTitle>
        </div>
      </DialogHeader>
      <DialogContent>{description}</DialogContent>
      <DialogFooter>
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Loading...' : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
