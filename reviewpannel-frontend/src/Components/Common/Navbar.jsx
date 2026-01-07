import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import mitLogo from '../../assets/mitlogo2.png';
import '../../Style/Navbar.css'; // Optional if you want additional styles

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center">
          <img alt="MIT Logo" className="h-10 mr-3" src={mitLogo} />
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6 nav-item">
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/">Home</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/aboutpbl">About PBL</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/download">Downloads</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/students">Students</Link>

        </nav>

        {/* Login Button */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login" className="px-4 py-2 loginbutton text-white text-sm rounded transition">Login</Link>
          <Link to="/studentlogin" className="px-4 py-2 loginbutton text-white text-sm rounded transition">Student Login</Link>
        </div>

        {/* Mobile Menu Button */}
       <button onClick={toggleMobileMenu} className="md:hidden focus:outline-none hemburger-button">
  <span className="material-icons text-3xl text-black">menu</span>
</button>

      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 pb-4">
          <nav className="flex flex-col space-y-3 nav-item">
            <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/">Home</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/aboutpbl">About PBL</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/download">Downloads</Link>
          <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/login">Login</Link>

          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

