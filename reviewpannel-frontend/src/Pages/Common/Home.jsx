import React from "react";
import Navbar from "../../Components/Common/Navbar";
import Footer from "../../Components/Common/Footer";
import HeroSection from "../../Components/Common/HeroSection";
import AchievementsSection from "../../Components/Common/AchievementsSection";
import DignitySection from "../../Components/Common/DignitySection";

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="bg-gray-50 font-[Poppins]">
        <HeroSection />
        <AchievementsSection />
        <DignitySection />
      </div>
      <Footer />
    </>
  );
};

export default Home;