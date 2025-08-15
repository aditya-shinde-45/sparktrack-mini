import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../Components/Common/Footer";
import Navbar from "../../Components/Common/Navbar";
import "../../Style/Home.css";
import homebanner from '../../assets/homebanner.png';
import campusImg from '../../assets/home/campus.png';
import Drmangeshkarad from '../../assets/home/Drmangeshkarad.png';
import vipuldalal from '../../assets/home/vipuldalal.png';
import RamchandraPujeri from '../../assets/home/RamchandraPujeri.png';
import RajneeshkaurSachdeo from '../../assets/home/RajneeshkaurSachdeo.png';
import GaneshPathak from '../../assets/home/GaneshPathak.png';
import DrShraddhaPhansalkar from '../../assets/home/DrShraddhaPhansalkar.png';
import Prashant_Dhotre from '../../assets/home/Prashant_Dhotre.png';
import RekhaSugandhi from '../../assets/home/RekhaSugandhi.png';
import jayshreePrasad from '../../assets/home/jayshreePrasad.png';
import DrShafiPathan from '../../assets/home/DrShafiPathan.png';
import sureshkapare from '../../assets/home/sureshkapare.png';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const Home = () => {
  const swiperRef = useRef(null);

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 font-[Poppins]">
        {/* Hero Section */}
        <header className="hero-section bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-br-[80px] py-20 lg:py-24 px-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 text-center lg:text-left">
              <p className="text-lg font-semibold uppercase tracking-wider mb-2">MIT ADT UNIVERSITY</p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">PBL Management</h1>
            </div>
            <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center">
              <img className="w-64 h-auto" src={homebanner} alt="PBL Management" />
            </div>
          </div>
        </header>

        {/* Achievements */}
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
              {[
                {
                  icon: "folder",
                  title: "1200+ Projects",
                  description:
                    "Project-Based Learning (PBL) is integrated across all departments with 1200+ real-world projects.",
                },
                {
                  icon: "groups",
                  title: "215+ Industry Mentors",
                  description:
                    "Experts from top companies like TCS, Infosys, and IBM mentor our students through PBL and internships.",
                },
                {
                  icon: "emoji_events",
                  title: "10+ SIH Winners",
                  description:
                    "Multiple teams from MIT ADT have won the prestigious Smart India Hackathon over the last few years.",
                },
              ].map((item, index) => (
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

        {/* Dignity Section */}
        <section className="text-center mb-24 px-6 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Dignity</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            MIT Art, Design and Technology University is a hub of innovation and leadership, known for its excellence in education, industry collaboration, and value-based learning. With NAAC A grade accreditation, the university empowers students through world-class infrastructure, distinguished faculty, and cutting-edge programs that shape the leaders of tomorrow.
          </p>

          {/* Top content row */}
          <div className="flex flex-col lg:flex-row items-center bg-white p-8 rounded-lg shadow-lg">
            <div className="lg:w-1/3 mb-8 lg:mb-0 lg:mr-8">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  alt="University campus"
                  className="w-full h-full object-cover"
                  src={campusImg}
                />
              </div>
            </div>
            <div className="lg:w-2/3 text-left">
              <p className="text-gray-600 leading-relaxed">
                MIT Art, Design &amp; Technology University, Pune is a place for aspiring leaders to be. With
                its sprawling campus, state-of-the-art infrastructure, and a focus on holistic education, it
                provides an environment conducive to learning and growth.
                <br /><br />
                Through its innovative curriculum, industry collaborations, and emphasis on research and
                development, MIT-ADT ensures that its graduates are not just job-seekers, but also job-creators.
              </p>
            </div>
          </div>

          {/* Swiper Carousel */}
          <div className="mt-12">
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={4}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              navigation={false}
              breakpoints={{
                320: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
              }}
            >
              {[
                { alt: "Dr. Mangesh Karad", src: Drmangeshkarad },
                { alt: "vipul dalal", src: vipuldalal },
                { alt: "Ramchandra Pujeri", src: RamchandraPujeri },
                { alt: "Rajneesh Kaur Sachdeo", src: RajneeshkaurSachdeo },
                { alt: "Ganesh Pathak", src: GaneshPathak },
                { alt: "Dr. Shraddha Phansalkar", src: DrShraddhaPhansalkar },
                { alt: "Prashant Dhotre", src: Prashant_Dhotre },
                { alt: "Rekha Sugandhi", src: RekhaSugandhi },
                { alt: "jayshree Prashad", src: jayshreePrasad },
                { alt: "Dr. Shafi Pathan", src: DrShafiPathan },
                { alt: "Suresh Kapare", src: sureshkapare },
              ].map((img, idx) => (
                <SwiperSlide key={idx}>
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center space-x-2 mr-auto">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition"
                >
                  <span className="material-icons text-gray-600">arrow_back</span>
                </button>
                <button
                  onClick={() => swiperRef.current?.slideNext()}
                  className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition"
                >
                  <span className="material-icons">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="text-center px-6 mb-24 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-12">Gallery</h2>
          <div className="flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="lg:w-1/2">
              <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                <img
                  className="w-full h-full object-cover"
                  alt="Main Gallery"
                  src="https://lh6.googleusercontent.com/nl1gsr22huxffug9YYXCRFSZtQvGRhlBgpdpI60ja95qCHpkQ8Q67HB5kUnqTWE4f2q68-s68FGYV1aZS4slYInGbWB74ts8YV7gifgSle-ro9CxtYN7sLnI5KASK1odFBm3QDbO3gM=w16383"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Home;
