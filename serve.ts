import { serve } from "https://deno.land/std@0.179.0/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { basename } from "https://deno.land/std@0.179.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.179.0/media_types/mod.ts";
import {
  extract,
  test,
} from "https://deno.land/std@0.179.0/encoding/front_matter/any.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.2.1/mod.ts";
import { transpileResponse } from "https://deno.land/x/ts_serve@v1.4.3/utils/transpile_response.ts";

const WEBSITE_URL = "https://piderlab.deno.dev";

interface HtmlRenderOption {
  isTopPage: boolean;
  title: unknown;
  description: unknown;
}

const html = (
  markdown: string,
  { isTopPage, title, description }: HtmlRenderOption,
) => `
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <title>${title || ""} | 信州大学 実証的ソフトウェア工学研究室</title>
    <meta name="theme-color" content="#333333">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${WEBSITE_URL}">
    <meta property="og:image" content="https://favi.deno.dev/⛺.png">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@hideakihata">
    <link rel="icon" type="image/png" href="https://favi.deno.dev/⛺.png">
    <link rel="apple-touch-icon" href="https://favi.deno.dev/⛺.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap" rel="stylesheet" media="print"  onload="this.media='all'">
    <script>
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service_worker.js')
    </script>
    <style>
      body {
        min-height: 105vh;
      }
      header {
        max-width: 800px;
        margin: 0 auto;
        padding: 0.5em 0;
      }
      header a {
        color: #0969da;
      }
      main {
        max-width: 800px;
        margin: 0 auto;
      }
      a {
        line-height: 1.6em;
      }
      ${CSS}
      img{
        width: 80%;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }
      body, main.markdown-body {
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
    </style>
    <meta name="google-site-verification" content="G2ikZbSlbpd3DbXWm1J3PJfIMteHbslhMLmuk1JzwNM" />
  </head>
  <body>
    <header>
      ${isTopPage ? "" : '≪ <a href="/README.md">ホームに戻る</a>'}
    </header>
    <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
      ${render(markdown, { disableHtmlSanitization: true })}
    </main>
  </body>
</html>
`;

serve(async (req) => {
  const res = await serveDir(req);
  const { pathname } = new URL(req.url);

  // トップページが404の場合（＝index.htmlが無い場合）はREADME.mdにリダイレクトする。
  if (pathname.endsWith("/") && res.status === 404) {
    if (await exists(new URL(import.meta.resolve(`.${pathname}README.md`)))) {
      return new Response("301", {
        status: 301,
        headers: { location: `${pathname}README.md` },
      });
    }
  }

  if (pathname.match(/\.png$|\.jpeg$|\.jpg$|\.gif$|\.pdf$/)) {
    res.headers.set("Cache-Control", `max-age=${60 * 60 * 24 * 30}`);
  }

  const isTopPage = pathname === "/README.md";

  if (pathname.endsWith(".md")) {
    // front matterを読んでタイトルを設定
    let body = await res.text();
    let title;
    let description;
    if (test(body)) {
      ({ body, attrs: { title, description } } = extract(body));
    }
    title ||= basename(pathname);
    description ||=
      "信州大学 工学部 電子情報システム工学科 実証的ソフトウェア工学研究室のホームページです。";

    return new Response(html(body, { isTopPage, title, description }), {
      headers: { "Content-Type": contentType(".html") },
    });
  } else if (
    pathname.endsWith(".ts") ||
    pathname.endsWith(".jsx") ||
    pathname.endsWith(".tsx")
  ) {
    return await transpileResponse(res, req.url);
  } else {
    return res;
  }
});

export async function exists(filePath: string | URL): Promise<boolean> {
  try {
    await Deno.lstat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
