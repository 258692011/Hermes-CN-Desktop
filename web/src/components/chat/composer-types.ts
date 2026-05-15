import type { ModelOptionsResult } from "@hermes/protocol";

export type ComposerAttachmentKind = "image" | "file" | "directory";
export type ComposerAttachmentSource = "browser" | "path" | "uploaded";
export type ComposerAttachmentStatus = "ready" | "uploading" | "processing" | "done" | "error";

export interface ComposerAttachment {
  id: string;
  source: ComposerAttachmentSource;
  path?: string;
  file?: File;
  name: string;
  kind: ComposerAttachmentKind;
  status: ComposerAttachmentStatus;
  size?: number;
  mimeType?: string;
  previewUrl?: string;
  uploadedPath?: string;
  uploadedName?: string;
  progress?: number;
  error?: string;
}

export interface ComposerModelSelection {
  model: string;
  provider?: string;
  providerName?: string;
  contextWindow?: number;
}

export interface ComposerContextUsage {
  used?: number;
  max?: number;
  percent?: number;
  model?: string;
  compressions?: number;
}

export interface ComposerSubmitPayload {
  text: string;
  attachments: ComposerAttachment[];
  workspacePath?: string;
  modelSelection?: ComposerModelSelection;
}

export interface ComposerSubmitControls {
  updateAttachment(id: string, patch: Partial<ComposerAttachment>): void;
}

export interface ComposerModelPickerProps {
  selected?: ComposerModelSelection | null;
  label?: string;
  loadOptions?: () => Promise<ModelOptionsResult>;
  onSelect?: (selection: ComposerModelSelection) => void | Promise<void>;
  disabled?: boolean;
}

export class ComposerAttachmentError extends Error {
  attachmentId?: string;

  constructor(message: string, attachmentId?: string) {
    super(message);
    this.name = "ComposerAttachmentError";
    this.attachmentId = attachmentId;
  }
}
