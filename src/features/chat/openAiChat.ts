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

export async function getChatResponseStream(
  messages: Message[],
  generatedBios: string,
  setGeneratedBios: React.Dispatch<React.SetStateAction<string>>
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  console.log("messages: ", messages);

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: messages }),
  });
  console.log("response: ", response);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data = response.body;
  if (!data) {
    return;
  }
  console.log("data: ", data);

  const reader = data.getReader();
  console.log("reader: ", reader);

  const onParseGPT = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      const data = event.data;
      try {
        const text = JSON.parse(data).text ?? "";
        setGeneratedBios((prev) => prev + text);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // const reader = res.body?.getReader();
  // if (res.status !== 200 || !reader) {
  //   throw new Error("Something went wrong");
  // }

  // const reader = data.getReader();
  // const decoder = new TextDecoder();
  // const parser = createParser(onParseGPT);
  // let done = false;
  // while (!done) {
  //   const { value, done: doneReading } = await reader.read();
  //   console.log("value2: ", value);
  //   console.log("done2: ", done);
  //   done = doneReading;
  //   const chunkValue = decoder.decode(value);
  //   parser.feed(chunkValue);
  //   console.log("chunkValue2: ", chunkValue);
  //   console.log("generatedBios: ", generatedBios);
  // }

  function isValidJSON(jsonString: string) {
    try {
      JSON.parse(jsonString);
      return true; // JSON.parseが成功した場合
    } catch (e) {
      return false; // JSON.parseが失敗した場合
    }
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder();
      const parser = createParser(onParseGPT);
      let done = false;
      try {
        while (true) {
          const { value, done: doneReading } = await reader.read();
          console.log("value3: ", value);
          console.log("done3: ", done);
          done = doneReading;

          if (done) break;
          const chunkValue = await decoder.decode(value); //await追加
          console.log("chunkValue3: ", chunkValue);
          parser.feed(chunkValue);
          const chunks = await chunkValue //await追加
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");
          console.log("chunks: ", chunks);
          if (chunks[chunks.length - 1])
            // if (done) break;
            // const data = decoder.decode(value);
            // const chunks = data
            //   .split("data:")
            //   .filter((val) => !!val && val.trim() !== "[DONE]");
            // console.log("chunks: ", chunks);

            for (const chunk of chunks) {
              // 正しくJSONをパースできた場合
              let json: any = { text: "" };
              if (isValidJSON(chunk)) {
                json = await JSON.parse(chunk); //await追加 // TODO: ここが正しくパースできない。元のデータが壊れているため（デプロイ後）。
                console.log("json: ", json);
              } else {
                // json = { text: chunk.replace(/{|}|text|tex|ext|:|\n|\"|/g, "") };
                json = { text: chunk.replace(/[{}"\n:]|text|tex|ext|/g, "") };
              }
              // "{text: aaaa", "a}\n\n{", "text: bbbbbb}",

              // {text: aaaa}\n\n{text: bbbbbb}",

              // "aaaaabbbbbb"
              // {, }, text, : , \n, _

              // const messagePiece = json.choices[0].delta.content;
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

  // const stream = new ReadableStream({
  //   async start(controller: ReadableStreamDefaultController) {
  //     const decoder = new TextDecoder("utf-8");
  //     console.log("decoder: ", decoder);
  //     try {
  //       while (true) {
  //         const { done, value } = await reader.read();
  //         // console.log("value: ", value);
  //         // console.log("done: ", done);
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
  //       reader.releaseLock();
  //       controller.close();
  //     }
  //   },
  // });

  return stream;
}
