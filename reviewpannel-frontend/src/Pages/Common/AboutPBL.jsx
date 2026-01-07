import React from 'react';
import Footer from "../../Components/Common/Footer";
import Navbar from "../../Components/Common/Navbar";


import aboutPblImage from '../../assets/aboutpbl.png'; // Update path as needed

const AboutPBL = () => {
  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen font-roboto">
         <header className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-center">
About PBL          </h1>
        </div>
      </header>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main About PBL Section */}
            <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-md">
              <p className="text-gray-600 leading-relaxed">
                Project-Based Learning (PBL) at MIT Art, Design and Technology University is a dynamic, student-centered pedagogical approach designed to bridge the gap between theoretical knowledge and real-world application. At MIT ADT, PBL encourages students to solve complex, interdisciplinary problems through collaborative projects, fostering creativity, innovation, and critical thinking.
                <br /><br />
                Through structured guidance from faculty mentors, students work in teams to identify challenges, propose solutions, build prototypes, and present outcomes — simulating real industry scenarios. Whether it's in engineering, design, or management, PBL at MIT ADT cultivates leadership, communication skills, and hands-on experience essential for future careers.
                <br /><br />
                This model aligns with MIT ADT's vision of "Learning by Doing," promoting holistic education that goes beyond textbooks and empowers students to become innovative professionals and ethical problem-solvers.
              </p>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-6">UPCOMING EVENTS</h2>
              <div className="space-y-4">
                {[
                  { icon: 'group_add', title: 'Group Creation', date: 'Jan 8, 2025', color: 'purple' },
                ].map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`bg-${event.color}-100 text-${event.color}-600 p-3 rounded-full`}>
                      <span className="material-icons">{event.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PBL Diagram */}
          <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Project Based Learning</h2>
            <div className="flex items-center justify-center">
              <img src={aboutPblImage} alt="Project Based Learning Diagram" className="max-w-full h-auto" />
            </div>
          </div>

          {/* PBL Features */}
          <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">PBL Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: 'public',
                  title: 'Real-Time Problems',
                  desc: 'Projects are designed to address real-world problems or scenarios, making the learning experience more meaningful and applicable.',
                  color: 'blue',
                },
                {
                  icon: 'self_improvement',
                  title: 'Student Autonomy',
                  desc: 'PBL promotes student independence, allowing them to make decisions, set goals, and manage their own learning process.',
                  color: 'purple',
                },
                {
                  icon: 'search',
                  title: 'Inquiry and Investigation',
                  desc: 'Students explore and investigate topics through questioning, research, and problem-solving, fostering a sense of curiosity and critical thinking.',
                  color: 'teal',
                },
                {
                  icon: 'groups',
                  title: 'Collaboration',
                  desc: 'PBL encourages collaboration among students. Working in teams helps develop interpersonal skills, communication, and the ability to work effectively in group settings.',
                  color: 'orange',
                },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className={`bg-${feature.color}-100 text-${feature.color}-600 p-3 rounded-full mt-1`}>
                    <span className="material-icons">{feature.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 mt-2">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Mentor Involvement */}
          <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Industry Mentor Involvement</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Industry mentors play a crucial role in academic projects, providing students with valuable insights, practical knowledge, and real-world perspectives.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Practical Application of Knowledge',
                    'Relevance to Industry Needs',
                    'Professional Networking',
                    'Feedback and Guidance',
                    'Real-world Problem Solving',
                    'Exposure to Industry Practices',
                    'Career Guidance',
                    'Motivation and Inspiration',
                    'Soft Skills Development',
                    'Experiential Learning',
                  ].map((point, idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="material-icons text-green-500 mr-2">check_circle</span>
                      <span className="text-gray-700">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">PBL Initiative Highlights</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-5xl font-bold text-indigo-600">215</p>
                    <p className="text-gray-600 mt-2">Onboarded Industry Mentors</p>
                  </div>
                  <div>
                    <p className="text-5xl font-bold text-indigo-600">₹6,20,140</p>
                    <p className="text-gray-600 mt-2">Total Remuneration Offered</p>
                  </div>
                </div>
               
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPBL;

