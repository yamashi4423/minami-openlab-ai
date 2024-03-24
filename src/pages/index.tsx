import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import {
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_1,
  SYSTEM_PROMPT_2,
  SYSTEM_PROMPT_3,
  SYSTEM_PROMPT_4,
  SYSTEM_PROMPT_5,
  SELECT_PROMPT,
} from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
// import { getChatResponseStream } from "@/utils/openAiChat";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import FaceRec from "@/components/faceRec";
import IntroSlide from "@/components/IntroSlide";
//@ts-ignore
import { OpenAI, OpenAIApi } from "openai";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import db from "@/lib/firebase";
import assert from "node:assert";
import { getEncoding, encodingForModel } from "js-tiktoken";

async function addTokenCounts(
  year: number,
  month: number,
  newTokenCounts: number
) {
  try {
    const docRef = await addDoc(collection(db, String(year), String(month)), {
      token: newTokenCounts,
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function getTokenCounts(year: number, month: number) {
  const docRef = doc(db, String(year), String(month));
  const docSnap = await getDoc(docRef);
  let tokenCounts = 0;

  if (docSnap.exists()) {
    // console.log("Token Number:", docSnap.data().token);
    tokenCounts = docSnap.data().token;
  } else {
    // ドキュメントがない場合（月が変わった場合），ドキュメントを追加
    console.log("No such document!");
    await setDoc(doc(db, String(year), String(month)), {
      token: 0,
    });
  }

  return tokenCounts;
}

// 指定したyear,monthドキュメントのtokenフィールドを更新する関数
async function updateTokenCounts(
  newTokenCounts: number,
  year: number,
  month: number
) {
  const monthRef = doc(db, String(year), String(month));
  await updateDoc(monthRef, {
    token: newTokenCounts,
  });
}

function getToken(text: string) {
  const enc = getEncoding("cl100k_base");
  return enc.encode(text).length;
}

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

const TOKEN_LIMITS = 10_000_000; // 使用できる最大のトークン数．参考：gpt-3.5-turbo-0125	$0.50 / 1M tokens	$1.50 / 1M tokens（https://openai.com/pricing）

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState<boolean | null>(false); // ストリームしているかどうか
  const [topicNumber, setTopicNumber] = useState<number | null>(6); // トピック番号
  const [sentencesLength, setSentencesLength] = useState<number | null>(0); //ストリーミング処理の最後の区切りの回数
  const [speakTimes, setSpeakTimes] = useState<number>(0); //speakの処理の回数
  const [functionCallingInput, setFunctionCallingInput] = useState<string>(""); // ファンクションコーリングで使用するトークン数

  const [totalTokenCounts, setTotalTokenCounts] = useState<number>(0); // OpenAI 通信前にGet通信した時のトークン数
  const [isFirstStartRec, setIsFirstStartRec] = useState<boolean>(false); // 一番はじめの録音を始めているかどうか

  const CountSpeakTimes = (num: number) => {
    setSpeakTimes((speakTimes) => {
      return speakTimes + num;
    });
  };

  useEffect(() => {
    // https://de-milestones.com/next-js_environmental_variables_unread/

    // 今月のトークン数を取得
    (async () => {
      setTotalTokenCounts(await getTokenCounts(year, month));
    })();

    // ローカルストレージから読み込む
    // if (window.localStorage.getItem("chatVRMParams")) {
    //   const params = JSON.parse(
    //     window.localStorage.getItem("chatVRMParams") as string
    //   );
    //   setSystemPrompt(params.systemPrompt);
    //   setKoeiroParam(params.koeiroParam);
    //   setChatLog(params.chatLog);
    // }
  }, []);

  useEffect(() => {
    // ローカルストレージに保存
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, koeiroParam, chatLog })
      )
    );
  }, [systemPrompt, koeiroParam, chatLog]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  // TODO: ファンクションコーリングはindexで使用不可
  // ログから話題を特定して，プロンプトの番号を返す
  const getTopic = async (log: Message[]) => {
    const utterances = log.slice(-3).map((entry) => entry.content); // 直近3つのログの配列
    const utteranceContent = utterances.join(); // 直近3つのログをつなげたもの．FunctionCallingの入力

    // /api/fc を叩いて、topicを取得
    const res = await fetch("/api/fc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ utteranceContent: utteranceContent }),
    });
    setFunctionCallingInput(utteranceContent); // トークン数を数えるために，FcuntionCallingの入力文字列を保存

    const data = await res.json();
    const topic = data.topic;

    return topic;
  };

  /**
   * 文ごとに音声を直列でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      speakCharacter(screenplay, viewer, CountSpeakTimes);
    },
    [viewer]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      const newMessage = text;

      if (newMessage == null) return;

      // 規定Token数を超えているかどうかを判定
      if (totalTokenCounts > TOKEN_LIMITS) {
        setAssistantMessage(
          "Token数オーバーのため，使用を制限しています．月初めにご利用ください．"
        );
        return;
      }

      setChatProcessing(true);
      // ユーザーの発言を追加して表示
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // TODO: チャットログから話題を特定して，システムプロンプトを選択
      getTopic(messageLog).then((topic: number) => {
        setTopicNumber(topic);
      });

      if (topicNumber == 0) {
        setSystemPrompt(SYSTEM_PROMPT);
      } else if (topicNumber == 1) {
        setSystemPrompt(SYSTEM_PROMPT_1);
      } else if (topicNumber == 2) {
        setSystemPrompt(SYSTEM_PROMPT_2);
      } else if (topicNumber == 3) {
        setSystemPrompt(SYSTEM_PROMPT_3);
      } else if (topicNumber == 4) {
        setSystemPrompt(SYSTEM_PROMPT_4);
      } else if (topicNumber == 5) {
        setSystemPrompt(SYSTEM_PROMPT_5);
      } else {
        setSystemPrompt(SYSTEM_PROMPT);
      }

      // Chat GPTへ
      const messages: Message[] = [
        // プロンプト
        {
          role: "system",
          content: systemPrompt,
        },
        // ログ
        ...messageLog,
      ];

      const stream = await getChatResponseStream(
        messages,
        generatedBios,
        setGeneratedBios
      ).catch((e) => {
        console.error(e);
        return null;
      });
      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();
      try {
        setIsStreaming(true);
        setSentencesLength(0);
        setSpeakTimes(0);
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
            setSentencesLength(sentences.length);
            const totalSentense = sentences.join("");
            const chatContents = chatLog.map((chat) => chat.content);
            const totalChatContents = chatContents.join("");
            const sumTokenCounts = getToken(
              newMessage +
                totalSentense +
                totalChatContents +
                functionCallingInput
            );

            // トークン数をupdate
            updateTokenCounts(totalTokenCounts + sumTokenCounts, year, month);

            setTotalTokenCounts((count) => {
              return count + sumTokenCounts;
            });

            break;
          }

          receivedMessage += value;

          // 返答内容のタグ部分の検出
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // 返答を一文単位で切り出して処理する
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );

          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // 発話不要/不可能な文字列だった場合はスキップ
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            // 文ごとに音声を生成 & 再生、返答を表示
            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      // アシスタントの返答をログに追加
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [systemPrompt, chatLog, handleSpeakAi, koeiroParam]
  );

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
        isStreaming={isStreaming}
        sentencesLength={sentencesLength}
        speakTimes={speakTimes}
        isFirstStartRec={isFirstStartRec}
        setIsFirstStartRec={setIsFirstStartRec}
      />
      {/* <GitHubLink /> */}
      <IntroSlide slideId={topicNumber} />
      <div style={{ width: "100%", display: "flex", justifyContent: "right" }}>
        <button
          style={{
            backgroundColor: "#D80032",
            padding: ".5rem 1rem",
            margin: "1rem 1rem ",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            color: "whitesmoke",
            zIndex: "990",
          }}
          onClick={() => {
            location.reload();
          }}
        >
          リセット
        </button>
      </div>
      {/* {onCamera ? <FaceRec onChatProcessStart={handleSendChat} /> : undefined} */}
    </div>
  );
}
