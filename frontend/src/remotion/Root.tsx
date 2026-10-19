import { Composition } from "remotion";
import { TikTokShort } from "./TikTokShort";

export const RemotionRoot = () => {
  return (
    <Composition
      id="TikTokShort"
      component={TikTokShort}
      durationInFrames={1800} // 60 detik (30 fps * 60s)
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        videoUrl: "",
        startTime: "00:00:00",
        endTime: "00:00:30",
        hookText: "Sample Hook Text",
      }}
    />
  );
};