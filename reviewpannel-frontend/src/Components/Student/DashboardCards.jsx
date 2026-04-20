import React from "react";
import { BellRing, ChevronRight, FileUp, MessageCircleMore, Sparkles } from "lucide-react";

export const DashboardCards = ({ onCardClick }) => {
  const cards = [
    {
      title: "Announcements",
      subtitle: "Important updates & notices",
      action: "Announcements",
      icon: BellRing,
      cardStyle: "bg-indigo-100/70 border-indigo-200 hover:bg-indigo-100",
      titleStyle: "text-indigo-800",
      subtitleStyle: "text-indigo-700/80",
      iconStyle: "text-indigo-600",
    },
    {
      title: "Upload Document",
      subtitle: "Submit your work",
      action: "Upload Document",
      icon: FileUp,
      cardStyle: "bg-emerald-100/70 border-emerald-200 hover:bg-emerald-100",
      titleStyle: "text-emerald-800",
      subtitleStyle: "text-emerald-700/80",
      iconStyle: "text-emerald-600",
    },
    {
      title: "Deadlines",
      subtitle: "View upcoming updates",
      action: "Events & Posts",
      icon: Sparkles,
      cardStyle: "bg-amber-100/70 border-amber-200 hover:bg-amber-100",
      titleStyle: "text-amber-800",
      subtitleStyle: "text-amber-700/80",
      iconStyle: "text-amber-600",
    },
    {
      title: "Team Chat",
      subtitle: "Communicate with group",
      action: "Team Chat",
      icon: MessageCircleMore,
      cardStyle: "bg-rose-100/70 border-rose-200 hover:bg-rose-100",
      titleStyle: "text-rose-800",
      subtitleStyle: "text-rose-700/80",
      iconStyle: "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          title={card.title}
          subtitle={card.subtitle}
          action={card.action}
          icon={card.icon}
          cardStyle={card.cardStyle}
          titleStyle={card.titleStyle}
          subtitleStyle={card.subtitleStyle}
          iconStyle={card.iconStyle}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
};

const Card = ({ title, subtitle, action, icon, cardStyle, titleStyle, subtitleStyle, iconStyle, onClick }) => {
  const Icon = icon;

  return (
    <button
      onClick={() => onClick(action || title)}
      className={`group text-left flex items-center gap-3 sm:gap-4 min-h-[86px] sm:min-h-[92px] px-4 sm:px-5 py-3 rounded-xl border transition-all shadow-sm ${cardStyle}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base leading-tight mb-1 ${titleStyle}`}>{title}</h3>
        <p className={`text-sm leading-tight ${subtitleStyle}`}>{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconStyle}`} />
        <ChevronRight className="w-4 h-4 text-black/25 flex-shrink-0 group-hover:text-black/45" />
      </div>
    </button>
  );
};