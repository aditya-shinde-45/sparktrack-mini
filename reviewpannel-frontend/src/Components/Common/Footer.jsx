import React from "react";
import mitLogo from "../../assets/mitlogo.png";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <>
    <footer className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-6 pt-10 mt-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
        {/* Logo Section */}
       

<div>
  <img src={mitLogo} alt="MIT Logo" className="h-12 mb-3" />
  <p className="text-xs mb-4 opacity-80">
    Ideas. Action. Impact. Together
  </p>
  <div className="flex gap-1">
    <a
      href="https://www.facebook.com/mitadtuniversity"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1e0e3e] p-2 rounded-full hover:scale-110 transition"
    >
      <FaFacebookF className="text-xl" />
    </a>
    <a
      href="https://x.com/mitadtpune"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1e0e3e] p-2 rounded-full hover:scale-110 transition"
    >
      <FaTwitter className="text-xl" />
    </a>
    <a
      href="https://www.instagram.com/accounts/login/?next=%2Fmitadtuniversity%2F"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1e0e3e] p-2 rounded-full hover:scale-110 transition"
    >
      <FaInstagram className="text-xl" />
    </a>
    <a
      href="https://www.linkedin.com/school/mit-adtuniversity/posts/?feedView=all"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1e0e3e] p-2 rounded-full hover:scale-110 transition"
    >
      <FaLinkedin className="text-xl" />
    </a>
  </div>
</div>

        {/* About */}
        <div>
          <h3 className="font-semibold mb-2 text-white">About</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">How it works</a></li>
            <li><a href="#" className="hover:underline">Featured</a></li>
            <li><a href="#" className="hover:underline">Partnership</a></li>
            <li><a href="#" className="hover:underline">Business Relation</a></li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <h3 className="font-semibold mb-2 text-white">Community</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Events</a></li>
            <li><a href="#" className="hover:underline">Blog</a></li>
            <li><a href="#" className="hover:underline">Podcast</a></li>
            <li><a href="#" className="hover:underline">Invite a friend</a></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="font-semibold mb-2 text-white">Socials</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Discord</a></li>
            <li><a href="#" className="hover:underline">Instagram</a></li>
            <li><a href="#" className="hover:underline">Twitter</a></li>
            <li><a href="#" className="hover:underline">Facebook</a></li>
          </ul>
        </div>
      </div>

      {/* Mid Footer Bar */}
      <div className=" py-3 max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-400 flex flex-col md:flex-row items-center justify-between text-sm text-gray-200">
        <p>© 2025 MIT ADT University. All rights reserved.</p>
        <div className="flex space-x-6 mt-2 md:mt-0">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms & Conditions</a>
        </div>
      </div>
    </footer>

      <div className=" bg-white text-center py-3 text-xs text-gray-500 mt-6">
        Designed & Developed by StrawHats Team — Powered by MIT ADT
      </div>

      {/* Force all footer <a> to white */}
      <style>{`
        footer a {
          color: white !important;
        }
      `}</style>
      </>
  );
};

export default Footer;

