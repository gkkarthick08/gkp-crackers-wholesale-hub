import { useEffect, useState } from "react";
import { X, Megaphone, Gift, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  popup_type: string | null;
  show_on_load: boolean | null;
}

const iconMap: Record<string, React.ReactNode> = {
  offer: <Gift className="h-6 w-6" />,
  warning: <AlertCircle className="h-6 w-6" />,
  info: <Info className="h-6 w-6" />,
  announcement: <Megaphone className="h-6 w-6" />,
};

const colorMap: Record<string, string> = {
  offer: "from-amber-500 to-orange-600",
  warning: "from-red-500 to-rose-600",
  info: "from-blue-500 to-indigo-600",
  announcement: "from-primary to-secondary",
};

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, image_url, popup_type, show_on_load")
        .eq("is_active", true)
        .eq("show_on_load", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching announcements:", error);
        return;
      }

      if (data && data.length > 0) {
        // Check session storage for dismissed announcements
        const dismissedIds = sessionStorage.getItem("dismissed_announcements");
        const dismissedSet = dismissedIds ? new Set(JSON.parse(dismissedIds)) : new Set();
        
        const activeAnnouncements = data.filter((a) => !dismissedSet.has(a.id));
        
        if (activeAnnouncements.length > 0) {
          setAnnouncements(activeAnnouncements);
          setDismissed(dismissedSet as Set<string>);
          setIsOpen(true);
        }
      }
    };

    // Delay popup to not interrupt initial page load
    const timer = setTimeout(fetchAnnouncements, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    const currentAnnouncement = announcements[currentIndex];
    const newDismissed = new Set(dismissed).add(currentAnnouncement.id);
    setDismissed(newDismissed);
    sessionStorage.setItem("dismissed_announcements", JSON.stringify([...newDismissed]));

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const popupType = current.popup_type || "announcement";
  const gradientClass = colorMap[popupType] || colorMap.announcement;
  const icon = iconMap[popupType] || iconMap.announcement;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white`}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                {icon}
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                {current.title}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          {current.image_url && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={current.image_url}
                alt={current.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {current.content && (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {current.content}
            </p>
          )}

          <div className="flex items-center justify-between mt-6">
            {announcements.length > 1 && (
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {announcements.length}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleDismiss}>
                <X className="h-4 w-4 mr-2" />
                {currentIndex < announcements.length - 1 ? "Next" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}