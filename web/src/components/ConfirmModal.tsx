import type { ReactNode } from 'react';
import { Modal } from './Modal';

// A small confirm dialog. `danger` tints the confirm button; `cancelLabel`
// doubles as the default/keep action (e.g. "Keep" when promoting a note).
export function ConfirmModal({
  title, body, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <h3>{title}</h3>
      <div className="confirm-body">{body}</div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onCancel}>{cancelLabel}</button>
        <button className={danger ? 'btn-danger' : 'btn-submit'} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
