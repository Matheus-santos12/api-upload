import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage-provider.js";

export class LocalProvider implements StorageProvider {
  private uploadsDir = "./uploads";
  async generateUploadUrl(input: {
    fileName: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; key: string; fileId: string }> {
    const fileId = randomUUID();
    const key = `${fileId}-${input.fileName}`;
    const uploadUrl = `${this.baseUrl}/_local/uploads/${key}`;

    return { uploadUrl, key, fileId };
  }
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, key);
    await fs.unlink(filePath);
  }
  private baseUrl = "http://localhost:3333";
}
