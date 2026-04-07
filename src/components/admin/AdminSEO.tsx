import { useEffect, useState } from "react";
import { Loader2, Save, Globe, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

interface PageSEO {
  title: string;
  description: string;
  keywords: string;
}

interface SEOSettings {
  [page: string]: PageSEO;
}

type PublicSettingRow = Database["public"]["Tables"]["public_settings"]["Row"];

const defaultPages: Record<string, PageSEO> = {
  home: { title: "GKP Crackers — Premium Crackers at Best Prices", description: "Buy premium quality crackers at the best prices from GKP Crackers.", keywords: "crackers, diwali, fireworks" },
  products: { title: "Products — GKP Crackers", description: "Browse our full catalog of premium crackers.", keywords: "crackers catalog, buy crackers" },
  about: { title: "About Us — GKP Crackers", description: "Learn about GKP Crackers and our commitment to quality.", keywords: "about, gkp crackers" },
  contact: { title: "Contact — GKP Crackers", description: "Get in touch with GKP Crackers.", keywords: "contact, support" },
  wholesale: { title: "Wholesale Catalog — GKP Crackers", description: "Bulk pricing for dealers.", keywords: "wholesale, bulk, dealer" },
  quickOrder: { title: "Quick Order — GKP Crackers", description: "Quickly place your crackers order.", keywords: "quick order, fast order" },
};

export default function AdminSEO() {
  const [seo, setSeo] = useState<SEOSettings>(defaultPages);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("public_settings")
          .select("key, value")
          .eq("key", "seo_settings")
          .maybeSingle();
        if (data?.value && typeof data.value === "object") {
          setSeo((prev) => ({ ...prev, ...(data.value as SEOSettings) }));
        }
      } catch (err) {
        console.error("Error fetching SEO settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from<PublicSettingRow>("public_settings")
        .upsert(
          { key: "seo_settings", value: seo as Json, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
      toast({ title: "SEO settings saved" });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePage = (page: string, field: keyof PageSEO, value: string) => {
    setSeo((prev) => ({
      ...prev,
      [page]: { ...prev[page], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageLabels: Record<string, string> = {
    home: "🏠 Home Page",
    products: "📦 Products Page",
    about: "ℹ️ About Page",
    contact: "📞 Contact Page",
    wholesale: "🏪 Wholesale Catalog",
    quickOrder: "⚡ Quick Order",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Search className="h-7 w-7" /> SEO Management
          </h1>
          <p className="text-muted-foreground">Manage meta titles, descriptions and keywords for each page</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(seo).map(([page, data]) => (
          <Card key={page} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {pageLabels[page] || page}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title Tag (max 60 chars)</Label>
                <Input value={data.title} onChange={(e) => updatePage(page, "title", e.target.value)}
                  maxLength={60} placeholder="Page title" />
                <p className="text-[10px] text-muted-foreground">{data.title.length}/60</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Description (max 160 chars)</Label>
                <Textarea value={data.description} onChange={(e) => updatePage(page, "description", e.target.value)}
                  maxLength={160} rows={2} placeholder="Page description" />
                <p className="text-[10px] text-muted-foreground">{data.description.length}/160</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Keywords (comma-separated)</Label>
                <Input value={data.keywords} onChange={(e) => updatePage(page, "keywords", e.target.value)}
                  placeholder="keyword1, keyword2, keyword3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
