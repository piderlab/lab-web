import { serve } from "https://deno.land/std@0.175.0/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.175.0/http/file_server.ts";
import { basename } from "https://deno.land/std@0.175.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.175.0/media_types/mod.ts";
import {
  extract,
  test,
} from "https://deno.land/std@0.175.0/encoding/front_matter/any.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.1.26/mod.ts";
import { transpileResponse } from "https://deno.land/x/ts_serve@v1.4.3/utils/transpile_response.ts";

const html = (
  markdown: string,
  { isTopPage, title }: { isTopPage: boolean; title: unknown },
) => `
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || ""} | 信州大学 実証的ソフトウェア工学研究室</title>
    <style>
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
      ${CSS}
      img{
        width: 80%;
        display: block;
        margin-left: auto;
        margin-right: auto;
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

  const isTopPage = pathname === "/README.md";

  if (pathname.endsWith(".md")) {
    // front matterを読んでタイトルを設定
    let body = await res.text();
    let title;
    if (test(body)) {
      ({ body, attrs: { title } } = extract(body));
    }
    title ||= basename(pathname);

    return new Response(html(body, { isTopPage, title }), {
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
