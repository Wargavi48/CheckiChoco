import React, { useRef, useState, useEffect } from "react";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames] = useState<string[]>(["kana-frame.png", "tana-frame.png", "pia-frame.png"]);
  const [selectedFrame, setSelectedFrame] = useState<string>("kana-frame.png");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [countdownDuration, setCountdownDuration] = useState<number>(5);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);


  // Detect screen orientation for mobile
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };

    getCameras();
  }, []);

  // Start the camera stream
  useEffect(() => {
    const checkAndStartCamera = async () => {
      try {
        // Check camera permission
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName });
  
        if (permission.state === "denied") {
          alert("Camera access is blocked. Please enable it in your browser settings.");
          return;
        }
  
        // If permission is not granted, request it
        if (permission.state === "prompt") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Close stream after requesting permission
          } catch (error) {
            console.error("Camera permission denied by user:", error);
            alert("Camera access denied. Please allow camera permissions in your browser settings.");
            return;
          }
        }
  
        // Start the camera with the selected device
        if (selectedCamera) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
          });
  
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (error) {
        console.error("Error accessing the camera: ", error);
        alert("Failed to access the camera. Please check your browser settings.");
      }
    };
  
    checkAndStartCamera();
  
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);
  

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
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      const canvas = canvasRef.current;
      canvas.width = 1920; // 16:9 aspect ratio
      canvas.height = 1080; // 16:9 aspect ratio
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw a transparent background to fill the canvas
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      
        // Calculate the position to draw the camera image
        let x = 0;
        let y = 0;
        let width = canvas.width;
        let height = canvas.height;
      
        if (videoWidth / videoHeight > canvas.width / canvas.height) {
          height = canvas.width * (videoHeight / videoWidth);
          y = (canvas.height - height) / 2;
        } else {
          width = canvas.height * (videoWidth / videoHeight);
          x = (canvas.width - width) / 2;
        }
      
        // Draw the camera image on the canvas without stretching
        ctx.drawImage(videoRef.current, x, y, width, height);
      
        // Draw the frame image on the canvas
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
    <div className="p-4 relative">
      {isPortrait && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-xl font-bold z-50">
          Please rotate your device to landscape mode.
        </div>
      )}
      <div className="flex">
        <a href="https://wargavi48.github.io" target="_blank">
          <img src="spawn.gif" alt="ChekiChoco Logo" className="w-18 h-18 mr-2" />
        </a>
        <img src="logo_scaled.png" alt="ChekiChoco Logo" className="w-32 h-18 mr-2" />
      </div>

      {/* Camera Selection */}
      <div className="mb-4 text-center">
        <label className="mr-2 font-semibold">Select Camera:</label>
        <select
          className="border p-2 rounded"
          onChange={(e) => setSelectedCamera(e.target.value)}
          value={selectedCamera || ""}
        >
          {cameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || "Camera"}
            </option>
          ))}
        </select>
      </div>

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

      {/* Frame Selector */}
      <div className="mt-4 flex gap-2 justify-center">
        {frames.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index + 1}`}
            className={`w-16 h-9 rounded cursor-pointer border-2 ${
              selectedFrame === frame ? "border-blue-500" : "border-gray-300"
            }`}
            onClick={() => setSelectedFrame(frame)}
          />
        ))}
      </div>

      {/* Countdown Duration Selector */}
      <div className="mt-4 text-center">
        <label className="mr-2">Select timer:</label>
      </div>
      <div className="mt-4 text-center">
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

      {/* Countdown Timer */}
      {countdown > 0 && (
        <div className="text-center text-4xl font-bold mt-4">
          {countdown}
        </div>
      )}

      {/* Capture Button */}
      <div className="mt-4 text-center">
        <button
          onClick={startCountdown}
          className="inline-flex items-center rounded cursor-pointer bg-blue-500 px-6 py-3 font-semibold text-white transition [box-shadow:rgb(171,_196,245)-8px_8px] hover:[box-shadow:rgb(43,_127,_255)0px_0px]"
        >
          Capture Photo
        </button>
      </div>

      {/* Canvas (Hidden) */}
      <canvas ref={canvasRef} className="hidden" width={1920} height={1080} />

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Captured Photo</h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-2xl mx-auto rounded shadow-md"
            style={{ objectFit: "contain" }}
          />
          <div className="mt-4">
            <a href={capturedImage} download="captured-photo.png" className="inline-flex items-center rounded cursor-pointer bg-blue-500 px-6 py-3 font-semibold text-white transition [box-shadow:rgb(171,_196,245)-8px_8px] hover:[box-shadow:rgb(43,_127,_255)0px_0px]">
              Download Photo
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
