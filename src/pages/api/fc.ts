// import { OpenAI } from "openai";
// import {
//   SYSTEM_PROMPT,
//   SYSTEM_PROMPT_1,
//   SYSTEM_PROMPT_2,
//   SYSTEM_PROMPT_3,
//   SYSTEM_PROMPT_4,
//   SYSTEM_PROMPT_5,
//   SELECT_PROMPT,
// } from "@/features/constants/systemPromptConstants";
// import type { NextApiRequest, NextApiResponse } from "next";

// type Data = {
//   message: string;
// };

// // ログから話題を特定して，プロンプトの番号を返す
// const getTopic = async (log: Message[]) => {
//   const configuration = {
//     apiKey: openAiKey,
//     dangerouslyAllowBrowser: true,
//   };
//   const openai = new OpenAI(configuration);

//   let prompt = SELECT_PROMPT;
//   // "以下の文章から話題を特定し，話題の番号を返してください．話題の番号は，0. 研究室のテーマ全体に関する対話, 1. 「幼児の言語発達」に関する対話, 2. 「論文執筆支援」に関する対話, 3. 「認知症介護情報からの知識処理」に関する対話, 4. 「音声認識」に関する対話, 5. 「対話システム」に関する対話, 6. その他の対話，とします．\n\n";

//   // const selectNumber = 3; // 取り出す数
//   // if (log)
//   // let atterance = log.slice(-3)[0].content;
//   // atterance = log.slice(-2)[0].content;
//   // atterance = log.slice(-1)[0].content;

//   const utterances = log.slice(-3).map((entry) => entry.content); // 直近3つのログの配列
//   const utteranceContent = utterances.join(); // 直近3つのログをつなげたもの．FunctionCallingの入力
//   setFunctionCallingInput(utteranceContent); // トークン数を数えるために，FcuntionCallingの入力文字列を保存
//   console.log("話題特定用プロンプト", utteranceContent);

//   const functionGetTopic = {
//     name: "getTopic",
//     description: "対話履歴から話題を特定し，文字列を返す",
//     parameters: {
//       type: "object",
//       properties: {
//         topic: {
//           type: "string",
//           enum: [
//             "幼児",
//             "論文",
//             "認知症",
//             "音声認識",
//             "対話システム",
//             "その他の対話",
//           ],
//           description:
//             "話題が幼児に関わることなら「幼児」、論文に関わることなら「論文」、認知症に関わることなら「認知症」、「音声認識に関わることなら「音声認識」、対話システムなら「対話システム」、話題を特定できなければ、「その他の対話」",
//         },
//       },
//       required: ["topic"],
//     },
//   };

//   const response = await openai.chat.completions.create({
//     model: "gpt-4",
//     //messages: [{ role: "system", content: prompt }],
//     messages: [{ role: "user", content: utteranceContent }],
//     temperature: 0.0,
//     functions: [functionGetTopic],
//   });

//   const functionCall = response.choices[0].message?.function_call;
//   let topic = 6;

//   if (functionCall) {
//     const args = JSON.parse(functionCall.arguments || "{}");
//     console.log("args: ", args.topic);

//     if (args.topic == "幼児") {
//       topic = 1;
//     } else if (args.topic == "論文") {
//       topic = 2;
//     } else if (args.topic == "認知症") {
//       topic = 3;
//     } else if (args.topic == "音声認識") {
//       topic = 4;
//     } else if (args.topic == "対話システム") {
//       topic = 5;
//     } else {
//       topic = 6;
//     }
//   }
//   return topic;
// };

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<Data>
// ) {
//   const apiKey = process.env.OPEN_AI_KEY;

//   if (!apiKey) {
//     res
//       .status(400)
//       .json({ message: "APIキーが間違っているか、設定されていません。" });

//     return;
//   }

//   const configuration = {
//     apiKey: apiKey,
//     dangerouslyAllowBrowser: true,
//   };

//   let prompt = SELECT_PROMPT;
//   const openai = new OpenAI(configuration);

//   const utterances = log.slice(-3).map((entry) => entry.content); // 直近3つのログの配列
//   const utteranceContent = utterances.join(); // 直近3つのログをつなげたもの．FunctionCallingの入力
//   setFunctionCallingInput(utteranceContent); // トークン数を数えるために，FcuntionCallingの入力文字列を保存

//   // openai version: 3.2.1 => 4.28.4
//   // const { data } = await openai.createChatCompletion({
//   //   model: "gpt-3.5-turbo",
//   //   messages: req.body.messages,
//   // });
//   const { choices } = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     messages: req.body.messages,
//   });

//   // const [aiRes] = data.choices;
//   const [aiRes] = choices;
//   const message = aiRes.message?.content || "エラーが発生しました";

//   res.status(200).json({ message: message });
// }
