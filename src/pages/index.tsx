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
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import FaceRec from "@/components/faceRec";
import IntroSlide from "@/components/IntroSlide";
import { Configuration, OpenAIApi } from "openai";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [koeiromapKey, setKoeiromapKey] = useState("");
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [onCamera, setOnCamera] = useState<boolean | null>(false); // カメラを使ってるかどうか
  const [isSpeaking, setIsSpeaking] = useState<boolean | null>(false); // 話しているかどうか
  const [isStreaming, setIsStreaming] = useState<boolean | null>(false); // ストリームしているかどうか

  useEffect(() => {
    // https://de-milestones.com/next-js_environmental_variables_unread/
    setOpenAiKey(String(process.env.NEXT_PUBLIC_OPENAI_API_KEY));
    setKoeiromapKey(String(process.env.NEXT_PUBLIC_COEIROMAP_API_KEY));

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

  // ログから話題を特定して，プロンプトの番号を返す
  const getPromptType = async (log: Message[]) => {
    const configuration = new Configuration({
      apiKey: openAiKey,
    });
    const openai = new OpenAIApi(configuration);

    let prompt = SELECT_PROMPT;
    // "以下の文章から話題を特定し，話題の番号を返してください．話題の番号は，0. 研究室のテーマ全体に関する対話, 1. 「幼児の言語発達」に関する対話, 2. 「論文執筆支援」に関する対話, 3. 「認知症介護情報からの知識処理」に関する対話, 4. 「音声認識」に関する対話, 5. 「対話システム」に関する対話, 6. その他の対話，とします．\n\n";

    prompt = prompt + log.join();
    console.log("話題特定用プロンプト", prompt);

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    const answer = response.data.choices[0].message?.content;
    console.log("話題特定結果：", answer);
    return answer;
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
      speakCharacter(
        screenplay,
        viewer,
        koeiromapKey,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
      console.log("音声を再生");
    },
    [viewer, koeiromapKey]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      if (!openAiKey) {
        setAssistantMessage("APIキーが入力されていません");
        return;
      }

      const newMessage = text;

      if (newMessage == null) return;

      setChatProcessing(true);
      // ユーザーの発言を追加して表示
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // TODO: チャットログから話題を特定して，システムプロンプトを選択
      const promptType = 0; // 話題（0. 研究室のテーマ全体に関する対話, 1. 「幼児の言語発達」に関する対話, 2. 「論文執筆支援」に関する対話, 3. 「認知症介護情報からの知識処理」に関する対話, 4. 「音声認識」に関する対話, 5. 「対話システム」に関する対話, 6. その他の対話）
      getPromptType(messageLog).then((prompt) => {});

      if (promptType == 0) {
        setSystemPrompt(SYSTEM_PROMPT);
      } else if (promptType == 1) {
        setSystemPrompt(SYSTEM_PROMPT_1);
      } else if (promptType == 2) {
        setSystemPrompt(SYSTEM_PROMPT_2);
      } else if (promptType == 3) {
        setSystemPrompt(SYSTEM_PROMPT_3);
      } else if (promptType == 4) {
        setSystemPrompt(SYSTEM_PROMPT_4);
      } else if (promptType == 5) {
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

      const stream = await getChatResponseStream(messages, openAiKey).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
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
            console.log("aiText: ", aiText);
            console.log("aiTalks: ", aiTalks);

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
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, koeiroParam]
  );

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      {/* <Introduction
        openAiKey={openAiKey}
        koeiroMapKey={koeiromapKey}
        onChangeAiKey={setOpenAiKey}
        onChangeKoeiromapKey={setKoeiromapKey}
      /> */}
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
        isSpeaking={isSpeaking}
        setIsSpeaking={setIsSpeaking}
        isStreaming={isStreaming}
      />
      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        koeiromapKey={koeiromapKey}
        onChangeAiKey={setOpenAiKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        onChangeKoeiromapKey={setKoeiromapKey}
      />
      {/* <GitHubLink /> */}
      <button
        style={{
          backgroundColor: "#29ADB2",
          padding: ".5rem 1rem",
          margin: "5rem 1rem",
          borderRadius: "0.5rem",
          fontWeight: "bold",
          color: "whitesmoke",
          zIndex: "990",
        }}
        onClick={() => {
          setOnCamera(true);
        }}
      >
        カメラオン
      </button>
      <IntroSlide />
      {onCamera ? <FaceRec onChatProcessStart={handleSendChat} /> : undefined}
    </div>
  );
}
