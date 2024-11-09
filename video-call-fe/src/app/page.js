'use client'
import React from 'react';
import { useRouter } from 'next/navigation'

function HomePage() {
  const router = useRouter();

  const navigateToPage = (page) => {
    router.push(`/${page}`);
  };

  return (
    <div>
      <h1>Homepage</h1>
      <button type="button" onClick={() => router.push('/video')}>
        Video
      </button>
      <button type="button" onClick={() => router.push('/chat')}>
        Chat
      </button>
    </div>
  );
}

export default HomePage;
