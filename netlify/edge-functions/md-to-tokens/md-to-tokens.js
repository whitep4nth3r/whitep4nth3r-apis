import { marked } from "marked";

export default async function (request) {
  const body = await request.text();
  const tokenisedAsJSON = marked.lexer(body);
  return Response.json(tokenisedAsJSON);
}
