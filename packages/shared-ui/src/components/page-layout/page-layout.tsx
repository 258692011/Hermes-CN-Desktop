import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import s from "./page-layout.module.css";

export type PageFrameSize = "readable" | "wide" | "fluid";

export interface PageFrameProps extends HTMLAttributes<HTMLDivElement> {
  size?: PageFrameSize;
  frameClassName?: string;
  children?: ReactNode;
}

export const PageFrame = forwardRef<HTMLDivElement, PageFrameProps>(function PageFrame(
  { size = "wide", className, frameClassName, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(s.viewport, className)}
      data-page-frame="true"
    >
      <div className={cn(s.frame, frameClassName)} data-size={size}>
        {children}
      </div>
    </div>
  );
});

export interface PageGridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const PageGrid = forwardRef<HTMLDivElement, PageGridProps>(function PageGrid(
  { className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(s.grid, className)}
      data-page-grid="true"
    >
      {children}
    </div>
  );
});
