import { FC } from "react";

const Gallery: FC = () => {
  return (
    <div className="bg-white shadow-md p-4 max-w-5xl mx-auto flex gap-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-600 mb-4 text-center">
            Florida Championships over the years
          </h2>
        </div>
        <div>
          <img src="/gallery/photo1.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo2.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo3.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo4.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo5.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo8.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo7.jpg" className="inline-block" alt="" />
        </div>
        <div>
          <img src="/gallery/photo9.jpg" className="inline-block" alt="" />
        </div>
      </div>
    </div>
  );
};

export default Gallery;
