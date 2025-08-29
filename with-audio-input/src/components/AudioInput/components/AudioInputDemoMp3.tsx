import { MicOff, Music } from "lucide-react";
import { Button } from "../ui/button";
import { useAudioInputContext } from "./AudioInput";
import { cn } from "../utils/cn";

export interface AudioInputDemoMp3Props {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  demoPath?: string;
  onStart?: () => void;
  onStop?: () => void;
}

export function AudioInputDemoMp3({
  className,
  children,
  showIcon = true,
  variant = "secondary",
  size = "default",
  demoPath,
  onStart,
  onStop,
}: AudioInputDemoMp3Props) {
  const { isDemoPlaying, isListening, startDemoAudio, stopDemoAudio } =
    useAudioInputContext();

  const handleToggle = async () => {
    if (isDemoPlaying) {
      stopDemoAudio();
      onStop?.();
    } else {
      await startDemoAudio(demoPath);
      onStart?.();
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
      disabled={isListening}
    >
      {showIcon && (isDemoPlaying ? <MicOff size={16} /> : <Music size={16} />)}
      {children || (isDemoPlaying ? "Stop Demo" : "Play Demo")}
    </Button>
  );
}
