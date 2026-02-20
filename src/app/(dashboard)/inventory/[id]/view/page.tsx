"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Pencil,
    Package,
    Info,
    ShoppingCart,
    BadgeDollarSign,
    AlertTriangle,
    Image as ImageIcon,
    Loader2,
    ZoomIn,
    ZoomOut,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/shared/premium-card";
import { DetailItem } from "@/components/shared/detail-item";

interface StockImage {
    id: string;
    base64: string;
    isPrimary: boolean;
}

interface Stock {
    id: string;
    productName: string;
    furnitureType: { id: string; name: string };
    fabricType: { id: string; name: string };
    quantity: number;
    minQuantity: number;
    createPrice: number;
    sellingPrice: number;
    images: StockImage[];
    isLowStock: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function InventoryDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<number>(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Zoom & pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    useEffect(() => {
        if (params.id) fetchStock();
    }, [params.id]);

    // Scroll lock
    useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [lightboxOpen]);

    // Reset zoom/pan when switching images
    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [lightboxIndex]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!lightboxOpen || !stock) return;
        if (e.key === "Escape") setLightboxOpen(false);
        if (e.key === "ArrowRight") setLightboxIndex(i => Math.min(i + 1, stock.images.length - 1));
        if (e.key === "ArrowLeft") setLightboxIndex(i => Math.max(i - 1, 0));
        if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 5));
        if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.5));
        if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
    }, [lightboxOpen, stock]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Mouse-wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setZoom(z => Math.min(Math.max(z + delta, 0.5), 5));
    }, []);

    // Drag to pan
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        e.preventDefault();
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        setPan({
            x: dragStart.current.panX + (e.clientX - dragStart.current.x),
            y: dragStart.current.panY + (e.clientY - dragStart.current.y),
        });
    };
    const handleMouseUp = () => { isDragging.current = false; };

    const openLightbox = (idx: number) => {
        setLightboxIndex(idx);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const fetchStock = async () => {
        try {
            const response = await fetch(`/api/inventory/${params.id}`);
            const result = await response.json();
            if (result.success) {
                setStock(result.data);
            } else {
                toast({ title: "Error", description: "Stock item not found", variant: "destructive" });
                router.push("/inventory");
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch stock details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stock) return null;

    const profitMargin = stock.sellingPrice - stock.createPrice;
    const profitPercentage = stock.createPrice > 0
        ? ((profitMargin / stock.createPrice) * 100).toFixed(2)
        : "0";

    const hasImages = stock.images && stock.images.length > 0;

    return (
        <>
            {/* ─── Lightbox Overlay ─── */}
            {lightboxOpen && hasImages && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center select-none h-screen"
                    onClick={closeLightbox}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-20"
                        onClick={closeLightbox}
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-heading tracking-widest uppercase z-20">
                        {lightboxIndex + 1} / {stock.images.length}
                    </div>

                    {/* Zoom controls */}
                    <div
                        className="absolute top-4 right-16 flex items-center gap-1 z-20"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                            title="Zoom out (−)"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-white/50 text-xs font-heading w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(z => Math.min(z + 0.25, 5))}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                            title="Zoom in (+)"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        {zoom !== 1 && (
                            <button
                                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                                className="ml-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-[10px] font-heading uppercase tracking-wider transition-colors"
                                title="Reset (0)"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Prev */}
                    {lightboxIndex > 0 && (
                        <button
                            className="absolute left-4 text-white/60 hover:text-white transition-colors z-20 p-2 rounded-full bg-white/5 hover:bg-white/15"
                            onClick={e => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                    )}

                    {/* Image — zoomable + draggable */}
                    <div
                        className="overflow-hidden flex items-center justify-center"
                        style={{ width: "90vw", height: "80vh" }}
                        onWheel={handleWheel}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={stock.images[lightboxIndex].base64}
                            alt={`${stock.productName} — photo ${lightboxIndex + 1}`}
                            className="object-contain rounded-sm shadow-2xl transition-transform duration-100 max-h-full max-w-full"
                            style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                cursor: zoom > 1 ? (isDragging.current ? "grabbing" : "grab") : "default",
                                userSelect: "none",
                            }}
                            onMouseDown={handleMouseDown}
                            draggable={false}
                        />
                    </div>

                    {/* Next */}
                    {lightboxIndex < stock.images.length - 1 && (
                        <button
                            className="absolute right-4 text-white/60 hover:text-white transition-colors z-20 p-2 rounded-full bg-white/5 hover:bg-white/15"
                            onClick={e => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    )}

                    {/* Zoom hint */}
                    {zoom === 1 && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/25 text-[10px] font-heading uppercase tracking-widest pointer-events-none">
                            Scroll to zoom · Drag to pan
                        </div>
                    )}

                    {/* Thumbnail strip */}
                    {stock.images.length > 1 && (
                        <div
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] py-2 px-3 rounded-lg bg-white/5 border border-white/10 z-20"
                            onClick={e => e.stopPropagation()}
                        >
                            {stock.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setLightboxIndex(idx)}
                                    className={cn(
                                        "flex-none w-14 h-14 rounded-sm overflow-hidden border-2 transition-all hover:scale-105",
                                        lightboxIndex === idx
                                            ? "border-primary opacity-100"
                                            : "border-transparent opacity-40 hover:opacity-80"
                                    )}
                                >
                                    <img src={img.base64} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Main Page ─── */}
            <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 page-enter print:p-0 print:space-y-4 pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
                    <div className="flex items-center gap-5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-primary/10 hover:text-primary transition-all h-11 w-11 rounded-sm border hover:border-primary/20"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">
                                    {stock.productName}
                                </h1>
                                {stock.quantity === 0 ? (
                                    <Badge variant="outline" className="text-red-600 dark:text-red-500 border-red-500/30 bg-red-500/10 text-xs px-3 py-1 rounded-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                                        <Package className="h-3 w-3" />
                                        Out of Stock
                                    </Badge>
                                ) : stock.isLowStock ? (
                                    <Badge variant="outline" className="text-red-600 dark:text-red-500 border-red-500/30 bg-red-500/10 text-xs px-3 py-1 rounded-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                                        <AlertTriangle className="h-3 w-3" />
                                        Low Stock
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                                <Package className="h-4 w-4 opacity-70" />
                                <span className="font-medium">Added {format(new Date(stock.createdAt), "MMM dd, yyyy")}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1" />
                                <span className="text-xs uppercase tracking-widest font-bold opacity-60">Inventory System</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push(`/inventory/${stock.id}`)}
                            className="h-11 px-6 rounded-sm font-bold shadow-lg shadow-primary/20 hover-scale bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Product
                        </Button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid gap-6 md:grid-cols-3 print:grid-cols-2">
                    {/* ─── Gallery Card ─── */}
                    <div className="glass-card md:col-span-2 flex flex-col overflow-hidden border print:border-none shadow-xl shadow-black/5">
                        <div className="p-6 border-b border-white/5 bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20 no-print">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold font-heading uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                            Product Gallery
                                        </h3>
                                        <p className="text-sm text-muted-foreground no-print font-medium opacity-70 italic">
                                            {hasImages ? "Click image to open fullscreen viewer" : "No photos uploaded yet"}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="rounded-sm font-heading text-xs py-1.5 px-3 bg-background/50 no-print">
                                    {stock.images?.length || 0} Photos
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1">
                            {hasImages ? (
                                <div className="flex flex-col">
                                    {/* Main image — fixed aspect ratio, object-contain, dark bg */}
                                    <div
                                        className="relative w-full p-4 cursor-zoom-in group"
                                        style={{ aspectRatio: "16/10" }}
                                        onClick={() => openLightbox(activeImage)}
                                    >
                                        <img
                                            src={stock.images[activeImage].base64}
                                            alt={stock.productName}
                                            className="w-full h-full object-contain"
                                        />
                                        {/* Zoom hint overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                            <div className="flex items-center gap-2 bg-black/70 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-sm">
                                                <ZoomIn className="h-4 w-4" />
                                                Open Gallery
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thumbnail strip */}
                                    {stock.images.length > 1 && (
                                        <div className="flex gap-2 p-3 bg-muted/30 border-t border-border/30 overflow-x-auto scrollbar-hide">
                                            {stock.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImage(idx)}
                                                    className={cn(
                                                        "flex-none w-16 h-16 rounded-sm overflow-hidden border-2 transition-all hover:scale-105 bg-zinc-900",
                                                        activeImage === idx
                                                            ? "border-primary ring-2 ring-primary/20 opacity-100"
                                                            : "border-transparent opacity-50 hover:opacity-90"
                                                    )}
                                                >
                                                    <img
                                                        src={img.base64}
                                                        className="w-full h-full object-contain"
                                                        alt={`Photo ${idx + 1}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground" style={{ minHeight: "360px" }}>
                                    <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                                    <p className="text-sm font-medium tracking-wide uppercase opacity-50">No Product Images Available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Sidebar ─── */}
                    <div className="space-y-6">
                        <PremiumCard title="Specifications" description="Product Classification" icon={Info} delay={100}>
                            <div className="space-y-6">
                                <DetailItem
                                    label="Furniture Category"
                                    value={stock.furnitureType.name}
                                    valueClassName="font-bold text-lg tracking-tight"
                                />
                                <DetailItem
                                    label="Primary Material"
                                    value={stock.fabricType.name}
                                    valueClassName="font-bold text-lg tracking-tight"
                                />
                            </div>
                        </PremiumCard>

                        <PremiumCard title="Inventory Levels" description="Stock Quantities" icon={ShoppingCart} delay={200}>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem
                                    label="Current Stock"
                                    value={stock.quantity}
                                    valueClassName={cn(
                                        "font-bold text-2xl font-heading",
                                        stock.quantity <= stock.minQuantity ? "text-red-500" : ""
                                    )}
                                />
                                <DetailItem
                                    label="Low Stock Alert At"
                                    value={stock.minQuantity}
                                    valueClassName="text-lg font-heading text-muted-foreground"
                                />
                            </div>
                            {stock.quantity === 0 ? (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2 text-red-600 dark:text-red-500">
                                    <Package className="h-4 w-4 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium">This item is completely out of stock. Restock immediately to resume order fulfillment.</p>
                                </div>
                            ) : stock.quantity <= stock.minQuantity ? (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2 text-red-600 dark:text-red-500">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium">Running low — consider reordering or accelerating production.</p>
                                </div>
                            ) : null}
                        </PremiumCard>

                        <PremiumCard title="Financial Details" description="Pricing and Margins" icon={BadgeDollarSign} delay={300}>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end gap-4">
                                    <DetailItem
                                        label="Unit Cost"
                                        value={`Rs. ${stock.createPrice.toLocaleString()}`}
                                        valueClassName="text-muted-foreground font-heading"
                                    />
                                    <DetailItem
                                        label="Retail Price"
                                        value={`Rs. ${stock.sellingPrice.toLocaleString()}`}
                                        valueClassName="text-primary text-xl font-heading"
                                    />
                                </div>
                                <div className="pt-4 border-t border-border/40">
                                    <div className="flex justify-between items-end gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Profit Per Unit</p>
                                            <p className="text-2xl font-black font-heading tracking-tight">Rs. {profitMargin.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">ROI</p>
                                            <p className={cn(
                                                "text-xl font-black font-heading tracking-tight",
                                                Number(profitPercentage) > 20 ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {profitPercentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </>
    );
}
