import { useEffect, useState } from "react";
import { Loader2, Mail, MailOpen, Trash2, MessageCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSiteSettings, formatWhatsAppUrl } from "@/hooks/useSiteSettings";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const { toast } = useToast();
  const { settings } = useSiteSettings();

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      toast({ title: "Failed to load messages", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
      toast({ title: "Message deleted" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const replyByEmail = (msg: ContactMessage) => {
    const subject = encodeURIComponent(`Re: Your enquiry on ${settings.storeName}`);
    const body = encodeURIComponent(`Hi ${msg.name},\n\nThanks for reaching out. Regarding your message:\n\n"${msg.message}"\n\n— ${settings.storeName} Team`);
    window.location.href = `mailto:${msg.email}?subject=${subject}&body=${body}`;
    if (!msg.is_read) markAsRead(msg.id);
  };

  const replyByWhatsApp = (msg: ContactMessage) => {
    const text = `Hi ${msg.name}, thanks for contacting ${settings.storeName}. Regarding your enquiry: "${msg.message.slice(0, 120)}${msg.message.length > 120 ? "…" : ""}"`;
    const url = formatWhatsAppUrl(msg.phone, text);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      if (!msg.is_read) markAsRead(msg.id);
    } else {
      toast({ title: "Invalid phone number", variant: "destructive" });
    }
  };

  const filtered = messages.filter(m => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s)
      || m.email.toLowerCase().includes(s)
      || m.phone.toLowerCase().includes(s)
      || m.message.toLowerCase().includes(s);
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">Contact Messages</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} unread message(s)` : "All messages read"}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            {search ? "No messages match your search." : "No contact messages yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => (
            <Card
              key={msg.id}
              className={`shadow-card transition-colors ${!msg.is_read ? "border-primary/40 bg-primary/5" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {msg.is_read ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-base">{msg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground break-all">{msg.email} • {msg.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!msg.is_read && <Badge className="bg-primary text-primary-foreground">New</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "dd MMM yyyy, hh:mm a")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => replyByEmail(msg)} className="gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Reply by Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => replyByWhatsApp(msg)} className="gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Reply on WhatsApp
                  </Button>
                  {!msg.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(msg.id)}>
                      Mark as read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(msg)}
                    className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              The message from <span className="font-semibold">{deleteTarget?.name}</span> will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
