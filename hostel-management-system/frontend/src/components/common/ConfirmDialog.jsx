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
  onCancel,
  title = 'Confirm Action',
  description = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  loading = false,
  variant = 'danger',
}) => {
  const handleClose = onCancel || (() => onOpenChange(false))
  const isLoading_ = isLoading || loading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
          onClick={handleClose}
          disabled={isLoading_}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={isLoading_}
        >
          {isLoading_ ? 'Loading...' : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
