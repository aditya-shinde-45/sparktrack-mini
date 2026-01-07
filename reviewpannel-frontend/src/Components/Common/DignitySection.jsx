import React, { useRef, useState } from "react";
import campusImg from "../../assets/home/campus.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
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

const DignitySection = () => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const facultyImages = [
    { alt: "Dr. Mangesh Karad", src: Drmangeshkarad, info: "Vice Chancellor - MIT ADT University", department: "Administration" },
    { alt: "Vipul Dalal", src: vipuldalal, info: "Dean of Academics", department: "Academic Affairs" },
    { alt: "Ramchandra Pujeri", src: RamchandraPujeri, info: "Professor, Engineering", department: "Engineering" },
    { alt: "Rajneesh Kaur Sachdeo", src: RajneeshkaurSachdeo, info: "Head of Design Department", department: "Design" },
    { alt: "Ganesh Pathak", src: GaneshPathak, info: "Professor, Architecture", department: "Architecture" },
    { alt: "Dr. Shraddha Phansalkar", src: DrShraddhaPhansalkar, info: "Head of Research", department: "Research" },
    { alt: "Prashant Dhotre", src: Prashant_Dhotre, info: "Associate Professor", department: "Technology" },
    { alt: "Rekha Sugandhi", src: RekhaSugandhi, info: "Professor, Management", department: "Management" },
    { alt: "Jayshree Prasad", src: jayshreePrasad, info: "Head of Fine Arts", department: "Fine Arts" },
    { alt: "Dr. Shafi Pathan", src: DrShafiPathan, info: "Dean of Faculty", department: "Faculty Affairs" },
    { alt: "Suresh Kapare", src: sureshkapare, info: "Professor, Media Studies", department: "Media" },
  ];

  return (
    <section className="text-center mb-24 px-6 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Dignity</h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-12">
        MIT Art, Design and Technology University is a hub of innovation and leadership...
      </p>

      {/* Campus Info */}
      <div className="flex flex-col lg:flex-row items-center bg-white p-8 rounded-lg shadow-lg">
        <div className="lg:w-1/3 mb-8 lg:mb-0 lg:mr-8">
          <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
            <img alt="University campus" className="w-full h-full object-cover" src={campusImg} />
          </div>
        </div>
        <div className="lg:w-2/3 text-left">
          <p className="text-gray-600 leading-relaxed">
           MIT Art, Design & Technology University has successfully positioned itself as a New Generation University which is having an aspiration to produce Innovators, Business Leaders, Scientists, Social Transformers, and nation builders, coming from all walks of life. MIT-ADT University has been taking a holistic approach towards imparting education wherein the students are being motivated to build a complete winning personality that is “physically fit, intellectually sharp, mentally alert and spiritually elevated. The students are being encouraged to participate in yoga, meditation, physical training, spiritual elevation, communication skills, and other personality development programs.

          </p>
        </div>
      </div>

      {/* Faculty Carousel */}
      <div className="mt-12 relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={5}
          slidesPerView={4}
          loop={true}
          navigation={false}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          breakpoints={{
            320: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
        >
          {facultyImages.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="flip-card w-full aspect-square">
                <div className="flip-card-inner w-full h-full">
                  {/* Front */}
                  <div className="flip-card-front shadow-lg overflow-hidden">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </div>
                  {/* Back */}
                  <div className="flip-card-back bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex flex-col items-center justify-center p-4 shadow-lg">
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-2">{img.alt}</h3>
                      <p className="text-sm mb-2">{img.info}</p>
                      <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <span className="text-xs font-medium">{img.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Arrows pushed OUTSIDE */}
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute top-1/2 -translate-y-1/2 -left-12 bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition shadow-md"
        >
          <span className="material-icons text-gray-600">arrow_back</span>
        </button>

        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute top-1/2 -translate-y-1/2 -right-12 bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition shadow-md"
        >
          <span className="material-icons">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};

export default DignitySection;
