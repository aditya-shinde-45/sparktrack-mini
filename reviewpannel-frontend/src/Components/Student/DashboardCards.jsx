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
  purple: {
    bg: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-800",
    icon: "text-purple-500",
    hover: "hover:bg-purple-200",
    shadow: "shadow-purple-200",
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
  orange: {
    bg: "bg-orange-100",
    border: "border-orange-300",
    text: "text-orange-800",
    icon: "text-orange-500",
    hover: "hover:bg-orange-200",
    shadow: "shadow-orange-200",
  },
};

export const DashboardCards = ({ onCardClick }) => {
  const cards = [
    {
      color: "blue",
      title: "Announcements",
      subtitle: "Important updates & notices",
      icon: "campaign",
    },
    {
      color: "purple",
      title: "Events & Posts",
      subtitle: "College events & updates",
      icon: "event",
    },
    {
      color: "green",
      title: "Upload Document",
      subtitle: "Submit project files",
      icon: "upload_file",
    },
    {
      color: "orange",
      title: "Team Chat",
      subtitle: "Communicate with team",
      icon: "chat",
    },
    {
      color: "yellow",
      title: "Internship Details",
      subtitle: "Submit internship information",
      icon: "work",
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
      className={`group ${styles.bg} ${styles.border} border p-6 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 ${styles.shadow} ${styles.hover} hover:scale-[1.05] hover:shadow-lg`}
      style={{ minHeight: "120px" }}
    >
      <div className="flex-1">
        <h3 className={`font-bold text-lg ${styles.text} mb-1`}>{title}</h3>
        <p className={`text-sm ${styles.text} opacity-75 leading-tight`}>
          {subtitle}
        </p>
      </div>
      <div className="ml-4">
        <span
          className={`material-icons ${styles.icon} text-4xl group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
};