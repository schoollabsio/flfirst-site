import { MetaFunction } from "@remix-run/react";

import features from "../../features.json";
import FeatureDisabled from "~/components/feature-disabled";
import useFeatureFlag from "~/hooks/useFeatureFlag";

console.log(features);

export const meta: MetaFunction = () => {
  return [
    { title: "Videos | Florida FIRST Tech Challenge" },
    {
      name: "description",
      content: "Videos submitted by teams in the Florida FIRST Tech Challenge",
    },
  ];
};

const VIDEOS = [
  {
    teamNumber: "12345",
    teamName: "Robotics Masters",
    title: "Robot Reveal 2024",
    videoUrl: "https://youtube.com/example1",
  },
  {
    teamNumber: "67890",
    teamName: "Tech Titans",
    title: "Competition Highlights",
    videoUrl: "https://youtube.com/example2",
  },
];

export default function Videos() {
  const videosEnabled = useFeatureFlag("videos");

  if (!videosEnabled) {
    return <FeatureDisabled feature="videos" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Videos</h1>
        <a
          href="https://ftcregion.com"
          target="_blank"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Submit
        </a>
      </div>

      <div className="grid gap-6">
        {VIDEOS.map((video) => (
          <div
            key={`${video.teamNumber}-${video.title}`}
            className="border p-4 shadow-sm bg-white"
          >
            <h2 className="text-xl font-semibold">
              Team {video.teamNumber} - {video.teamName}
            </h2>
            <p className="text-gray-600 mb-2">{video.title}</p>
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Watch Video →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
