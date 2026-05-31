import { useState, useRef } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WholesaleProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  mrp: number;
  purchase_price: number;
  sale_price: number;
  case_qty: number;
  case_price: number;
  stock: number;
  is_visible: boolean;
  category_id: string | null;
  brand_id: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
}

type WholesaleProductRow = Database["public"]["Tables"]["wholesale_products"]["Row"];

type WholesaleProductInsert = Database["public"]["Tables"]["wholesale_products"]["Insert"];

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

interface ParsedProduct {
  product_code: string;
  name: string;
  description: string;
  mrp: number;
  purchase_price: number;
  sale_price: number;
  case_qty: number;
  stock: number;
  category_name: string;
  brand_name: string;
  is_visible: boolean;
  status: "valid" | "error" | "warning";
  errors: string[];
}

interface Props {
  products: WholesaleProduct[];
  categories: Category[];
  brands: Brand[];
  onRefresh: () => void;
}

export default function BulkWholesaleOperations({ products, categories, brands, onRefresh }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<"add" | "update">("add");
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const downloadTemplate = () => {
    const headers = ["product_code","name","description","mrp","purchase_price","sale_price","case_qty","stock","category_name","brand_name","is_visible"];
    const sampleRow = ["WS001","Sample Wholesale Product","Description","100","60","80","10","50",categories[0]?.name || "Category",brands[0]?.name || "Brand","true"];
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wholesale_products_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProducts = () => {
    const headers = ["product_code","name","description","mrp","purchase_price","sale_price","case_qty","case_price","stock","category_name","brand_name","is_visible"];
    const rows = products.map(p => [
      p.product_code,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`,
      p.mrp, p.purchase_price, p.sale_price, p.case_qty, p.case_price, p.stock,
      p.category?.name || "", p.brand?.name || "",
      p.is_visible ? "true" : "false",
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wholesale_products_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) { result.push(current); current = ""; }
      else current += char;
    }
    result.push(current);
    return result;
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const parsed: ParsedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const product: ParsedProduct = {
        product_code: "", name: "", description: "", mrp: 0, purchase_price: 0,
        sale_price: 0, case_qty: 1, stock: 0, category_name: "", brand_name: "",
        is_visible: true, status: "valid", errors: [],
      };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || "";
        switch (header) {
          case "product_code": product.product_code = value; break;
          case "name": product.name = value; break;
          case "description": product.description = value; break;
          case "mrp": product.mrp = parseFloat(value) || 0; break;
          case "purchase_price": product.purchase_price = parseFloat(value) || 0; break;
          case "sale_price": product.sale_price = parseFloat(value) || 0; break;
          case "case_qty": product.case_qty = parseInt(value) || 1; break;
          case "stock": product.stock = parseInt(value) || 0; break;
          case "category_name": product.category_name = value; break;
          case "brand_name": product.brand_name = value; break;
          case "is_visible": product.is_visible = value.toLowerCase() === "true"; break;
        }
      });

      if (!product.product_code) { product.errors.push("Missing product code"); product.status = "error"; }
      if (!product.name) { product.errors.push("Missing product name"); product.status = "error"; }
      if (product.mrp <= 0) { product.errors.push("Invalid MRP"); product.status = "error"; }
      if (product.sale_price <= 0) { product.errors.push("Invalid sale price"); product.status = "error"; }
      if (parsed.some(p => p.product_code === product.product_code)) { product.errors.push("Duplicate code in file"); product.status = "error"; }

      const existsInDB = products.some(p => p.product_code === product.product_code);
      if (uploadMode === "add" && existsInDB) { product.errors.push("Code already exists"); product.status = "warning"; }
      if (uploadMode === "update" && !existsInDB) { product.errors.push("Product not found"); product.status = "warning"; }

      parsed.push(product);
    }
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast({ title: "Please upload a CSV file", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = parseCSV(event.target?.result as string);
      setParsedProducts(parsed);
      setIsUploadDialogOpen(true);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processBulkUpload = async () => {
    const validProducts = parsedProducts.filter(p => p.status !== "error");
    if (validProducts.length === 0) { toast({ title: "No valid products to upload", variant: "destructive" }); return; }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      let processed = 0;
      for (const product of validProducts) {
        const categoryId = categories.find(c => c.name.toLowerCase() === product.category_name.toLowerCase())?.id;
        const brandId = brands.find(b => b.name.toLowerCase() === product.brand_name.toLowerCase())?.id;
        const casePrice = product.sale_price * product.case_qty;
        const productData: WholesaleProductInsert = {
          product_code: product.product_code,
          name: product.name,
          description: product.description || null,
          mrp: product.mrp,
          purchase_price: product.purchase_price,
          sale_price: product.sale_price,
          case_qty: product.case_qty,
          case_price: casePrice,
          stock: product.stock,
          category_id: categoryId || null,
          brand_id: brandId || null,
          is_visible: product.is_visible,
        };
        if (uploadMode === "update") {
          await supabase.from("wholesale_products").update(productData).eq("product_code", product.product_code);
        } else {
          await supabase.from("wholesale_products").insert(productData);
        }
        processed++;
        setUploadProgress(Math.round((processed / validProducts.length) * 100));
      }
      toast({ title: `Successfully ${uploadMode === "update" ? "updated" : "added"} ${validProducts.length} wholesale products` });
      setIsUploadDialogOpen(false);
      setParsedProducts([]);
      onRefresh();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast({ title: "Error processing products", description: err.message, variant: "destructive" });
    } finally { setIsUploading(false); setUploadProgress(0); }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));
  };

  const applyBulkEdit = async () => {
    if (!bulkEditField || selectedProducts.length === 0) { toast({ title: "Select products and a field", variant: "destructive" }); return; }
    setIsBulkSaving(true);
    try {
      const updateData: Partial<WholesaleProductRow> = {};
      switch (bulkEditField) {
        case "stock": updateData.stock = parseInt(bulkEditValue) || 0; break;
        case "mrp": updateData.mrp = parseFloat(bulkEditValue) || 0; break;
        case "sale_price": updateData.sale_price = parseFloat(bulkEditValue) || 0; break;
        case "purchase_price": updateData.purchase_price = parseFloat(bulkEditValue) || 0; break;
        case "is_visible": updateData.is_visible = bulkEditValue === "true"; break;
        case "category_id": updateData.category_id = bulkEditValue || null; break;
        case "brand_id": updateData.brand_id = bulkEditValue || null; break;
        case "case_qty": {
          const newCaseQty = parseInt(bulkEditValue) || 1;
          for (const id of selectedProducts) {
            const p = products.find(x => x.id === id);
            if (p) await supabase.from("wholesale_products").update({ case_qty: newCaseQty, case_price: p.sale_price * newCaseQty }).eq("id", id);
          }
          toast({ title: `Updated ${selectedProducts.length} products` });
          resetBulkEdit(); onRefresh(); return;
        }
        case "stock_increase": {
          for (const id of selectedProducts) {
            const p = products.find(x => x.id === id);
            if (p) await supabase.from("wholesale_products").update({ stock: p.stock + (parseInt(bulkEditValue) || 0) }).eq("id", id);
          }
          toast({ title: `Updated ${selectedProducts.length} products` });
          resetBulkEdit(); onRefresh(); return;
        }
        case "price_percent": {
          const percent = parseFloat(bulkEditValue) || 0;
          for (const id of selectedProducts) {
            const p = products.find(x => x.id === id);
            if (p) {
              const newSale = Math.round(p.sale_price * (1 + percent / 100));
              await supabase.from("wholesale_products").update({
                mrp: Math.round(p.mrp * (1 + percent / 100)),
                purchase_price: Math.round(p.purchase_price * (1 + percent / 100)),
                sale_price: newSale,
                case_price: newSale * p.case_qty,
              }).eq("id", id);
            }
          }
          toast({ title: `Updated prices for ${selectedProducts.length} products` });
          resetBulkEdit(); onRefresh(); return;
        }
      }
      if (Object.keys(updateData).length > 0) {
        // If sale_price changed, recalculate case_price for each
        if (updateData.sale_price) {
          for (const id of selectedProducts) {
            const p = products.find(x => x.id === id);
            if (p) await supabase.from("wholesale_products").update({ ...updateData, case_price: updateData.sale_price * p.case_qty }).eq("id", id);
          }
        } else {
          const { error } = await supabase.from("wholesale_products").update(updateData).in("id", selectedProducts);
          if (error) throw error;
        }
        toast({ title: `Updated ${selectedProducts.length} products` });
        resetBulkEdit(); onRefresh();
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast({ title: "Error updating products", description: err.message, variant: "destructive" });
    } finally { setIsBulkSaving(false); }
  };

  const resetBulkEdit = () => {
    setIsBulkEditDialogOpen(false);
    setSelectedProducts([]);
    setBulkEditField("");
    setBulkEditValue("");
  };

  const validCount = parsedProducts.filter(p => p.status === "valid").length;
  const warningCount = parsedProducts.filter(p => p.status === "warning").length;
  const errorCount = parsedProducts.filter(p => p.status === "error").length;

  return (
    <>
      <Card className="shadow-card mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />Wholesale Bulk Operations
          </CardTitle>
          <CardDescription>Import, export, and bulk edit wholesale products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2"><Download className="h-4 w-4" />Download Template</Button>
            <Button variant="outline" onClick={exportProducts} className="gap-2"><Download className="h-4 w-4" />Export Products</Button>
            <div className="relative">
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              <Button variant="default" onClick={() => { setUploadMode("add"); fileInputRef.current?.click(); }} className="gap-2"><Upload className="h-4 w-4" />Import New</Button>
            </div>
            <Button variant="secondary" onClick={() => { setUploadMode("update"); fileInputRef.current?.click(); }} className="gap-2"><Upload className="h-4 w-4" />Update Existing</Button>
            <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(true)} disabled={products.length === 0} className="gap-2"><Edit3 className="h-4 w-4" />Bulk Edit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Preview Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{uploadMode === "update" ? "Update" : "Import"} Wholesale Products from CSV</DialogTitle>
            <DialogDescription>Review the products before {uploadMode === "update" ? "updating" : "importing"}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />{validCount} Valid</Badge>
            <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />{warningCount} Warnings</Badge>
            <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{errorCount} Errors</Badge>
          </div>
          {isUploading && <div className="mb-4"><Progress value={uploadProgress} className="h-2" /><p className="text-sm text-muted-foreground mt-1">Processing... {uploadProgress}%</p></div>}
          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead>
                  <TableHead>MRP</TableHead><TableHead>Sale</TableHead><TableHead>Case Qty</TableHead>
                  <TableHead>Stock</TableHead><TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedProducts.map((product, index) => (
                  <TableRow key={index} className={product.status === "error" ? "bg-destructive/10" : ""}>
                    <TableCell>
                      {product.status === "valid" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {product.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      {product.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                    <TableCell>₹{product.mrp}</TableCell>
                    <TableCell>₹{product.sale_price}</TableCell>
                    <TableCell>{product.case_qty}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="text-xs text-destructive">{product.errors.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={processBulkUpload} disabled={isUploading || validCount === 0}>
              {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {uploadMode === "update" ? "Update" : "Import"} {validCount} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bulk Edit Wholesale Products</DialogTitle>
            <DialogDescription>Select products and apply changes in bulk</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedProducts.length === products.length && products.length > 0} onCheckedChange={toggleSelectAll} />
              <span className="text-sm">{selectedProducts.length} of {products.length} selected</span>
            </div>
          </div>
          <ScrollArea className="h-[250px] border rounded-lg mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead>
                  <TableHead>Stock</TableHead><TableHead>Sale Price</TableHead><TableHead>Case Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id} className={selectedProducts.includes(product.id) ? "bg-primary/5" : ""} onClick={() => toggleProductSelection(product.id)} style={{ cursor: "pointer" }}>
                    <TableCell><Checkbox checked={selectedProducts.includes(product.id)} onCheckedChange={() => toggleProductSelection(product.id)} /></TableCell>
                    <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>₹{product.sale_price}</TableCell>
                    <TableCell>{product.case_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field to Edit</Label>
              <Select value={bulkEditField} onValueChange={setBulkEditField}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Set Stock</SelectItem>
                  <SelectItem value="stock_increase">Increase/Decrease Stock</SelectItem>
                  <SelectItem value="mrp">Set MRP</SelectItem>
                  <SelectItem value="sale_price">Set Sale Price</SelectItem>
                  <SelectItem value="purchase_price">Set Purchase Price</SelectItem>
                  <SelectItem value="case_qty">Set Case Qty</SelectItem>
                  <SelectItem value="price_percent">Adjust All Prices by %</SelectItem>
                  <SelectItem value="is_visible">Set Visibility</SelectItem>
                  <SelectItem value="category_id">Set Category</SelectItem>
                  <SelectItem value="brand_id">Set Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>New Value</Label>
              {bulkEditField === "is_visible" ? (
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                  <SelectContent><SelectItem value="true">Visible</SelectItem><SelectItem value="false">Hidden</SelectItem></SelectContent>
                </Select>
              ) : bulkEditField === "category_id" ? (
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : bulkEditField === "brand_id" ? (
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input type="number" placeholder={bulkEditField === "stock_increase" ? "e.g., 10 or -5" : bulkEditField === "price_percent" ? "e.g., 10 for +10%" : "Enter value"} value={bulkEditValue} onChange={e => setBulkEditValue(e.target.value)} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={applyBulkEdit} disabled={isBulkSaving || selectedProducts.length === 0 || !bulkEditField}>
              {isBulkSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apply to {selectedProducts.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
