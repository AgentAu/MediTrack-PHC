import { useEffect, useRef } from "react";

/**
 * Bootstrap-styled modal driven by React state (no Bootstrap JS).
 * Closes on Escape or backdrop click unless `busy`.
 */
export function Modal({ show, title, onClose, busy = false, children, footer }) {
  const dialogRef = useRef(null);
  // Keep the latest onClose/busy in refs so the effect below runs only
  // when the modal opens, not on every parent re-render (which would
  // pull focus back to the first field while the user is typing).
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busyRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    // Move focus into the dialog for keyboard and screen-reader users.
    const firstFocusable = dialogRef.current?.querySelector("input, select, textarea, button:not(.btn-close)");
    firstFocusable?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mtModalTitle"
        tabIndex={-1}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <div className="modal-dialog modal-dialog-centered" ref={dialogRef}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="mtModalTitle">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={busy} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Yes/no confirmation (replaces confirmAction from ui.js).
 */
export function ConfirmModal({
  show,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      show={show}
      title={title}
      onClose={onCancel}
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
}
