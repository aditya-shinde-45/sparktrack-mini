import React from "react";

const CARD_COLORS = {
  blue: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    icon: "text-blue-500",
    hover: "hover:bg-blue-200",
    shadow: "shadow-blue-200",
  },
  green: {
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-800",
    icon: "text-green-500",
    hover: "hover:bg-green-200",
    shadow: "shadow-green-200",
  },
  yellow: {
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    text: "text-yellow-800",
    icon: "text-yellow-500",
    hover: "hover:bg-yellow-200",
    shadow: "shadow-yellow-200",
  },
  red: {
    bg: "bg-red-100",
    border: "border-red-300",
    text: "text-red-800",
    icon: "text-red-500",
    hover: "hover:bg-red-200",
    shadow: "shadow-red-200",
  },
};

export const DashboardCards = ({ onCardClick }) => {
  const cards = [
    {
      color: "blue",
      title: "Announcements",
      subtitle: "Check for updates",
      icon: "campaign",
    },
    {
      color: "green",
      title: "Upload Document",
      subtitle: "Submit your work",
      icon: "upload_file",
    },
    {
      color: "yellow",
      title: "Deadlines",
      subtitle: "View upcoming dates",
      icon: "event_available",
    },
    {
      color: "red",
      title: "Team Chat",
      subtitle: "Communicate with group",
      icon: "chat",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
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
  const styles = CARD_COLORS[color] || CARD_COLORS.blue;
  return (
    <div
      onClick={() => onClick(title)}
      className={`group ${styles.bg} ${styles.border} border p-6 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${styles.shadow} ${styles.hover} hover:scale-[1.03]`}
      style={{ minHeight: "120px" }}
    >
      <div>
        <h3 className={`font-bold text-lg ${styles.text}`}>{title}</h3>
        <p className={`text-sm mt-1 ${styles.text} opacity-80`}>{subtitle}</p>
      </div>
      <span className={`material-icons ${styles.icon} text-4xl group-hover:scale-110 transition-transform`}>
        {icon}
      </span>
    </div>
  );
};