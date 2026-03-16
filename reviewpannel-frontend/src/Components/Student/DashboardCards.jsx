import React from "react";
import { BellRing, ChevronRight, FileUp, MessageCircleMore, Sparkles } from "lucide-react";

const CARD_THEMES = {
  indigo: {
    bg: "bg-indigo-50 hover:bg-indigo-100",
    border: "border-indigo-200 hover:border-indigo-400",
    icon: "text-indigo-600",
    title: "text-indigo-800",
    badge: "bg-indigo-100 text-indigo-700",
  },
  purple: {
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-200 hover:border-purple-400",
    icon: "text-purple-600",
    title: "text-purple-800",
    badge: "bg-purple-100 text-purple-700",
  },
  emerald: {
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-200 hover:border-emerald-400",
    icon: "text-emerald-600",
    title: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
  },
  orange: {
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-200 hover:border-orange-400",
    icon: "text-orange-600",
    title: "text-orange-800",
    badge: "bg-orange-100 text-orange-700",
  },
};

export const DashboardCards = ({ onCardClick }) => {
  const cards = [
    {
      color: "indigo",
      title: "Announcements",
      subtitle: "Important updates & notices",
      icon: BellRing,
    },
    {
      color: "purple",
      title: "Events & Posts",
      subtitle: "College events & updates",
      icon: Sparkles,
    },
    {
      color: "emerald",
      title: "Upload Document",
      subtitle: "Submit project files",
      icon: FileUp,
    },
    {
      color: "orange",
      title: "Team Chat",
      subtitle: "Communicate with team",
      icon: MessageCircleMore,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {cards.map((card) => (
        <Card
          key={card.title}
          color={card.color}
          title={card.title}
          subtitle={card.subtitle}
          icon={card.icon}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
};

const Card = ({ color, title, subtitle, icon, onClick }) => {
  const styles = CARD_THEMES[color] || CARD_THEMES.indigo;
  const Icon = icon;

  return (
    <button
      onClick={() => onClick(title)}
      className={`group text-left flex items-start sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-5 ${styles.bg} rounded-xl border ${styles.border} transition-all shadow-sm hover:shadow-md`}
    >
      <div className={`p-2.5 bg-white rounded-xl shadow-sm flex-shrink-0`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${styles.icon}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-sm sm:text-base leading-tight ${styles.title}`}>{title}</h3>
          <span className={`hidden sm:inline-flex text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>Quick</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 leading-tight">{subtitle}</p>
      </div>

      <ChevronRight className={`w-4 h-4 ${styles.icon} ml-auto flex-shrink-0`} />
    </button>
  );
};