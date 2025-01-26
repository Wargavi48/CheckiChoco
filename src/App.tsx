import React, { useRef, useState, useEffect } from "react";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<string[]>(["chekichoco-test-tana-with-frame.png"]); // Example frames
  const [selectedFrame, setSelectedFrame] = useState<string>("chekichoco-test-tana-with-frame.png");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0); // Countdown state
  const [countdownDuration, setCountdownDuration] = useState<number>(5); // User-selected countdown duration

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing the camera: ", error);
      }
    };

    getCameraStream();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(countdownDuration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          handleCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the video feed on the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Draw the selected frame on top
        const frameImage = new Image();
        frameImage.src = selectedFrame;
        frameImage.onload = () => {
          ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
          setCapturedImage(canvas.toDataURL("image/png"));
        };
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">#ChekiChoco</h1>

      {/* Video Preview */}
      <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: "16/9" }}>
        <video ref={videoRef} className="w-full h-full rounded shadow-md" autoPlay muted playsInline />
        {selectedFrame && (
          <img
            src={selectedFrame}
            alt="Selected Frame"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
      </div>

      {/* Countdown Timer */}
      {countdown > 0 && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-4xl font-bold">
          {countdown}
        </div>
      )}

      {/* Countdown Duration Selector */}
      <div className="mt-4 text-center">
        <label className="mr-2">Countdown Duration:</label>
        <button
          onClick={() => setCountdownDuration(5)}
          className={`px-4 py-2 rounded ${countdownDuration === 5 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          5 Seconds
        </button>
        <button
          onClick={() => setCountdownDuration(10)}
          className={`ml-2 px-4 py-2 rounded ${countdownDuration === 10 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          10 Seconds
        </button>
      </div>

      {/* Capture Button */}
      <div className="mt-4 text-center">
        <button
          onClick={startCountdown}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          Capture Photo
        </button>
      </div>

      {/* Frame Selector */}
      <div className="mt-4 flex gap-2 justify-center">
        {frames.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index + 1}`}
            className={`w-16 h-16 rounded cursor-pointer border-2 ${
              selectedFrame === frame ? "border-blue-500" : "border-gray-300"
            }`}
            onClick={() => setSelectedFrame(frame)}
          />
        ))}
      </div>

      {/* Canvas (Hidden) */}
      <canvas ref={canvasRef} className="hidden" width={640} height={480} />

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Captured Photo</h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full max-w-2xl mx-auto rounded shadow-md"
            style={{ aspectRatio: "16/9" }}
          />
          <a
            href={capturedImage}
            download="captured-photo.png"
            className="block mt-2 text-blue-500 hover:underline"
          >
            Download Photo
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
