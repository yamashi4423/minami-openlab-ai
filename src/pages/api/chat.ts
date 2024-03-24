import { OpenAI } from "openai";
import { OpenAIStream } from "@/utils/OpenAIStream";

import type { NextApiRequest, NextApiResponse } from "next";

const MODEL_NAME = "gpt-3.5-turbo";

type Data = {
  response: ReadableStream<Uint8Array> | null;
  message: string;
};

export const config = {
  runtime: "edge",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const messages = req.body.messages;

  if (!apiKey) {
    res.status(400).json({
      response: null,
      message: "APIキーが間違っているか、設定されていません。",
    });

    return;
  }
  try {
    const configuration = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    };

    const openai = new OpenAI(configuration);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // const openAIResponse = await fetch(
    //   "https://api.openai.com/v1/chat/completions",
    //   {
    //     headers: headers,
    //     method: "POST",
    //     body: JSON.stringify({
    //       model: MODEL_NAME,
    //       messages: messages,
    //       stream: true,
    //       max_tokens: 200,
    //     }),
    //   }
    // );

    // const reader = openAIResponse.body?.getReader();

    // const stream = new ReadableStream({
    //   async start(controller: ReadableStreamDefaultController) {
    //     const decoder = new TextDecoder("utf-8");
    //     try {
    //       while (true) {
    //         const { done, value } =
    //           (await reader?.read()) as ReadableStreamReadResult<Uint8Array>;
    //         if (done) break;
    //         const data = decoder.decode(value);
    //         const chunks = data
    //           .split("data:")
    //           .filter((val) => !!val && val.trim() !== "[DONE]");
    //         for (const chunk of chunks) {
    //           const json = JSON.parse(chunk);
    //           const messagePiece = json.choices[0].delta.content;
    //           if (!!messagePiece) {
    //             controller.enqueue(messagePiece);
    //           }
    //         }
    //       }
    //     } catch (error) {
    //       controller.error(error);
    //     } finally {
    //       reader?.releaseLock();
    //       controller.close();
    //     }
    //   },
    // });

    // const params = {
    //   model: MODEL_NAME,
    //   messages: messages,
    //   max_tokens: 200,
    // };

    // const stream = await openai.chat.completions.create({
    //   ...params,
    //   stream: true,
    // });

    // // const stream = response.data as unknown as IncomingMessage;
    // for await (const chunk of stream) {
    //   const lines: string[] = chunk
    //     .toString()
    //     .split("\n")
    //     .filter((line: string) => line.trim().startsWith("data: "));

    //   for (const line of lines) {
    //     const message = line.replace(/^data: /, "");
    //     if (message === "[DONE]") {
    //       return;
    //     }

    //     const json = JSON.parse(message);
    //     const token: string | undefined = json.choices[0].delta.content;
    //     if (token) {
    //       yield token;
    //     }
    //   }
    // }
    const payload = {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.9,
      max_tokens: 300,
      stream: true,
    };
    console.log("[chat.ts] flag1");
    const stream = await OpenAIStream(payload);
    console.log("stream: ", stream);
    return new Response(stream);

    // res.status(200).json({
    //   response: stream,
    //   message: "stream取得に成功しました",
    // });
  } catch {
    res
      .status(200)
      .json({ response: null, message: "stream取得に失敗しました" });
  }
}
