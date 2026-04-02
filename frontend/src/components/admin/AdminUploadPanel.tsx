import type { ReactNode } from "react";
import type { FileUploadRecord } from "@/types/models";

type Props = {
  title: string;
  scope: string;
  inputId: string;
  drag: boolean;
  setDrag: (v: boolean) => void;
  uploading: boolean;
  apiReady: boolean;
  onPickFiles: () => void;
  onFiles: (files: FileList | null) => void;
  uploads: FileUploadRecord[];
  extra?: ReactNode;
};

export function AdminUploadPanel({
  title,
  scope: _scope,
  inputId,
  drag,
  setDrag,
  uploading,
  apiReady,
  onPickFiles,
  onFiles,
  uploads,
  extra,
}: Props) {
  void _scope;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="material-symbols-outlined text-secondary">upload_file</span>
          {title}
        </h2>
        <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
          NAS
        </span>
      </div>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={onPickFiles}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onPickFiles();
        }}
        className={[
          "flex min-h-[200px] cursor-pointer flex-col items-center justify-center space-y-3 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center transition-all hover:border-primary group",
          drag ? "border-primary bg-primary-fixed/10" : "",
        ].join(" ")}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed transition-transform group-hover:scale-110">
          <span className="material-symbols-outlined text-3xl text-primary">
            cloud_upload
          </span>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-on-surface">드래그하거나 클릭하여 업로드</p>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Express · data/uploads
            <br />
            {uploading ? "업로드 중…" : apiReady ? "여러 파일 선택 가능" : "백엔드 연결 후 사용"}
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {extra}
      {uploads.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-on-surface-variant">
            이 탭 업로드 ({uploads.length})
          </p>
          <ul className="max-h-36 space-y-2 overflow-y-auto text-xs">
            {uploads.map((u) => (
              <li key={u.id}>
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {u.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
