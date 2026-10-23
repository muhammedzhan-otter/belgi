import { handleApi } from "../../../cloudflare/src/index.js";

export const onRequest = ({ request, env }) => handleApi(request, env);
