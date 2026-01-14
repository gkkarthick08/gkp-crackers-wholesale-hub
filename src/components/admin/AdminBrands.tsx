import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    is_active: true,
  });

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .order("name");

      if (brandsError) throw brandsError;

      // Get product counts
      const { data: productCounts } = await supabase
        .from("products")
        .select("brand_id");

      const countMap: Record<string, number> = {};
      productCounts?.forEach((p) => {
        if (p.brand_id) {
          countMap[p.brand_id] = (countMap[p.brand_id] || 0) + 1;
        }
      });

      const brandsWithCounts = (brandsData || []).map((brand) => ({
        ...brand,
        product_count: countMap[brand.id] || 0,
      }));

      setBrands(brandsWithCounts);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openAddDialog = () => {
    setEditingBrand(null);
    setFormData({ name: "", description: "", logo_url: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      is_active: brand.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const brandData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        is_active: formData.is_active,
      };

      if (editingBrand) {
        const { error } = await supabase
          .from("brands")
          .update(brandData)
          .eq("id", editingBrand.id);
        if (error) throw error;
        toast({ title: "Brand updated successfully" });
      } else {
        const { error } = await supabase.from("brands").insert(brandData);
        if (error) throw error;
        toast({ title: "Brand added successfully" });
      }

      setIsDialogOpen(false);
      fetchBrands();
    } catch (error: any) {
      toast({ title: "Error saving brand", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (brand: Brand) => {
    try {
      const { error } = await supabase
        .from("brands")
        .update({ is_active: !brand.is_active })
        .eq("id", brand.id);
      if (error) throw error;
      fetchBrands();
    } catch (error) {
      toast({ title: "Error updating brand", variant: "destructive" });
    }
  };

  const deleteBrand = async (brand: Brand) => {
    if (brand.product_count && brand.product_count > 0) {
      toast({
        title: "Cannot delete brand",
        description: `This brand has ${brand.product_count} products. Remove them first.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete "${brand.name}"?`)) return;

    try {
      const { error } = await supabase.from("brands").delete().eq("id", brand.id);
      if (error) throw error;
      toast({ title: "Brand deleted" });
      fetchBrands();
    } catch (error) {
      toast({ title: "Error deleting brand", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <Button variant="hero" onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Brands ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {brand.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">{brand.product_count}</TableCell>
                    <TableCell>
                      <Badge variant={brand.is_active ? "default" : "secondary"}>
                        {brand.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(brand)}>
                          <Switch checked={brand.is_active} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(brand)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBrand(brand)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Brand Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter brand name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBrand ? "Update" : "Add"} Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
