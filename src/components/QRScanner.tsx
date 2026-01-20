import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { MdQrCodeScanner, MdClose } from "react-icons/md";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const scannerId = "qr-reader";

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size =
                Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (hasScannedRef.current) return;

            hasScannedRef.current = true;
            onScanSuccess(decodedText);

            // Allow decode to finish before stopping camera
            setTimeout(() => {
              stopScanner();
            }, 300);
          },
          (errorMessage) => {
            // Error callback - can be used for logging if needed
            console.debug("QR scan error:", errorMessage);
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError(
          "Unable to start camera. Please check camera permissions."
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
    } catch {
      // ignore
    }

    try {
      scannerRef.current.clear();
    } catch {
      // ignore
    }

    scannerRef.current = null;
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MdQrCodeScanner className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-xl font-bold">Scan QR Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Scanner container MUST have height */}
        <div
          id={scannerId}
          className="w-full h-[320px] rounded-lg overflow-hidden"
        />

        <p className="mt-4 text-center text-sm text-gray-600">
          Align the QR code inside the frame
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
