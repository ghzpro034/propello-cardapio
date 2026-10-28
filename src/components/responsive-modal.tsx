"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

/**
 * No celular abre de baixo para cima (gaveta, arrasta para fechar);
 * no computador abre como janela no centro.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
  footer,
  className,
  style,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  hideTitle?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const desktop = useMediaQuery("(min-width: 768px)")

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          style={style}
          className={cn("flex max-h-[min(88dvh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]", className)}
        >
          <div className={cn("px-6 pt-6", hideTitle && "sr-only")}>
            <DialogTitle className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">{title}</DialogTitle>
            {description ? <DialogDescription className="mt-1 text-sm text-suave">{description}</DialogDescription> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">{children}</div>
          {footer ? <div className="border-t border-linha bg-elevada px-6 py-4">{footer}</div> : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent style={style} className={cn("max-h-[92dvh] bg-elevada", className)}>
        <div className={cn("px-4 pt-3 text-left", hideTitle && "sr-only")}>
          <DrawerTitle className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">{title}</DrawerTitle>
          {description ? <DrawerDescription className="mt-1 text-sm text-suave">{description}</DrawerDescription> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">{children}</div>
        {footer ? (
          <div className="border-t border-linha px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
