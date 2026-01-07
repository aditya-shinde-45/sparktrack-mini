import React from "react";
import Navbar from "../../Components/Common/Navbar";
import Footer from "../../Components/Common/Footer";
import HeroSection from "../../Components/Common/HeroSection";
import AchievementsAndDignitySection from "../../Components/Common/AchievementsAndDignitySection";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-gray-50 font-[Poppins] px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <AchievementsAndDignitySection />
      </div>
      <Footer />
    </div>
  );
};

export default Home;