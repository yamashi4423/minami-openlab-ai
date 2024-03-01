// https://qiita.com/bosteri_bon/items/290f902c12deedc6797c

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import { Stream } from "stream";

const MODEL_PATH = "/face-api.js/weights";
const FILE_URL = "/20191225-042212880654_9475.png";
const DETECT_INTERVAL = 10000; // 新しい物体だとみなすまでの時間．つまりisDetectedがTrueからFalseになるまでの時間（3000なら3秒だけど，実際はその2倍の6秒かかるのに注意）
type Props = {
  onChatProcessStart: (text: string) => void;
};
const GREETING_MESSEGE = "こんにちは！";

function FaceRec({ onChatProcessStart }: Props) {
  // const [context, setContext] = useState<CanvasRenderingContext2D | null>(null); // canvasのcontext
  // const [loaded, setLoaded] = useState(false); // 画像読み込み完了トリガー
  const webcamRef = useRef<Webcam>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isDetected, setIsDetected] = useState<boolean | null>(false); // 物体認識しているかどうか
  let detectedCount = 0; // 物体認識した回数
  let prevDetectedCount = 0; // 3秒前までに物体認識した回数（3秒のインターバルで物体認識を確認している）
  const videoRef = useRef();
  const capture = () => {
    // const imageSrc = webcamRef.current?.getScreenshot();
    console.log(webcamRef.current?.stream);
    detectAllFaces();
  };
  let camera_device_id = "";
  const videoConstraints = {
    width: 720,
    height: 360,
    facingMode: "user",
    video: {
      deviceId:
        "b14c26f96ad666e668ce4fd49e6788d604ec652ab12b9ab93396ffa4a9c2962e",
    },
  };
  const [deviceId, setDeviceId] = useState({});
  const [devices, setDevices] = useState([]);
  const handleDevices = useCallback(
    (mediaDevices: any) =>
      setDevices(mediaDevices.filter(({ kind }: any) => kind === "videoinput")),
    [setDevices]
  );

  async function loadModels() {
    console.log("loadModels");
    Promise.all([
      faceapi.loadSsdMobilenetv1Model(MODEL_PATH),
      faceapi.loadFaceLandmarkModel(MODEL_PATH),
      faceapi.loadFaceRecognitionModel(MODEL_PATH),
    ]);
  }

  async function detectAllFaces() {
    // console.log("detectAllFaces");

    // キャプチャ画像が保存されていないときは何もしない
    if (webcamRef.current?.video?.paused || webcamRef.current?.video?.ended) {
      console.log("paused or ended");
      setTimeout(() => detectAllFaces());
      return;
    }

    // 画像読み込み
    const imageSrc = webcamRef.current?.getScreenshot() as string; // キャプチャ画像
    const img = await faceapi.fetchImage(imageSrc);

    // HTMLからキャンバスを取得し画像を描画
    const canvas: HTMLCanvasElement = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d");
    context?.fillRect(0, 0, canvas.width, canvas.height);
    context?.drawImage(img, 0, 0);

    // 顔認識
    const imageSize = { width: img.width, height: img.height };
    const faceData = await faceapi.detectAllFaces(img).withFaceLandmarks();

    // リサイズ
    const resizedData = await faceapi.resizeResults(faceData, imageSize);
    resizedData.forEach((data) => {
      drawResult(data, context);
    });

    setTimeout(() => {
      detectAllFaces();
      // console.log("glfs;j");
    });
    // console.log("[detectAllFaces] done");
  }

  function drawResult(data: any, context: any) {
    // console.log("描画: ", detectedCount);
    if (detectedCount === 0) {
      console.log("こんにちは！");
      onChatProcessStart(GREETING_MESSEGE);
    }
    setIsDetected(true);
    detectedCount++;
    const box = data.detection.box; // 長方形のデータ
    const mrks = data.landmarks.positions;
    context.fillStyle = "red";
    context.strokeStyle = "red";
    context.lineWidth = 4;
    context.strokeRect(box.x, box.y, box.width, box.height); // 長方形の描画
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
    loadModels().then(async () => {
      detectAllFaces();
    });
    const intervalId = setInterval(() => {
      // 5秒経ってもカウント数が更新してなかったら
      // console.log("setInterval: ", prevDetectedCount, detectedCount);
      if (prevDetectedCount === detectedCount) {
        setIsDetected(false);
        detectedCount = 0;
      }
      prevDetectedCount = detectedCount;
      // console.log("setInterval: ", prevDetectedCount, detectedCount);
    }, DETECT_INTERVAL);
    return () => clearInterval(intervalId); // コンポーネントがアンマウントされたらタイマーをクリア
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        // bottom: "0",
        bottom: "-10", // カメラを隠すかどうか
        color: "red",
        fontWeight: "bold",
      }}
    >
      {/* <video /> */}
      {isDetected ? <>Detected!</> : <>Isnt Detected...</>}
      {devices.map((device: any, key) => (
        <button key={key} onClick={() => setDeviceId(device?.deviceId)}>
          {device?.label || `Device ${key + 1}`}
        </button>
      ))}
      <Webcam
        audio={false}
        width={400}
        height={1000}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ deviceId }}
        // onUserMedia={(stream) => {
        //   loadModels().then(() => detectAllFaces());
        // }}
        style={{ visibility: "hidden" }}
      />
      <canvas id="canvas" style={{ borderRadius: "1rem" }}></canvas>
    </div>
  );
}

export default FaceRec;
