import { useState, useEffect, useMemo } from "react";
import { Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownSettings {
  countdownEnabled: boolean;
  countdownTitle: string;
  countdownTargetDate: string;
}

export default function OfferTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [settings, setSettings] = useState<CountdownSettings>({
    countdownEnabled: true,
    countdownTitle: "🎆 DIWALI SALE - Special Prices Ending Soon!",
    countdownTargetDate: new Date(new Date().getFullYear(), 10, 1).toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(true);

  const countdownSettings = useMemo(() => ({
    enabled: settings.countdownEnabled,
    targetDate: settings.countdownTargetDate,
  }), [settings.countdownEnabled, settings.countdownTargetDate]);

  // Fetch countdown settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["countdownEnabled", "countdownTitle", "countdownTargetDate"]);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedSettings: Partial<CountdownSettings> = {};
          data.forEach((item) => {
            if (item.key in settings) {
              // Type-safe assignment based on the key
              const key = item.key as keyof CountdownSettings;
              const defaultValue = settings[key];
              if (typeof defaultValue === "boolean") {
                loadedSettings[key] = (item.value === "true" || item.value === true) as CountdownSettings[typeof key];
              } else {
                loadedSettings[key] = item.value as CountdownSettings[typeof key];
              }
            }
          });
          setSettings((prev) => ({ ...prev, ...loadedSettings }));
        }
      } catch (error) {
        console.error("Error fetching countdown settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!countdownSettings.enabled) return;

    const targetDate = new Date(countdownSettings.targetDate);
    targetDate.setHours(23, 59, 59, 999); // End of the target day

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSettings]);

  // Don't render if disabled or loading
  if (isLoading || !settings.countdownEnabled) {
    return null;
  }

  return (
    <section className="py-8 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="h-6 w-6 animate-sparkle" />
            <span className="text-lg font-bold">{settings.countdownTitle}</span>
            <Sparkles className="h-6 w-6 animate-sparkle" />
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-white" />
            <div className="flex gap-2">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Mins" },
                { value: timeLeft.seconds, label: "Secs" },
              ].map((item, index) => (
                <div key={index} className="bg-foreground/20 backdrop-blur-sm rounded-lg p-2 min-w-[60px] text-center">
                  <div className="text-xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
                  <div className="text-xs text-white/70">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
