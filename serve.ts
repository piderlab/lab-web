import { serve } from "https://deno.land/std@0.160.0/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.160.0/http/file_server.ts";

serve((req) => serveDir(req));
