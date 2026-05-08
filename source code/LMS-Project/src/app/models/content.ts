export interface ContentAttachment {
  id: string;          // UUID / Guid
  fileName: string;
  fileUrl: string;
  contentType: string; // MIME type — drives icon logic
}

export interface Content {
  id: number;
  title: string;
  body: string;
  contentAttachments: ContentAttachment[];
}

/** Client-side only — represents a file staged for upload, not persisted until Step 2 succeeds */
export interface StagedFile {
  file: File;       // Native File object for FormData construction
  name: string;     // file.name — displayed in the list row
  size: number;     // file.size in bytes — formatted for display
  mimeType: string; // file.type — drives icon (application/pdf | video/mp4)
}

