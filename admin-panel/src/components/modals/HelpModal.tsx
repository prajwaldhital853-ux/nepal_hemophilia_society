type HelpModalProps = {
  onClose: () => void;
};

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Login Help</h2>
        <p className="mt-2 text-sm text-slate-600">
          Contact your Province Admin or Super Admin if you need account access.
          Hospital admins receive credentials after hospital registration.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
