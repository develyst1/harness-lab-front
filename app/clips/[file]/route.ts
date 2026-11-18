// /clips/<file>: the browser asks the front for a clip; this forwards the request (with its Range header) to the back's
// /clips/<file> and streams the answer back, so the page has one public origin (SPEC-002 § Contract). The back decides
// which clips exist; anything that is not a plain .mp4 name, or a back that cannot be reached, is a 404.

const NAME = /^[A-Za-z0-9._-]+\.mp4$/;
const PASSED = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"];

type Context = { params: Promise<{ file: string }> };

const notFound = () => Response.json({ error: "not_found" }, { status: 404 });

async function forward(request: Request, { params }: Context, method: "GET" | "HEAD") {
  const { file } = await params;
  if (!NAME.test(file)) return notFound();
  const backUrl = process.env.BACK_URL || "http://127.0.0.1:4101";
  const range = request.headers.get("range");
  let res: Response;
  try {
    res = await fetch(`${backUrl}/clips/${file}`, { method, headers: range ? { range } : {}, cache: "no-store" });
  } catch {
    return notFound();
  }
  const headers = new Headers();
  for (const name of PASSED) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(method === "HEAD" ? null : res.body, { status: res.status, headers });
}

export function GET(request: Request, context: Context) {
  return forward(request, context, "GET");
}

export function HEAD(request: Request, context: Context) {
  return forward(request, context, "HEAD");
}
