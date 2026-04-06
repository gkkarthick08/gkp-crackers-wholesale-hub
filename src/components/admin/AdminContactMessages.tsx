import { useEffect, useState } from "react";
import { Loader2, Mail, MailOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread message(s)` : "All messages read"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No contact messages yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`shadow-card cursor-pointer transition-colors ${!msg.is_read ? "border-primary/40 bg-primary/5" : ""}`}
              onClick={() => !msg.is_read && markAsRead(msg.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {msg.is_read ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-base">{msg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{msg.email} • {msg.phone}</p>
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
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
