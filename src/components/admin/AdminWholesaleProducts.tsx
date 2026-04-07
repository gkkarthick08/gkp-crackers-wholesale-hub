import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import BulkWholesaleOperations from "./BulkWholesaleOperations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WholesaleProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  mrp: number;
  purchase_price: number;
  sale_price: number;
  case_qty: number;
  case_price: number;
  stock: number;
  is_visible: boolean;
  display_order: number;
  category_id: string | null;
  brand_id: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

export default function AdminWholesaleProducts() {
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WholesaleProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    product_code: "",
    name: "",
    description: "",
    mrp: "",
    purchase_price: "",
    sale_price: "",
    case_qty: "1",
    case_price: "0",
    stock: "0",
    display_order: "0",
    category_id: "",
    brand_id: "",
    is_visible: true,
    image_url: "",
    video_url: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase
          .from("wholesale_products")
          .select(`*, category:categories(name), brand:brands(name)`)
          .order("display_order"),
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("brands").select("id, name").order("name"),
      ]);
      if (productsRes.data) setProducts(productsRes.data as WholesaleProduct[]);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateFormField = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    if (field === "sale_price" || field === "case_qty") {
      const salePrice = parseFloat(field === "sale_price" ? value : updated.sale_price) || 0;
      const caseQty = parseInt(field === "case_qty" ? value : updated.case_qty) || 1;
      updated.case_price = String(salePrice * caseQty);
    }
    setFormData(updated);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({
      product_code: `WS${String(products.length + 1).padStart(3, "0")}`,
      name: "", description: "", mrp: "", purchase_price: "", sale_price: "",
      case_qty: "1", case_price: "0", stock: "0", display_order: "0",
      category_id: "", brand_id: "", is_visible: true, image_url: "", video_url: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: WholesaleProduct) => {
    setEditingProduct(product);
    setFormData({
      product_code: product.product_code,
      name: product.name,
      description: product.description || "",
      mrp: String(product.mrp),
      purchase_price: String(product.purchase_price),
      sale_price: String(product.sale_price),
      case_qty: String(product.case_qty),
      case_price: String(product.case_price),
      stock: String(product.stock),
      display_order: String(product.display_order),
      category_id: product.category_id || "",
      brand_id: product.brand_id || "",
      is_visible: product.is_visible,
      image_url: product.image_url || "",
      video_url: product.video_url || "",
    });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `wholesale-${productId}-${Date.now()}.${fileExt}`;
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile, { upsert: true });
      clearInterval(progressInterval);
      if (uploadError) throw uploadError;
      setUploadProgress(100);
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({ title: "Error uploading image", description: errorMessage, variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (formData.image_url && !imageFile) {
      try {
        const fileName = formData.image_url.split("/").pop();
        if (fileName) await supabase.storage.from("product-images").remove([fileName]);
      } catch (error) { console.error("Error removing image:", error); }
    }
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!formData.name || !formData.mrp || !formData.sale_price) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      let imageUrl = formData.image_url;
      const productData = {
        product_code: formData.product_code,
        name: formData.name,
        description: formData.description || null,
        mrp: parseFloat(formData.mrp),
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price),
        case_qty: parseInt(formData.case_qty) || 1,
        case_price: parseFloat(formData.case_price) || 0,
        stock: parseInt(formData.stock) || 0,
        display_order: parseInt(formData.display_order) || 0,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        is_visible: formData.is_visible,
        video_url: formData.video_url || null,
      };

      if (!editingProduct) {
        const { data: newProduct, error } = await supabase
          .from("wholesale_products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        if (imageFile && newProduct) {
          imageUrl = await uploadImage(newProduct.id);
          if (imageUrl) {
            await supabase.from("wholesale_products").update({ image_url: imageUrl }).eq("id", newProduct.id);
          }
        }
        toast({ title: "Wholesale product added successfully" });
      } else {
        if (imageFile) imageUrl = await uploadImage(editingProduct.id);
        const { error } = await supabase
          .from("wholesale_products")
          .update({ ...productData, image_url: imageUrl || null })
          .eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Wholesale product updated successfully" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({ title: "Error saving product", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (product: WholesaleProduct) => {
    try {
      const { error } = await supabase
        .from("wholesale_products")
        .update({ is_visible: !product.is_visible })
        .eq("id", product.id);
      if (error) throw error;
      fetchData();
    } catch { toast({ title: "Error updating visibility", variant: "destructive" }); }
  };

  const deleteProduct = async (product: WholesaleProduct) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      const { error } = await supabase.from("wholesale_products").delete().eq("id", product.id);
      if (error) throw error;
      toast({ title: "Product deleted" });
      fetchData();
    } catch { toast({ title: "Error deleting product", variant: "destructive" }); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wholesale Products</h1>
          <p className="text-muted-foreground">Manage wholesale-only product inventory (visible to verified dealers)</p>
        </div>
        <Button variant="hero" onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Wholesale Product
        </Button>
      </div>

      {/* Bulk Operations */}
      <BulkWholesaleOperations products={products} categories={categories} brands={brands} onRefresh={fetchData} />

      {/* Search */}
      <Card className="shadow-card mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search wholesale products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Wholesale Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Purchase</TableHead>
                  <TableHead className="text-right">Sale</TableHead>
                  <TableHead className="text-right">Case Qty</TableHead>
                  <TableHead className="text-right">Case Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No wholesale products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-center text-muted-foreground">{product.display_order}</TableCell>
                      <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>{product.brand?.name || "-"}</TableCell>
                      <TableCell className="text-right">₹{product.mrp}</TableCell>
                      <TableCell className="text-right text-muted-foreground">₹{product.purchase_price}</TableCell>
                      <TableCell className="text-right text-primary">₹{product.sale_price}</TableCell>
                      <TableCell className="text-right">{product.case_qty}</TableCell>
                      <TableCell className="text-right font-bold text-primary">₹{product.case_price}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_visible ? "default" : "secondary"}>
                          {product.is_visible ? "Visible" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleVisibility(product)}>
                            {product.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct(product)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Wholesale Product" : "Add Wholesale Product"}</DialogTitle>
            <DialogDescription>Fill in the wholesale product details below</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code *</Label>
                <Input value={formData.product_code} onChange={(e) => updateFormField("product_code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={formData.display_order} onChange={(e) => updateFormField("display_order", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={formData.name} onChange={(e) => updateFormField("name", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => updateFormField("description", e.target.value)} rows={3} />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Image
                  </Button>
                  {isUploading && <Progress value={uploadProgress} className="h-2" />}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Or paste image URL</Label>
                    <Input placeholder="https://..." value={formData.image_url} onChange={(e) => {
                      updateFormField("image_url", e.target.value);
                      if (e.target.value) setImagePreview(e.target.value);
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> Video URL</Label>
              <Input placeholder="YouTube or YouTube Shorts URL" value={formData.video_url} onChange={(e) => updateFormField("video_url", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => updateFormField("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={formData.brand_id} onValueChange={(v) => updateFormField("brand_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>MRP *</Label>
                <Input type="number" value={formData.mrp} onChange={(e) => updateFormField("mrp", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input type="number" value={formData.purchase_price} onChange={(e) => updateFormField("purchase_price", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sale Price *</Label>
                <Input type="number" value={formData.sale_price} onChange={(e) => updateFormField("sale_price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Case Qty</Label>
                <Input type="number" min="1" value={formData.case_qty} onChange={(e) => updateFormField("case_qty", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Case Price (auto)</Label>
                <Input type="number" value={formData.case_price} onChange={(e) => updateFormField("case_price", e.target.value)} className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">Sale Price × Case Qty</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={formData.stock} onChange={(e) => updateFormField("stock", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_visible} onCheckedChange={(v) => setFormData({ ...formData, is_visible: v })} />
                <Label>Visible to Dealers</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
