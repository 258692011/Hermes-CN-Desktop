import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { GatewayModelProvider, ModelOptionsResult } from "@hermes/protocol";
import type { ComposerModelPickerProps, ComposerModelSelection } from "./composer-types";
import s from "./goose-composer.module.css";

export function providerLabel(provider: GatewayModelProvider): string {
  return provider.name || provider.slug;
}

export function providerMatches(provider: GatewayModelProvider, query: string): boolean {
  if (!query) return true;
  const haystack = [
    provider.slug,
    provider.name,
    ...(provider.models ?? []),
  ].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function modelMatches(model: string, query: string): boolean {
  return !query || model.toLowerCase().includes(query);
}

export function modelButtonText(
  picker: ComposerModelPickerProps | undefined,
  options: ModelOptionsResult | null,
): string {
  return picker?.selected?.model || options?.model || picker?.label || "切换模型";
}

interface ModelPickerViewProps {
  modelSearch: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  error: string;
  filteredProviders: GatewayModelProvider[];
  activeProvider: GatewayModelProvider | null;
  onProviderSelect: (slug: string) => void;
  visibleModels: string[];
  modelOptions: ModelOptionsResult | null;
  /** Caller's currently-selected model (typically session-scoped). Used to
   * mark the "当前" badge inside the picker. Falls back to modelOptions
   * (gateway-level active model) when not provided. */
  selected?: ComposerModelSelection | null;
  switchingModel: boolean;
  onSelectModel: (selection: ComposerModelSelection) => void;
}

interface ModelPickerPanelProps extends ModelPickerViewProps {
  onClose: () => void;
}

interface ModelPickerBodyProps extends ModelPickerViewProps {
  searchInputRef?: RefObject<HTMLInputElement | null>;
  closeControl?: ReactNode;
}

function ModelPickerBody({
  modelSearch,
  onSearchChange,
  loading,
  error,
  filteredProviders,
  activeProvider,
  onProviderSelect,
  visibleModels,
  modelOptions,
  selected,
  switchingModel,
  onSelectModel,
  searchInputRef,
  closeControl,
}: ModelPickerBodyProps) {
  const currentModel = selected?.model ?? modelOptions?.model;
  const currentProvider = selected?.provider ?? modelOptions?.provider;
  return (
    <>
      <div className={s.modelPanelHeader}>
        <input
          ref={searchInputRef}
          value={modelSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索模型或供应商"
          className={s.modelSearch}
        />
        {closeControl}
      </div>
      {loading ? <div className={s.modelEmpty}>加载模型...</div> : null}
      {error ? <div className={s.modelError}>{error}</div> : null}
      {!loading && !error ? (
        <div className={s.modelGrid}>
          <div className={s.providerList}>
            {filteredProviders.map((provider) => (
              <button
                key={provider.slug}
                type="button"
                className={s.providerItem}
                data-active={activeProvider?.slug === provider.slug}
                onClick={() => onProviderSelect(provider.slug)}
              >
                <span>{providerLabel(provider)}</span>
                <small>{provider.total_models ?? provider.models?.length ?? 0}</small>
              </button>
            ))}
          </div>
          <div className={s.modelList}>
            {activeProvider && visibleModels.length === 0 ? (
              <div className={s.modelEmpty}>没有匹配模型</div>
            ) : null}
            {activeProvider
              ? visibleModels.map((model) => (
                  <button
                    key={`${activeProvider.slug}:${model}`}
                    type="button"
                    className={s.modelItem}
                    data-current={
                      model === currentModel &&
                      (currentProvider === undefined ||
                        activeProvider.slug === currentProvider)
                    }
                    disabled={switchingModel}
                    onClick={() => onSelectModel({
                      model,
                      provider: activeProvider.slug,
                      providerName: providerLabel(activeProvider),
                    })}
                  >
                    <span>{model}</span>
                    {model === currentModel ? <small>当前</small> : null}
                  </button>
                ))
              : <div className={s.modelEmpty}>没有可用模型</div>}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ModelPickerPanel({ onClose, ...props }: ModelPickerPanelProps) {
  return (
    <div className={s.modelPanel}>
      <ModelPickerBody
        {...props}
        closeControl={(
          <button type="button" className={s.modelClose} onClick={onClose} aria-label="关闭模型选择">
            ×
          </button>
        )}
      />
    </div>
  );
}

export function ModelPickerModal({ onClose, ...props }: ModelPickerPanelProps) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={s.modelModalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={s.modelModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={s.modelModalTitleBar}>
          <h2 id={titleId}>选择模型</h2>
          <button
            type="button"
            className={s.modelModalClose}
            onClick={onClose}
            aria-label="关闭模型选择"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <ModelPickerBody {...props} searchInputRef={searchInputRef} />
      </div>
    </div>,
    document.body,
  );
}
