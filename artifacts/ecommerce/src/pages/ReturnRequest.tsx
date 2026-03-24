import { Layout } from "@/components/Layout";
import { useCreateReturn, useAddReturnImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useSearch, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, ImagePlus } from "lucide-react";
import { entityId } from "@/lib/entity-id";

const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;
const MAX_IMAGE_DIMENSION = 1280;

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function normalizeCapturedDataUrl(dataUrl: string): Promise<string> {
  const image = await loadImageFromDataUrl(dataUrl);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  const normalized = canvas.toDataURL("image/jpeg", 0.82);
  return normalized || dataUrl;
}

export default function ReturnRequest() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get('orderId') || "";
  const itemId = searchParams.get('itemId') || "";
  
  const [reason, setReason] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { mutateAsync: addImage } = useAddReturnImage();
  const { mutate: createReturn, isPending } = useCreateReturn({
    mutation: {
      onSuccess: async (data) => {
        const returnId = entityId(data as any);
        if (imageDataUrl) {
          await addImage({ id: returnId as any, data: { url: imageDataUrl } });
        }
        toast({ title: "Return Requested", description: "Your return is under review." });
        setLocation(`/returns/${returnId}`);
      }
    }
  });

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraActive(false);
    setIsCameraReady(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!isCameraActive || !video || !stream) return;

    const markReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsCameraReady(true);
      }
    };

    setIsCameraReady(false);
    video.srcObject = stream;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      void playPromise.then(markReady).catch(() => {
        setCameraError("Could not start camera preview. Please try again.");
      });
    }

    video.onloadedmetadata = markReady;
    video.oncanplay = markReady;

    return () => {
      video.onloadedmetadata = null;
      video.oncanplay = null;
      video.srcObject = null;
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      setCameraError("");
      setIsCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
    } catch {
      setCameraError("Camera access was blocked. Allow camera permission and try again.");
      setIsCameraActive(false);
      setIsCameraReady(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !isCameraReady || !video.videoWidth || !video.videoHeight) {
      toast({
        title: "Camera not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingImage(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const result = await normalizeCapturedDataUrl(rawDataUrl);

      if (!result || result.length > MAX_IMAGE_DATA_URL_LENGTH) {
        toast({
          title: "Image too large",
          description: "Move closer and retake with a simpler background.",
          variant: "destructive",
        });
        return;
      }

      setImageDataUrl(result);
      stopCamera();
    } catch {
      toast({
        title: "Capture failed",
        description: "Could not capture the photo. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    if (!imageDataUrl) {
      toast({
        title: "Image required",
        description: "Capture a photo using your phone or laptop camera.",
        variant: "destructive",
      });
      return;
    }
    createReturn({ data: { orderId, orderItemId: itemId, reason } });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-bold mb-8">Request a Return</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Why are you returning this?</label>
            <textarea 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 p-4 min-h-32 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Please explain the issue..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center">
              <ImagePlus className="w-4 h-4 mr-2 text-primary" /> Capture Photo Evidence
            </label>
            <p className="text-xs text-muted-foreground mb-3">Use your phone or laptop camera only. Gallery/file upload is disabled.</p>

            {!isCameraActive && !imageDataUrl && (
              <Button type="button" variant="outline" className="w-full" onClick={() => void startCamera()}>
                <Camera className="w-4 h-4 mr-2" /> Open Camera
              </Button>
            )}

            {isCameraActive && (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  className="w-full max-h-80 rounded-xl border border-slate-200 bg-black object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="flex gap-3">
                  <Button type="button" className="flex-1" onClick={() => void capturePhoto()} disabled={isProcessingImage || !isCameraReady}>
                    <Camera className="w-4 h-4 mr-2" /> Capture Photo
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
                {!isCameraReady && (
                  <p className="text-xs text-muted-foreground">Starting camera preview...</p>
                )}
              </div>
            )}

            {cameraError && (
              <p className="mt-2 text-xs text-destructive">{cameraError}</p>
            )}

            {isProcessingImage && (
              <p className="mt-2 text-xs text-muted-foreground">Optimizing captured image...</p>
            )}

            {imageDataUrl && (
              <div className="mt-3">
                <img src={imageDataUrl} alt="Return evidence preview" className="w-full max-h-72 object-cover rounded-xl border border-slate-200" />
                <Button type="button" variant="outline" className="w-full mt-3" onClick={() => { setImageDataUrl(""); void startCamera(); }}>
                  Retake Photo
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isPending || isProcessingImage}>
            Submit Return Request
          </Button>
        </form>
      </div>
    </Layout>
  );
}
