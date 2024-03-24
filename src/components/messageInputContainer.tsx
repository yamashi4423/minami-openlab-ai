import { MessageInput } from "@/components/messageInput";
import { useDidUpdateEffect } from "@/hooks/useDidUpdateEffect";
import { useState, useEffect, useCallback } from "react";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  isStreaming: boolean | null;
  sentencesLength: number | null;
  speakTimes: number | null;
  isFirstStartRec: boolean;
  setIsFirstStartRec: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  isStreaming,
  sentencesLength,
  speakTimes,
  isFirstStartRec,
  setIsFirstStartRec,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);

  // 音声認識の結果を処理する
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      // console.log("handleRecognitionResult");
      const text = event.results[0][0].transcript;
      setUserMessage(text);

      // 発言の終了時
      if (event.results[0].isFinal) {
        setUserMessage(text);
        // 返答文の生成を開始
        onChatProcessStart(text);
      }
    },
    [onChatProcessStart]
  );

  // 無音が続いた場合も終了する
  const handleRecognitionEnd = useCallback(() => {
    setIsMicRecording(false);
  }, []);

  // マイクボタンをおしたとき
  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    // console.log("録音開始");
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  // 送信ボタンをおしたとき
  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    // FirefoxなどSpeechRecognition非対応環境対策
    if (!SpeechRecognition) {
      return;
    }

    // 音声認識の初期化・設定
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true; // 認識の途中結果を返す
    recognition.continuous = false; // 発言の終了時に認識を終了する（Trueにすると1分以上音声認識してくれるけど，自分の声を認識しちゃう）

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useDidUpdateEffect(() => {
    if (!isStreaming) {
      if (speakTimes == sentencesLength) {
        speechRecognition?.start();
        setIsMicRecording(true);
        // console.log("録音開始");
      }
    }
  }, [speakTimes]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <>
      {isFirstStartRec ? (
        <MessageInput
          userMessage={userMessage}
          isChatProcessing={isChatProcessing}
          isMicRecording={isMicRecording}
          onChangeUserMessage={(e) => setUserMessage(e.target.value)}
          onClickMicButton={handleClickMicButton}
          onClickSendButton={handleClickSendButton}
        />
      ) : (
        <button
          className="absolute bottom-0 z-20 w-screen"
          style={{
            backgroundColor: "#29ADB2",
            padding: ".5rem 1rem",
            margin: "1rem auto",
            borderRadius: "3rem",
            fontWeight: "bold",
            color: "whitesmoke",
            zIndex: "990",
            width: "50%",
            left: "25%",
          }}
          onClick={() => {
            setIsFirstStartRec(true); // 一番初めの会話をスタートする
            onChatProcessStart("こんにちは"); // こんにちはを発話
          }}
        >
          会話をスタート！
          <br />
          （以降は自動で会話が進みます）
        </button>
      )}
    </>
  );
};
