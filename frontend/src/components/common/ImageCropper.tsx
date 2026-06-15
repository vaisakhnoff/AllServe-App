import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Check, X } from "lucide-react";

type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({ imageSrc, onCropDone, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const onCropComplete = useCallback((_croppedArea: PixelCrop, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImage = async () => {
    try {
      if (!croppedAreaPixels) return;

      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        onCropDone(file);
      }, "image/jpeg");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="relative flex h-[500px] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative flex-1 bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-6">
          <p className="mb-4 text-center text-sm font-bold text-slate-500">Drag to position, scroll to zoom.</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              <X size={18} /> Cancel
            </button>
            <button
              onClick={getCroppedImage}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
            >
              <Check size={18} /> Crop & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
