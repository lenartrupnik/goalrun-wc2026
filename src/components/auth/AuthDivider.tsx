export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-pitch-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-pitch-900 px-2 text-goal-muted">
          or continue with email
        </span>
      </div>
    </div>
  );
}