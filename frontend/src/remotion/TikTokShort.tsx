import { AbsoluteFill, Video, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const TikTokShort = ({ videoUrl, hookText }: { videoUrl: string; hookText: string }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Animasi progress bar bagian bawah video
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-black flex items-center justify-center">
      {/* 1. Latar Video Vertikal */}
      <Video src={videoUrl} className="w-full h-full object-cover" />

      {/* 2. Overlay Animated Hook Text (Kinetic Typography) */}
      <div className="absolute top-1/4 px-8 text-center">
        <h1 className="text-5xl font-black text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase tracking-wide animate-pulse">
          {hookText}
        </h1>
      </div>

      {/* 3. Progress Bar Bergerak di Bawah */}
      <div className="absolute bottom-0 left-0 h-2 bg-rose-500" style={{ width: `${progressWidth}%` }} />
    </AbsoluteFill>
  );
};