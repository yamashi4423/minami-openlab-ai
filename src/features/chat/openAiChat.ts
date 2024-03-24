import OpenAI from "openai";
import { Message } from "../messages/messages";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { useState } from "react";

const MODEL_NAME = "gpt-3.5-turbo";

export async function getChatResponse(messages: Message[], apiKey: string) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const configuration = {
    apiKey: apiKey,
  };
  // ブラウザからAPIを叩くときに発生するエラーを無くすworkaround
  // https://github.com/openai/openai-node/issues/6#issuecomment-1492814621
  // delete configuration.baseOptions.headers["User-Agent"];

  const openai = new OpenAI(configuration);

  const { choices } = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages: messages,
  });

  const [aiRes] = choices;
  const message = aiRes.message?.content || "エラーが発生しました";

  return { message: message };
}

export async function getChatResponseStream(messages: Message[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: messages }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data = response.body;
  if (!data) {
    return;
  }

  const reader = data.getReader();

  const onParseGPT = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      const data = event.data;
      try {
        const text = JSON.parse(data).text ?? "";
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder();
      const parser = createParser(onParseGPT);
      let done = false;
      try {
        while (true) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (done) break;
          const chunkValue = decoder.decode(value);
          parser.feed(chunkValue);
          const chunks = chunkValue
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");

          for (const chunk of chunks) {
            const json = JSON.parse(chunk);
            const messagePiece = json.text;
            if (!!messagePiece) {
              controller.enqueue(messagePiece);
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return stream;
}
