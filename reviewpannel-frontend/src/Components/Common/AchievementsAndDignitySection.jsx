import React, { useRef, useState, useEffect } from "react";
import campusImg from "../../assets/home/campus.png";
import managementTeamImg from "../../assets/home/managementteam.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./DignitySection.css";

// Faculty images
import Drmangeshkarad from "../../assets/home/Drmangeshkarad.png";
import vipuldalal from "../../assets/home/vipuldalal.png";
import RamchandraPujeri from "../../assets/home/RamchandraPujeri.png";
import RajneeshkaurSachdeo from "../../assets/home/RajneeshkaurSachdeo.png";
import GaneshPathak from "../../assets/home/GaneshPathak.png";
import DrShraddhaPhansalkar from "../../assets/home/DrShraddhaPhansalkar.png";
import Prashant_Dhotre from "../../assets/home/Prashant_Dhotre.png";
import RekhaSugandhi from "../../assets/home/RekhaSugandhi.png";
import jayshreePrasad from "../../assets/home/jayshreePrasad.png";
import DrShafiPathan from "../../assets/home/DrShafiPathan.png";
import sureshkapare from "../../assets/home/sureshkapare.png";

const AchievementsAndDignitySection = () => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [counters, setCounters] = useState({ projects: 0, mentors: 0, winners: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Animated counter effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const animateCounters = () => {
    const targets = { projects: 1200, mentors: 215, winners: 10 };
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounters({
        projects: Math.floor(targets.projects * progress),
        mentors: Math.floor(targets.mentors * progress),
        winners: Math.floor(targets.winners * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, stepTime);
  };

  const achievements = [
    {
      icon: "folder",
      title: `${counters.projects}+ Projects`,
      description: "Project-Based Learning (PBL) is integrated across all departments with real-world projects.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: "groups",
      title: `${counters.mentors}+ Industry Mentors`,
      description: "Experts from top companies like TCS, Infosys, and IBM mentor our students through PBL and internships.",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: "emoji_events",
      title: `${counters.winners}+ SIH Winners`,
      description: "Multiple teams from MIT ADT have won the prestigious Smart India Hackathon over the last few years.",
      color: "from-orange-500 to-red-600"
    },
  ];

  const facultyImages = [
    { alt: "Dr. Mangesh Karad", src: Drmangeshkarad, info: "Vice Chancellor - MIT ADT University", department: "Administration" },
    { alt: "Dr. Vipul Dalal", src: vipuldalal, info: "Dean of Academics", department: "Academic Affairs" },
    { alt: "Dr. Ramchandra Pujeri", src: RamchandraPujeri, info: "Professor, Engineering", department: "Engineering" },
    { alt: "Dr. Rajneesh Kaur Sachdeo", src: RajneeshkaurSachdeo, info: "Head of Design Department", department: "Design" },
    { alt: "Dr. Ganesh Pathak", src: GaneshPathak, info: "Professor, Architecture", department: "Architecture" },
    { alt: "Dr. Shraddha Phansalkar", src: DrShraddhaPhansalkar, info: "Head of Research", department: "Research" },
    { alt: "Dr. Prashant Dhotre", src: Prashant_Dhotre, info: "Associate Professor", department: "Technology" },
    { alt: "Dr. Rekha Sugandhi", src: RekhaSugandhi, info: "Professor, Management", department: "Management" },
    { alt: "Dr. Jayshree Prasad", src: jayshreePrasad, info: "Head of Fine Arts", department: "Fine Arts" },
    { alt: "Dr. Shafi Pathan", src: DrShafiPathan, info: "Dean of Faculty", department: "Faculty Affairs" },
    { alt: "Prof. Suresh Kapare", src: sureshkapare, info: "Professor, Media Studies", department: "Media" },
  ];

  return (
    <section ref={sectionRef} className="text-center mb-24 px-6 max-w-7xl mx-auto mt-16">
      {/* Achievements Section */}
      <div className="mb-20">
        <div className="mb-8">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Achievements
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            MIT Art, Design and Technology University has consistently fostered innovation and excellence.
            With NAAC A accreditation and numerous national accolades, it empowers students through
            mentorship, real-world exposure, and industry collaboration.
          </p>
        </div>

        <div className="relative mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {achievements.map((item, index) => (
              <div 
                key={index} 
                className={`group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className={`relative z-10 flex flex-col items-center text-center`}>
                  <div className={`bg-gradient-to-br ${item.color} p-4 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="material-icons text-white text-4xl">{item.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Management Team Section */}
      <div className="mb-20">
        <div className="mb-8">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Management Team
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            Our distinguished management team brings together decades of experience in education, industry, and leadership.
          </p>
        </div>
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-500">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Sr. No.</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Specialization</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Program Heads</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Specialization Lead</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Class Leads for SY, TY and LY</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">1</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-Core</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Anuja Jadhav</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Anant Kaulage</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Prof. Manisha Shitole (LY - 1, 2, 3)<br/>
                    Prof. Swati Powar (LY-4,5,6)<br/>
                    Prof. Amreen Khan (TY - 1, 2, 3)<br/>
                    (TY - 4, 5, 6, TY CORE-1)<br/>
                    Prof. Rahul More (SY - 1, 2, 3)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">2</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-Blockchain</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Hari Palani</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Hari Palani</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Babeetha Bhagat (LY-1, TY-1)</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">3</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-AIA</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Sagar Tambe</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Ranjana Kale</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Dr. Nandkishor Karlekar (LY - 1, 2, 3)<br/>
                    Prof. Mandar Mokashi (LY - 4, 5, 6)<br/>
                    Prof. Tejaswini Bhosale (TY - 1, 2, 3)<br/>
                    Prof. Amarn Singh (TY - 4, 5, 6)<br/>
                    Prof. Arti Pimpalkar (TY - 7, 8, 9)<br/>
                    Prof. Abhishek Das (SY - 4, 5, 6)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">4</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-AI Edge Computing</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Harshad Lokhande</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Shubhra Mathur</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Prof. Rupesh H (LY - 1, TY-1,2)<br/>
                    Prof. Shraddha Kashid (SY - 7, 8, 9, 10)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">5</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-Cloud Computing</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Rashmi Nair</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Rameez Shamalik</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Prof. Shahin Rashidah (LY-1,2)<br/>
                    Prof. Dattatray Kale (TY - 1,2,3)<br/>
                    Prof. Hemant Shinde (SY - 11,12,13,14)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">6</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-Big Data and Cloud Engineering</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Reena Pagare</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Mansi Bhonsle</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Prof. Chaitanya Garware (LY-1, TY-1)<br/>
                    Prof. Shrikant Dhage (SY-15,16,17,18)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">7</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">CSE-Cyber Security Forensics</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Smita Gumaste</td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Zakir Shaikh</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    Prof. Rahul Bembade (LY - 1, 2)<br/>
                    Prof. Sushant Shirbhate (TY - 1, 2, 3)<br/>
                    Prof. Swapnil Patil (SY-19,20,21,22)
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">8</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">IT – Core</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Rahul Bhole</td>
                  <td className="border border-gray-300 px-4 py-3" rowSpan={3}>Prof. Ashvini Jadhav</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm leading-relaxed">
                    SY - Prof. Jyoti Nandimath<br/>
                    TY - Prof. Ashvini Jadhav<br/>
                    LY - Prof. Rahul Bhole
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">9</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">IT- Data Analytics</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Palash Sontakke</td>
                  <td className="border border-gray-300 px-4 py-3"></td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">10</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-purple-700">IT- Software & Mobile App</td>
                  <td className="border border-gray-300 px-4 py-3">Prof. Reetika Kerketta</td>
                  <td className="border border-gray-300 px-4 py-3"></td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">11</td>
                  <td className="border border-gray-300 px-4 py-3"></td>
                  <td className="border border-gray-300 px-4 py-3">Dr. Ayesha Butalia</td>
                  <td className="border border-gray-300 px-4 py-3"></td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-blue-600">Paper Publication Activities</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg text-center mt-6">
            They provide strategic direction and ensure that MIT ADT University maintains its position as a premier 
            institution for higher education and research.
          </p>
        </div>
      </div>

      {/* Dignity Section */}
      <div>
        <div className="mb-12">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Our Dignity
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            MIT Art, Design and Technology University is a hub of innovation and leadership, fostering excellence across all disciplines.
          </p>
        </div>

        {/* Faculty Carousel */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">Our Faculty</h3>
          <div className="relative px-16">
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              slidesPerView={4}
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              navigation={false}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              breakpoints={{
                320: { slidesPerView: 1, spaceBetween: 10 },
                640: { slidesPerView: 2, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
              }}
            >
              {facultyImages.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <div className="w-full h-64">
                    <div className="shadow-xl overflow-hidden rounded-2xl border-4 border-white h-full">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h4 className="font-bold text-sm truncate">{img.alt}</h4>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Enhanced Navigation Arrows */}
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute top-1/2 -translate-y-1/2 -left-6 bg-white p-4 rounded-full hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 z-10 group"
            >
              <span className="material-icons text-gray-600 group-hover:text-purple-600 transition-colors">arrow_back</span>
            </button>

            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute top-1/2 -translate-y-1/2 -right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl z-10 group"
            >
              <span className="material-icons group-hover:scale-110 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Campus Info */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">Campus</h3>
          <div className="flex flex-col lg:flex-row items-center bg-white p-10 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-500">
            <div className="lg:w-1/3 mb-8 lg:mb-0 lg:mr-10">
              <div className="relative overflow-hidden rounded-2xl shadow-lg group">
                <img 
                  alt="University campus" 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={campusImg} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <div className="lg:w-2/3 text-left">
              <p className="text-gray-700 leading-relaxed text-lg">
                MIT Art, Design & Technology University has successfully positioned itself as a New Generation University 
                with an aspiration to produce Innovators, Business Leaders, Scientists, Social Transformers, and nation builders. 
                MIT-ADT University takes a holistic approach towards education, motivating students to build a complete winning 
                personality that is <span className="font-semibold text-purple-600">"physically fit, intellectually sharp, mentally alert and spiritually elevated."</span>
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="material-icons text-purple-600 mr-2">check_circle</span>
                  <span className="text-sm text-gray-600">Yoga & Meditation</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-purple-600 mr-2">check_circle</span>
                  <span className="text-sm text-gray-600">Physical Training</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-purple-600 mr-2">check_circle</span>
                  <span className="text-sm text-gray-600">Communication Skills</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-purple-600 mr-2">check_circle</span>
                  <span className="text-sm text-gray-600">Personality Development</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default AchievementsAndDignitySection;