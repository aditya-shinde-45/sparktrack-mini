import React from 'react';

const UpcomingEvents = () => {
  const events = [
    {
      icon: "group_add",
      title: "Group Creation",
      date: "Jan 8, 2025",
      color: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Upcoming Events
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mb-6"></div>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Stay updated with our latest events, workshops, and activities designed to enhance your learning experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {events.map((event, index) => (
          <div 
            key={index}
            className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
          >
            <div className={`bg-gradient-to-br ${event.color} p-4 rounded-2xl mb-4 w-fit group-hover:scale-110 transition-transform duration-300`}>
              <span className="material-icons text-white text-3xl">{event.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-300">
              {event.title}
            </h3>
            <p className="text-gray-500 font-medium">{event.date}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingEvents;