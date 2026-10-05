'use client';
import { useEffect } from 'react';

const InstagramEmbed = ({ postUrl }: { postUrl: string }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://www.instagram.com/embed.js');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script
      document.body.removeChild(script);
    };
  }, []);
  return (
    <div className="w-full max-w-[540px] mx-auto my-4">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px rgba(0,0,0,0.5)',
          margin: '1px',
          minWidth: '326px',
          padding: 0,
          width: '99.375%',
        }}
      ></blockquote>
    </div>
  );
};

export default InstagramEmbed;
