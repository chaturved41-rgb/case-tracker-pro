import { useId, useRef } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CapturedFile = {
  file: File;
  previewUrl?: string;
  source: "camera" | "gallery";
};

/**
 * Camera / gallery picker with large touch targets.
 *
 * Mobile browsers open the camera app (or gallery) from <input type="file">:
 *  - capture="environment" + accept="image/*" → rear camera;
 *  - accept="image/*" alone → system gallery / file picker.
 * On desktop both buttons simply open a file dialog.
 */
export function CameraCapture({
  onCapture,
  disabled,
  className,
}: {
  onCapture: (captured: CapturedFile) => void;
  disabled?: boolean;
  className?: string;
}) {
  const uid = useId();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null, source: "camera" | "gallery") => {
    const file = files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    onCapture({
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      source,
    });
  };

  return (
    <div className={className}>
      <input
        id={`${uid}-camera`}
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "camera");
          e.target.value = "";
        }}
      />
      <input
        id={`${uid}-gallery`}
        ref={galleryInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "gallery");
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-col gap-1"
          disabled={disabled}
          onClick={() => cameraInputRef.current?.click()}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="text-xs font-medium">Take photo</span>
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-col gap-1"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs font-medium">Choose file</span>
        </Button>
      </div>
    </div>
  );
}

/** Small removable thumbnail for an image preview. */
export function CapturePreview({
  preview,
  onRemove,
}: {
  preview: string;
  onRemove?: () => void;
}) {
  return (
    <div className="relative inline-block">
      <img
        src={preview}
        alt="Selected attachment preview"
        className="h-24 w-24 rounded-lg border border-border object-cover"
      />
      {onRemove && (
        <button
          type="button"
          aria-label="Remove attachment"
          onClick={onRemove}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
