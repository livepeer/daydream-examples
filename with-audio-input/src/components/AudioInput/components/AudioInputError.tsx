import { useAudioInputContext } from "./AudioInput";
import { cn } from "../utils/cn";

export interface AudioInputErrorProps {
  className?: string;
  showPermissionHint?: boolean;
  errorTitle?: string;
}

export function AudioInputError({
  className,
  showPermissionHint = true,
  errorTitle = "Audio Error:",
}: AudioInputErrorProps) {
  const { audioError } = useAudioInputContext();

  if (!audioError) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-red-50 border border-red-200 rounded-lg p-3",
        className
      )}
    >
      <div className="text-red-800 text-sm font-medium">{errorTitle}</div>
      <div className="text-red-700 text-xs mt-1">{audioError}</div>
      {showPermissionHint && (
        <div className="text-red-700 text-xs mt-2">
          Please check your microphone permissions and try again.
        </div>
      )}
    </div>
  );
}
