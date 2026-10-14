import { useEffect, useRef } from 'react';
export function Modal({ title, children, onClose }) {
  const closeRef = useRef();
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button ref={closeRef} aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
