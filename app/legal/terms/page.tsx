import React from 'react';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div>
          <h1>Terms of Service</h1>
          <p>This is the terms of service page.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
