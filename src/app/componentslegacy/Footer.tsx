'use client';
import Link from "next/link";
import Image from "next/image";
import LIImg from "../../../public/linkedin.png";
import instaImg from "../../../public/Instagram.png";
import CTAImage from "../../../public/logoTrans.png";
import facebookImg from "../../../public/facebook.png";

// import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  // const { language } = useLanguage();

  return (
    <footer className="bg-gradient-white-gray text-black px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">

        {/* Logo */}
        <div className="flex-shrink-0 mr-auto md:mr-0">
          <Image src={CTAImage} alt="Connecting Dots Logo" width={140} height={60} />
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-purple-600 transition">
            Custom
          </Link>
          <Link href="/#About" className="hover:text-purple-600 transition">
            Custom
          </Link>
          <Link href="/#events" className="hover:text-purple-600 transition">
            Custom
          </Link>
          <Link href="/founders" className="hover:text-purple-600 transition">
            Custom
          </Link>
          
        </div>

        {/* Social Media */}
        <div className="flex items-center gap-6">
          <a
            href="https://www.instagram.com/connectingdotsforlatinx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={instaImg}
              alt="Instagram"
              width={60}
              height={60}
              className=" hover:scale-110 focus:outline-none transition-all duration-300 ease-in-out"
            />
          </a>
          <a
            href="https://www.facebook.com/people/Connecting-Dots-for-Latinx-Professionals/61577340749137/#"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={facebookImg}
              alt="Facebook"
              width={60}
              height={60}
              className=" hover:scale-110 focus:outline-none transition-all duration-300 ease-in-out"
            />
          </a>
          <a
            href="https://www.linkedin.com/company/connecting-dots-for-latinx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={LIImg}
              alt="LinkedIn"
              width={60}
              height={60}
              className=" hover:scale-110 focus:outline-none transition-all duration-300 ease-in-out"
            />
          </a>
          
        </div>
      </div>

      {/* Bottom Text */}
      <div className="mt-8 text-center text-sm text-purple-1000">
        &copy; {new Date().getFullYear()} 
            {` Connecting Dots for Latinx Professionals. All rights reserved.`}
      </div>
    </footer>
  );
}
