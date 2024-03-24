import { OpenAI } from "openai";
import {
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_1,
  SYSTEM_PROMPT_2,
  SYSTEM_PROMPT_3,
  SYSTEM_PROMPT_4,
  SYSTEM_PROMPT_5,
  SELECT_PROMPT,
} from "@/features/constants/systemPromptConstants";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseType = {
  topic: number;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(400).json({
      topic: 6, //デフォルトトピック番号
      message: "APIキーが間違っているか、設定されていません。",
    });

    return;
  }

  try {
    const configuration = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    };

    let prompt = SELECT_PROMPT;
    const openai = new OpenAI(configuration);

    const utteranceContent = req.body.utteranceContent; // 直近3つのログををつなげたもの。
    // const utteranceContent = utterances.join(); // 直近3つのログをつなげたもの．FunctionCallingの入力

    // setFunctionCallingInput(utteranceContent); // トークン数を数えるために，FcuntionCallingの入力文字列を保存

    const functionGetTopic = {
      name: "getTopic",
      description: "対話履歴から話題を特定し，文字列を返す",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: [
              "幼児",
              "論文",
              "認知症",
              "音声認識",
              "対話システム",
              "その他の対話",
            ],
            description:
              "話題が幼児に関わることなら「幼児」、論文に関わることなら「論文」、認知症に関わることなら「認知症」、「音声認識に関わることなら「音声認識」、対話システムなら「対話システム」、話題を特定できなければ、「その他の対話」",
          },
        },
        required: ["topic"],
      },
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      //messages: [{ role: "system", content: prompt }],
      messages: [{ role: "user", content: utteranceContent }],
      temperature: 0.0,
      functions: [functionGetTopic],
    });

    const functionCall = response.choices[0].message?.function_call;
    let topic = 6;

    if (functionCall) {
      const args = JSON.parse(functionCall.arguments || "{}");

      if (args.topic == "幼児") {
        topic = 1;
      } else if (args.topic == "論文") {
        topic = 2;
      } else if (args.topic == "認知症") {
        topic = 3;
      } else if (args.topic == "音声認識") {
        topic = 4;
      } else if (args.topic == "対話システム") {
        topic = 5;
      } else {
        topic = 6;
      }
    }

    res
      .status(200)
      .json({ topic: topic, message: "topicの取得に成功しました" });
  } catch {
    res.status(400).json({ topic: 6, message: "topicの取得に失敗しました" });
  }
}
