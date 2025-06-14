import React from 'react';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div>
          <h1>Privacy Policy</h1>
          <p>This is the privacy policy page.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
