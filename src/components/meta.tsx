import { buildUrl } from "@/utils/buildUrl";
import Head from "next/head";
export const Meta = () => {
  const title = "ChatMinamiLab";
  const description =
    "電気通信大学の南研究室を紹介する対話システムです。南研について気軽にお聞きください！この対話システムは調布祭（文化祭）用のオープンラボ用に作られました。";
  const imageUrl = "/screenshot2.png";
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};
