export interface UploadUrlResponse {
  uploadUrl: string;
  attachmentId: string;
  s3Key: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
}