import React from 'react';

const AchievementsSection = () => {
  const achievements = [
    {
      icon: "folder",
      title: "1200+ Projects",
      description: "Project-Based Learning (PBL) is integrated across all departments with 1200+ real-world projects.",
    },
    {
      icon: "groups",
      title: "215+ Industry Mentors",
      description: "Experts from top companies like TCS, Infosys, and IBM mentor our students through PBL and internships.",
    },
    {
      icon: "emoji_events",
      title: "10+ SIH Winners",
      description: "Multiple teams from MIT ADT have won the prestigious Smart India Hackathon over the last few years.",
    },
  ];

  return (
    <section className="text-center mb-24 px-6 mt-12 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Achievements</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        MIT Art, Design and Technology University has consistently fostered innovation and excellence.
        With NAAC A accreditation and numerous national accolades, it empowers students through
        mentorship, real-world exposure, and industry collaboration.
      </p>

      <div className="relative mt-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 hidden md:block"></div>
        <div className="absolute top-1/2 left-1/4 w-1/2 h-0.5 border-t-2 border-dashed border-purple-400 hidden md:block"></div>

        <div className="flex flex-col md:flex-row justify-around items-center space-y-12 md:space-y-0">
          {achievements.map((item, index) => (
            <div key={index} className="relative bg-white p-6 rounded-lg shadow-md w-64 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-100 p-3 rounded-full">
                <span className="material-icons text-purple-600 text-3xl">{item.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mt-8">{item.title}</h3>
              <p className="text-gray-500 mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;