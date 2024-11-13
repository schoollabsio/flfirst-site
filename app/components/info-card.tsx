import React from "react";

export const InfoCardHeader: React.FC<{
  title: string;
  secondaryContent?: React.ReactElement | string | null;
}> = ({ title, secondaryContent }) => {
  return (
    <div className="flex justify-between">
      <h2 className="text-xl max-w-44">{title}</h2>
      {secondaryContent && (
        <h3 className="text-md text-gray-400 hover:text-blue-600 italic">
          {secondaryContent}
        </h3>
      )}
    </div>
  );
};

export const InfoCard: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="flex flex-col bg-white p-4 shadow-md gap-4">{children}</div>
);

export const InfoCardContent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div className="flex">{children}</div>;

export const InfoCardColumn: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="flex flex-col flex-1 gap-2">{children}</div>
);

export const InfoCardFooter: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="border-t p-4 border-gray-200">
    <div className="flex justify-end">{children}</div>
  </div>
);

export const InfoCardAttribute: React.FC<{
  label: string;
  value: React.ReactNode | string | null;
  shouldDisplay?: boolean;
}> = ({ label, value, shouldDisplay = true }) => {
  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="text-gray-500 text-sm">{label.toUpperCase()}</div>
      <div className="text-md">{value || ""}</div>
    </div>
  );
};
