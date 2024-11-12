import React from 'react';

const ContentPageHeading = ({ text, image }: { text: string, image: string }) => (
    <div className="relative z-0 -mt-4 -mx-4">
        <img src={image} alt="Logo" />
        <div className="h-full absolute top-0 left-0 flex flex-col justify-end">
            <h2 className="text-6xl font-bold text-white bg-black w-auto py-6 px-4 opacity-80">
                {text}
            </h2>
        </div>
    </div>
);

export default ContentPageHeading;
