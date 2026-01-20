import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  NotFoundException,
} from "@zxing/library";

interface QRScannerProps {
  onScanSuccess: (value: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef(new BrowserMultiFormatReader());
  const hasScannedRef = useRef(false);
  const controlsRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [scannedValue, setScannedValue] = useState<string>("");

  useEffect(() => {
    const startScanner = async () => {
      try {
        if (!videoRef.current) {
          setError("Video element not found");
          return;
        }

        // Get available video devices
        const videoDevices = await readerRef.current.listVideoInputDevices();
        console.log('Available cameras:', videoDevices);
        
        if (videoDevices.length === 0) {
          setError("No camera found on this device");
          return;
        }

        // Try to use the back camera first (environment facing)
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        const deviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;

        console.log('Using camera:', deviceId);

        controlsRef.current = await readerRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !hasScannedRef.current) {
              hasScannedRef.current = true;
              const text = result.getText();
              console.log('QR Code scanned:', text);
              setScannedValue(text);
              onScanSuccess(text);
              setTimeout(() => {
                stopScanner();
              }, 500); // Small delay to show the scanned value
            }

            // This error happens every frame when no QR is found
            if (err && !(err instanceof NotFoundException)) {
              console.error("Scanning error:", err);
            }
          }
        );
      } catch (e: any) {
        console.error("Camera error:", e);
        setError(`Unable to access camera: ${e.message || 'Permission denied or camera in use'}`);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    readerRef.current.reset();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {scannedValue && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-semibold text-green-800 mb-1">Scanned Value:</p>
            <p className="text-sm text-green-700 break-all">{scannedValue}</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-[320px] rounded-lg bg-black"
          muted
          playsInline
          autoPlay
        />

        <p className="mt-4 text-sm text-center text-gray-600">
          Align the QR code within the camera view
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
