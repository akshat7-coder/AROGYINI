import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  loading,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
