import React from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "../ui/button";
import { useAudioInputContext } from "./AudioInput";
import { cn } from "../utils/cn";

export interface AudioInputMicrophoneProps {
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
  onStart?: () => void;
  onStop?: () => void;
}

export function AudioInputMicrophone({
  className,
  children,
  showIcon = true,
  variant,
  size = "default",
  onStart,
  onStop,
}: AudioInputMicrophoneProps) {
  const { isListening, isDemoPlaying, startMicrophone, stopMicrophone } =
    useAudioInputContext();

  const handleToggle = async () => {
    if (isListening) {
      stopMicrophone();
      onStop?.();
    } else {
      await startMicrophone();
      onStart?.();
    }
  };

  const buttonVariant = variant || (isListening ? "destructive" : "default");

  return (
    <Button
      onClick={handleToggle}
      variant={buttonVariant}
      size={size}
      className={cn("flex items-center gap-2", className)}
      disabled={isDemoPlaying}
    >
      {showIcon && (isListening ? <MicOff size={16} /> : <Mic size={16} />)}
      {children || (isListening ? "Stop Microphone" : "Use Microphone")}
    </Button>
  );
}
