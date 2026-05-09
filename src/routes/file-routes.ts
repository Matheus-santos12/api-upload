import type { FastifyInstance } from "fastify";
import fs from "node:fs/promises";
import path from "node:path";
import { fileStore } from "../store.js";
import { provider } from "../support-providers/index.js";

export async function fileRoutes(app: FastifyInstance) {
  app.addContentTypeParser("*", { parseAs: "buffer" }, (_req, body, done) =>
    done(null, body),
  );

  app.post("/file/upload", async (request) => {
    const { fileName, contentType } = request.body as {
      fileName: string;
      contentType: string;
    };
    const result = await provider.generateUploadUrl({ fileName, contentType });
    fileStore.set(result.fileId, { key: result.key, provider: "local" });
    return { fileId: result.fileId, uploadUrl: result.uploadUrl };
  });

  app.delete("/file/:fileId", async (request, reply) => {
    const { fileId } = request.params as {
      fileId: string;
    };
    const record = fileStore.get(fileId);
    if (!record)
      return reply
        .status(404)
        .send({ message: "O arquivo não foi encontrado" });
    await provider.delete(record.key);
    fileStore.delete(fileId);
    reply.status(204).send();
  });

  app.put("/_local/uploads/:key", async (request, reply) => {
    const { key } = request.params as { key: string };
    const buffer = request.body as Buffer;
    const filePath = path.join("./uploads", key);
    await fs.writeFile(filePath, buffer);
    reply.status(204).send();
  });
}
