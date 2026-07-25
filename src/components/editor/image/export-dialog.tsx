"use client";

import { useState } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { canvasToBlob, dataUrlFromCanvas } from "@/lib/image/editor";
import { EXPORT_FORMATS } from "@/types/image-editor";
import { useExportCredits } from "@/hooks/use-export-credits";
import { CreditSpendDialog } from "@/components/credits/credit-spend-dialog";
import { CreditPurchaseModal } from "@/components/credits/credit-purchase-modal";

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const credits = useExportCredits();

  const exportFormat = useImageEditorStore((s) => s.exportFormat);
  const exportQuality = useImageEditorStore((s) => s.exportQuality);
  const exportWidth = useImageEditorStore((s) => s.exportWidth);
  const exportHeight = useImageEditorStore((s) => s.exportHeight);
  const originalWidth = useImageEditorStore((s) => s.originalWidth);
  const originalHeight = useImageEditorStore((s) => s.originalHeight);
  const setExportFormat = useImageEditorStore((s) => s.setExportFormat);
  const setExportQuality = useImageEditorStore((s) => s.setExportQuality);
  const getFinalCanvas = useImageEditorStore((s) => s.getFinalCanvas);

  const handleExport = async () => {
    const allowed = await credits.checkExportCredits(0);
    if (!allowed) return;

    const finalCanvas = getFinalCanvas();
    if (!finalCanvas) return;
    setExporting(true);
    try {
      const quality = exportFormat === "png" ? undefined : exportQuality;
      const blob = await canvasToBlob(finalCanvas, exportFormat, quality as number);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${exportWidth}x${exportHeight}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    const finalCanvas = getFinalCanvas();
    if (!finalCanvas) return;
    try {
      const blob = await canvasToBlob(finalCanvas, "png", 1);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch {
      // fallback: download instead
      handleExport();
    }
  };

  if (!open) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg px-3 py-2 text-xs font-medium transition-all"
        >
          Export Image
        </button>
        {credits.showSpendDialog && (
          <CreditSpendDialog
            feature="export"
            featureLabel="Image Export"
            creditsCost={credits.pendingCost}
            onSpend={credits.confirmSpend}
            onCancel={credits.cancelSpend}
            loading={credits.spending}
          />
        )}
        <CreditPurchaseModal
          open={credits.showPurchaseModal}
          onClose={() => credits.setShowPurchaseModal(false)}
        />
      </>
    );
  }

  return (
    <>
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Export</h3>
        <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary text-[10px]">✕</button>
      </div>

      <div className="text-[10px] text-text-tertiary">
        {originalWidth}×{originalHeight} → <span className="text-text-secondary">{exportWidth}×{exportHeight}</span>
      </div>

      <div>
        <label className="text-[10px] text-text-tertiary mb-1 block">Format</label>
        <div className="flex gap-1">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all uppercase ${
                exportFormat === fmt ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {exportFormat !== "png" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-text-secondary">Quality</label>
            <span className="text-[10px] font-mono text-neon-cyan">{Math.round(exportQuality * 100)}%</span>
          </div>
          <input type="range" min={1} max={100} value={exportQuality * 100}
            onChange={(e) => setExportQuality(Number(e.target.value) / 100)}
            className="w-full accent-neon-cyan h-1"
          />
        </div>
      )}

      <div className="space-y-2">
        <button onClick={handleExport} disabled={exporting}
          className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 disabled:opacity-50 text-neon-cyan rounded-lg px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          {exporting ? "Exporting..." : `Download ${exportFormat.toUpperCase()}`}
        </button>
        <button onClick={handleCopy}
          className="w-full glass hover:bg-glass-medium text-text-secondary rounded-lg px-3 py-2 text-xs transition-all"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>

    {credits.showSpendDialog && (
      <CreditSpendDialog
        feature="export"
        featureLabel="Image Export"
        creditsCost={credits.pendingCost}
        onSpend={credits.confirmSpend}
        onCancel={credits.cancelSpend}
        loading={credits.spending}
      />
    )}
    <CreditPurchaseModal
      open={credits.showPurchaseModal}
      onClose={() => credits.setShowPurchaseModal(false)}
    />
    </>
  );
}
