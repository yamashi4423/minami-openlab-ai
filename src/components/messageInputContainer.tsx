import { MessageInput } from "@/components/messageInput";
import { useDidUpdateEffect } from "@/hooks/useDidUpdateEffect";
import { useState, useEffect, useCallback } from "react";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  isSpeaking: boolean | null;
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
  isSpeaking,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);

  // 音声認識の結果を処理する
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      console.log("handleRecognitionResult");
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
    console.log("handleRecognitionEnd（マイクのマークを変更するだけ）");
    // speechRecognition?.start();
    // setIsMicRecording(true);
  }, []);

  // マイクボタンをおしたとき
  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    console.log("録音開始");
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

    // 1秒ごとに音声認識
    // const intervalId = setInterval(() => {
    //   recognition?.start();
    //   setIsMicRecording(true);
    // }, 1000);
  }, [handleRecognitionResult, handleRecognitionEnd, isSpeaking]);

  // これ一番最初実行してね？？？
  // ときどき，ストリーミング中に自分の声を認識しちゃう（文字起こしされてもOpenAIAPIは叩くわけではなさそう）
  // あともしかすると，音声認識の時間が短くなっちゃってる
  // [たぶん解決]ときどき，しゃべらなくなる（isSpeakigがtrueとfalseが逆になってる）．マウント時とか関係ない？
  useDidUpdateEffect(() => {
    // TODO: ときどき自分の声を認識しちゃうから，0.5秒だけ待機して，録音開始を遅らせる => だめだ．少し認識しちゃう．．．
    console.log("isSpeakingを更新: ", isSpeaking);
    if (!isSpeaking) {
      setTimeout(() => {
        // 1秒経ってもまだ話していなかったら流石にストリーミング中じゃないので録音開始
        if (!isSpeaking) {
          speechRecognition?.start();
          console.log("録音開始");
        } else {
          console.log("ストリーミング中");
        }
      }, 1000);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing}
      isMicRecording={isMicRecording}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
