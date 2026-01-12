import { useState, useEffect } from "react";
import { Clock, Sparkles } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function OfferTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set target date to next Diwali (approximate)
    const targetDate = new Date();
    targetDate.setMonth(10); // November
    targetDate.setDate(1);
    if (targetDate < new Date()) {
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    }

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
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-8 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="h-6 w-6 animate-sparkle" />
            <span className="text-lg font-bold">🎆 DIWALI SALE - Special Prices Ending Soon!</span>
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
