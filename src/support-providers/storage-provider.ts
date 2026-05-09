export interface StorageProvider {
  generateUploadUrl(input: {
    fileName: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; key: string; fileId: string }>;
  delete(key: string): Promise<void>;
}
