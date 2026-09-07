type HelpModalProps = {
  onClose: () => void;
};

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded border border-line bg-card p-5">
        <h2 className="text-[14px] font-semibold text-ink">Login Help</h2>
        <p className="mt-2 text-[11px] text-muted">
          Contact your Province Admin or Super Admin if you need account access.
          Hospital admins receive credentials after hospital registration.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
        >
          Close
        </button>
      </div>
    </div>
  );
}
