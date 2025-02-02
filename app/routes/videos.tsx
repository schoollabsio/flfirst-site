import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FirstTeam, Prisma, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import {
  InfoCard,
  InfoCardAttribute,
  InfoCardColumn,
  InfoCardContent,
  InfoCardHeader,
} from "~/components/info-card";
import { InfoCategory } from "~/components/info-category";
import { useState } from "react";

interface FirstVideo {
  id: number;
  event_code: string;
  event_name: string;
  team: number;
  award: string;
  url: string | null;
  available_at: Date;
}

export const loader: LoaderFunction = async () => {
  const prisma = new PrismaClient();

  const videos = await prisma.firstVideo.findMany({
    orderBy: [{ event_code: "asc" }, { team: "asc" }],
  });

  const teams = await prisma.firstTeam.findMany();

  return json({ videos, teams });
};

export default function Videos() {
  const { videos, teams } = useLoaderData<{
    videos: FirstVideo[];
    teams: FirstTeam[];
  }>();

  const [searchTerm, setSearchTerm] = useState("");

  const groupedVideos = videos
    .filter(
      (video) =>
        video.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.team.toString().includes(searchTerm.toLowerCase()) ||
        video.award.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .reduce(
      (acc, video) => {
        if (!acc[video.event_code]) {
          acc[video.event_code] = {
            name: video.event_name,
            videos: [],
          };
        }
        acc[video.event_code].videos.push(video);
        return acc;
      },
      {} as Record<string, { name: string; videos: FirstVideo[] }>,
    );

  return (
    <div className="w-full md:min-w-[750px] md:max-w-prose flex flex-col gap-4">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold">Award Videos</h1>
        <p className="text-gray-500">
          Below, you can find video submissions for the Compass award.
        </p>
        <p className="text-gray-500">
          To submit a video, please login to{" "}
          <a
            href="https://ftcregion.com"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            Region Manager
          </a>
          , find the event, and provide the video URL.
        </p>
      </div>
      <div className="flex flex-col w-full mx-auto">
        {Object.entries(groupedVideos).map(([eventCode, { name, videos }]) => (
          <div key={eventCode} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-600 mb-4 text-center">
              {name}
            </h2>
            <div className="flex flex-col gap-4">
              {videos
                .filter((video) => video.url)
                .map((video) => (
                  <div
                    key={`${video.event_code}-${video.team}`}
                    className="flex flex-row bg-white p-4 shadow-md gap-4"
                  >
                    <div>{video.team}</div>
                    <div>
                      {teams.find((team) => team.number === video.team)?.name ??
                        "Unknown Team"}
                    </div>
                    <div className="flex-grow text-right">
                      {video.url ? (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Watch Video →
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
