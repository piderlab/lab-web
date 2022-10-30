import { serve } from "https://deno.land/std@0.160.0/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.160.0/http/file_server.ts";
import { contentType } from "https://deno.land/std@0.160.0/media_types/mod.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.1.26/mod.ts";

const html = (markdown: string) => `
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>畑研究室</title>
    <style>
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
  </head>
  <body>
    <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
      ${render(markdown)}
    </main>
  </body>
</html>
`;

serve(async (req) => {
  const res = await serveDir(req);
  const { pathname } = new URL(req.url);
  if (pathname.endsWith(".md")) {
    return new Response(html(await res.text()), {
      headers: { "Content-Type": contentType(".html") },
    });
  } else {
    return res;
  }
});
