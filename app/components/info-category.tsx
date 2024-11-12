import React from "react";

export const InfoCategory: React.FC<{ header: string; children: React.ReactNode }> = ({ header, children }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-600 mb-4 text-center">
        {header}
      </h2>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
};
