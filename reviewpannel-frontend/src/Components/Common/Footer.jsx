import React, { useState } from "react";
import mitLogo from "../../assets/mitlogo.png";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin, FaLightbulb } from "react-icons/fa";
import { X } from "lucide-react";
import ideabliss from "../../assets/ideabliss-logo.png";

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
    <footer className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-6 pt-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 text-sm">
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

        {/* Developer Info */}
        <div>
          <div className="mb-4">
            <img src={ideabliss} alt="Ideabliss" className="h-20 w-auto object-contain -ml-3 -mt-3" />
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <span className="opacity-80">Development Team:</span>
              <br />
              <span className="font-semibold">Strawhats</span>
            </li>
            <li>
              <span className="opacity-80">Contact:</span>
              <br />
              <a 
                href="mailto:sparktrack@ideabliss.com" 
                className="hover:underline font-medium"
              >
                sparktrack.ideabliss@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Mid Footer Bar */}
      <div className=" py-3 max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-400 flex flex-col md:flex-row items-center justify-between text-sm text-gray-200">
        <p>© 2025 MIT ADT University. All rights reserved.</p>
        <div className="flex space-x-6 mt-2 md:mt-0">
          <button onClick={() => setShowPrivacy(true)} className="hover:underline">Privacy Policy</button>
          <button onClick={() => setShowTerms(true)} className="hover:underline">Terms & Conditions</button>
        </div>
      </div>
    </footer>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold">Terms and Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-gray-800 space-y-4">
              <p className="text-base leading-relaxed">
                SparkTrack is a Project-Based Learning (PBL) management platform developed by <span className="font-semibold">Ideabliss</span> for MIT ADT University, Pune.
              </p>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Purpose of Use</h3>
                <p className="text-sm leading-relaxed">SparkTrack is intended solely for academic use related to Project-Based Learning activities at MIT ADT University.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">User Responsibility</h3>
                <p className="text-sm leading-relaxed">Users are responsible for the accuracy and authenticity of the information submitted on the platform, including project, group, and personal details.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Authorized Access</h3>
                <p className="text-sm leading-relaxed">Access is limited to authorized students, faculty, and administrators of MIT ADT University. Unauthorized use is strictly prohibited.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Usage</h3>
                <p className="text-sm leading-relaxed">All data collected is used only for academic administration, evaluation, and reporting purposes within the university.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Intellectual Property</h3>
                <p className="text-sm leading-relaxed">The SparkTrack platform, including its design and functionality, is the intellectual property of Ideabliss. Unauthorized copying or redistribution is not permitted.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">System Availability</h3>
                <p className="text-sm leading-relaxed">Ideabliss and MIT ADT University are not liable for temporary unavailability due to maintenance or technical issues.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Policy Updates</h3>
                <p className="text-sm leading-relaxed">These terms may be updated at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold">Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-gray-800 space-y-4">
              <p className="text-base leading-relaxed">
                SparkTrack is a Project-Based Learning (PBL) management platform developed by <span className="font-semibold">Ideabliss</span> for MIT ADT University, Pune. We are committed to protecting the privacy and security of user information.
              </p>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Information Collected</h3>
                <p className="text-sm leading-relaxed">SparkTrack may collect personal and academic information such as name, enrollment number, email address, project details, group information, and submission data.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Use of Information</h3>
                <p className="text-sm leading-relaxed">Collected information is used solely for academic administration, project tracking, evaluation, reporting, and communication within MIT ADT University.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Access and Sharing</h3>
                <p className="text-sm leading-relaxed">User data is accessible only to authorized faculty, administrators, and system operators. Data is not shared with third parties except when required by university policy or applicable law.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Security</h3>
                <p className="text-sm leading-relaxed">Reasonable technical and organizational measures are implemented to protect data against unauthorized access, alteration, or loss.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Retention</h3>
                <p className="text-sm leading-relaxed">Information is retained only for the duration necessary to fulfill academic and institutional requirements.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">User Responsibility</h3>
                <p className="text-sm leading-relaxed">Users are responsible for maintaining the confidentiality of their login credentials and for activities performed under their accounts.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Policy Updates</h3>
                <p className="text-sm leading-relaxed">This Privacy Policy may be updated periodically. Continued use of SparkTrack indicates acceptance of any changes.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-sm leading-relaxed">For privacy-related concerns, users should contact the respective academic department or system administrator at MIT ADT University.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force all footer <a> to white */}
      <style>{`
        footer a, footer button {
          color: white !important;
        }
      `}</style>
      </>
  );
};

export default Footer;

