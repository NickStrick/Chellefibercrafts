'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';




const MobileNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow fixed top-0 left-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex flex-row items-center">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Image src="/logo.png" alt="Logo" width={70} height={70} priority={true}/>
        </Link>
        
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 text-base font-medium text-black">
          <Link className="hover:text-purple-700 transition-all nav-btn" href="/">Custom</Link>
          <Link className="hover:text-purple-700 transition-all nav-btn" href="/#About">Custom</Link>
          <Link className="hover:text-purple-700 transition-all nav-btn" href="/#events">Custom</Link>
          <Link className="hover:text-purple-700 transition-all nav-btn" href="/founders">Custom</Link>
        </nav>

        {/* Hamburger Icon (Mobile Only) */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-black focus:outline-none"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Dropdown Menu (Mobile Only) */}
      {open && (
        <nav className="md:hidden bg-white w-full shadow-md">
          <ul className="flex flex-col items-start gap-4 px-6 py-4 text-lg font-medium">
            <li>
              <Link className="nav-btn transition-all text-nowrap" href="/" onClick={() => setOpen(false)}>
                Custom
              </Link>
            </li>
            <li>
              
              <Link className="nav-btn text-nowrap" href="/#About" onClick={() => setOpen(false)}>
                Custom
              </Link>
            </li>
            <li>
              <Link className="nav-btn transition-all  text-nowrap" href="/#events" onClick={() => setOpen(false)}>
                Custom
              </Link>
            </li>
            
            <li>
              <Link className="nav-btn  text-nowrap" href="/founders" onClick={() => setOpen(false)}>
                Custom
              </Link>
            </li>
          </ul>

          
        </nav>
      )}
      
    </header>
  );
};

export default MobileNavbar;
