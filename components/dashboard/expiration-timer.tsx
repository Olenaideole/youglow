"use client";

import React, { useState, useEffect } from 'react';

interface ExpirationTimerProps {
  expirationDate: string | null;
}

const ExpirationTimer: React.FC<ExpirationTimerProps> = ({ expirationDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>("--");

  useEffect(() => {
    if (!expirationDate) {
      setTimeLeft("No active subscription");
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(expirationDate) - +new Date();
      let newTimeLeft = "";

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        newTimeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else {
        newTimeLeft = "Expired";
      }
      return newTimeLeft;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup function
    return () => clearInterval(intervalId);

  }, [expirationDate]);

  return (
    <div>
      <p>Time Remaining: {timeLeft}</p>
    </div>
  );
};

export default ExpirationTimer;
