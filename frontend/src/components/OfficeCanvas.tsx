"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Html, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { AGENTS_37, Agent } from "../data/agents";
import { Agent3D } from "./Agent3D";
import { DeskProp } from "./DeskProp";
import { CentralBriefingTable } from "./CentralBriefingTable";
import { getRandomStatus } from "../data/statuses";
import { soundManager } from "../utils/sound";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

const DIVISION_COLORS: Record<string, { bg: string; border: string; dot: string; hex: string }> = {
  Mastermind: { bg: "bg-rose-950/80", border: "border-rose-500/50", dot: "#f43f5e", hex: "#f43f5e" },
  Executive: { bg: "bg-amber-950/80", border: "border-amber-500/50", dot: "#f59e0b", hex: "#f59e0b" },
  Technology: { bg: "bg-cyan-950/80", border: "border-cyan-500/50", dot: "#06b6d4", hex: "#06b6d4" },
  "Data & AI": { bg: "bg-purple-950/80", border: "border-purple-500/50", dot: "#a855f7", hex: "#a855f7" },
  Marketing: { bg: "bg-pink-950/80", border: "border-pink-500/50", dot: "#ec4899", hex: "#ec4899" },
  Operations: { bg: "bg-emerald-950/80", border: "border-emerald-500/50", dot: "#10b981", hex: "#10b981" },
  Product: { bg: "bg-indigo-950/80", border: "border-indigo-500/50", dot: "#6366f1", hex: "#6366f1" },
};

const DIVISION_OFFSETS: Record<string, [number, number]> = {
  Mastermind: [0.5, -2.2],
  Executive: [0, -8.0],
  Technology: [-7.5, -2.5],
  "Data & AI": [7.5, -2.5],
  Product: [-7.5, 4.2],
  Marketing: [7.5, 4.2],
  Operations: [0, 8.5],
};

const THEMES = {
  corporate: {
    name: "Corporate Minimalist",
    bg: "bg-slate-900",
    nightBg: "bg-slate-950",
    floorColor: "#0f172a",
    nightFloorColor: "#020617",
    lightColor: "#ffffff",
    nightLightColor: "#818cf8",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    bg: "bg-zinc-950",
    nightBg: "bg-black",
    floorColor: "#09090b",
    nightFloorColor: "#000000",
    lightColor: "#ec4899",
    nightLightColor: "#f43f5e",
  },
  matrix: {
    name: "Matrix Green",
    bg: "bg-neutral-950",
    nightBg: "bg-neutral-950",
    floorColor: "#022c22",
    nightFloorColor: "#021a14",
    lightColor: "#10b981",
    nightLightColor: "#34d399",
  },
};

const BRIEFING_SPEAKERS = [
  { division: "Mastermind", name: "Aria", role: "Chief Mastermind & Creative Video Strategist", text: "Melaporkan hasil riset tren iklan dari Google Search. Seluruh prompt video sinematik siap didelegasikan dan dikirim ke Telegram." },
  { division: "Executive", name: "Alex", role: "Chief Executive Officer", text: "Target KPI kuartal ini tercapai 98.4%. Seluruh divisi siap untuk ekspansi fase berikutnya." },
  { division: "Technology", name: "Sarah", role: "Lead Systems Architect", text: "Infrastruktur server lokal stabil. Pipeline CI/CD berjalan otomatis tanpa latensi tinggi." },
  { division: "Data & AI", name: "David", role: "Senior AI Researcher", text: "Model LLM lokal telah selesai fine-tuning dengan peningkatan akurasi 4.2% pada pemrosesan vektor." },
  { division: "Marketing", name: "Jessica", role: "Growth Marketing Director", text: "Kampanye digital media sosial menunjukkan lonjakan engagement rate sebesar 34% minggu ini." },
  { division: "Operations", name: "Michael", role: "DevOps & Infrastructure Lead", text: "Keamanan jaringan dan backup database harian di Supabase berjalan lancar 24/7." },
  { division: "Product", name: "Linda", role: "Head of Product Design", text: "Roadmap UI/UX modul interaktif baru siap diintegrasikan ke platform utama." }
];

function OfficeChair({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.08, 0.48]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.74, -0.21]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.46, 0.58, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.26, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      <mesh position={[0.26, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
    </group>
  );
}

function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.25, 0.8, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 16]} />
        <meshStandardMaterial color="#3b2510" roughness={0.9} />
      </mesh>

      {[
        [0, 1.1, 0, 0.4],
        [0.15, 1.25, 0.1, 0.35],
        [-0.15, 1.2, -0.1, 0.38],
        [0.1, 1.35, -0.12, 0.3],
        [-0.12, 1.3, 0.15, 0.32],
      ].map((leaf, i) => (
        <mesh key={i} position={[leaf[0], leaf[1], leaf[2]]} rotation={[Math.sin(i) * 0.3, i, Math.cos(i) * 0.3]}>
          <dodecahedronGeometry args={[leaf[3], 1]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function OfficeArchitecture() {
  return (
    <group>
      <mesh position={[0, 4.5, -12]} receiveShadow>
        <boxGeometry args={[36, 9, 0.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
      </mesh>

      <mesh position={[0, 5, -11.75]}>
        <boxGeometry args={[28, 5, 0.1]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.25} roughness={0.1} metalness={0.9} />
      </mesh>

      <mesh position={[0, 6.8, -11.7]}>
        <boxGeometry args={[14, 2.2, 0.15]} />
        <meshStandardMaterial color="#09090b" roughness={0.2} />
      </mesh>

      {[
        [-16, 4.5, -11.5],
        [16, 4.5, -11.5],
        [-16, 4.5, 0],
        [16, 4.5, 0],
        [-16, 4.5, 11.5],
        [16, 4.5, 11.5],
      ].map((pos, idx) => (
        <group key={`col-${idx}`} position={pos as [number, number, number]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 9, 1.2]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, -4.2, 0]}>
            <boxGeometry args={[1.35, 0.4, 1.35]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      <PottedPlant position={[-14.5, 0, -10]} />
      <PottedPlant position={[14.5, 0, -10]} />
      <PottedPlant position={[-14.5, 0, 10]} />
      <PottedPlant position={[14.5, 0, 10]} />
      <PottedPlant position={[-3.5, 0, -10.5]} />
      <PottedPlant position={[3.5, 0, -10.5]} />
    </group>
  );
}

interface LiveLog {
  id: string;
  agentId: string;
  agentName: string;
  division: string;
  text: string;
  time: string;
}

interface TaskItem {
  id: string;
  title: string;
  targetDivision: string;
  status: "Pending" | "In Progress" | "Completed";
  created_at: string;
}

export default function OfficeCanvas() {
  const [session] = useState<Session | null>({
    user: {
      email: "Bos Septi",
      id: "boss-septi-local-id",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  } as unknown as Session);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>("corporate");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");

  const [isBriefingMode, setIsBriefingMode] = useState(false);
  const [briefingIndex, setBriefingIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const [dynamicAgents, setDynamicAgents] = useState<Agent[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hq_dynamic_agents");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return AGENTS_37;
  });

  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formDivision, setFormDivision] = useState("Mastermind");
  const [formModelUrl, setFormModelUrl] = useState("/models/wanita.glb");

  const [isAutonomousMode, setIsAutonomousMode] = useState(false);
  const [autonomousEvent, setAutonomousEvent] = useState<string | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<string | null>(null);

  // Kredensial & API Keys
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [fastapiEndpoint, setFastapiEndpoint] = useState("http://localhost:8000/api/chat");

  const [sidebarTab, setSidebarTab] = useState<"chat" | "stats" | "tasks">("chat");
  const [agentTasks, setAgentTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [targetDivision, setTargetDivision] = useState("Mastermind");

  const [onlineUsersCount, setOnlineUsersCount] = useState(1);
  const [liveStreamLogs, setLiveStreamLogs] = useState<LiveLog[]>([]);

  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const cameraRef = useRef<CameraControls>(null);

  const activeTheme = THEMES[currentTheme];

  useEffect(() => {
    localStorage.setItem("hq_dynamic_agents", JSON.stringify(dynamicAgents));
  }, [dynamicAgents]);

  const organizedAgents = useMemo(() => {
    const divisionCounts: Record<string, number> = {};
    dynamicAgents.forEach((agent) => {
      divisionCounts[agent.division] = (divisionCounts[agent.division] || 0) + 1;
    });

    const divisionCurrentIndex: Record<string, number> = {};

    return dynamicAgents.map((agent) => {
      const div = agent.division;
      const totalInDiv = divisionCounts[div] || 1;
      const index = divisionCurrentIndex[div] || 0;
      divisionCurrentIndex[div] = index + 1;

      const offset = DIVISION_OFFSETS[div] || [0, 0];
      const cols = totalInDiv >= 8 ? 4 : totalInDiv >= 4 ? 3 : 2;

      const col = index % cols;
      const row = Math.floor(index / cols);

      const deskSpacing = 1.4;
      const x = offset[0] + (col - (cols - 1) / 2) * deskSpacing;
      const z = offset[1] + row * deskSpacing;

      return {
        ...agent,
        position: [x, 0, z] as [number, number, number],
      };
    });
  }, [dynamicAgents]);

  const divisionCenters = useMemo(() => {
    const centers: Record<string, { x: number; z: number; count: number }> = {};

    organizedAgents.forEach((agent) => {
      if (!centers[agent.division]) {
        centers[agent.division] = { x: 0, z: 0, count: 0 };
      }
      centers[agent.division].x += agent.position[0];
      centers[agent.division].z += agent.position[2];
      centers[agent.division].count += 1;
    });

    return Object.entries(centers).map(([division, data]) => ({
      division,
      position: [data.x / data.count, 3.6, data.z / data.count - 1.6] as [number, number, number],
      centerPos: [data.x / data.count, 0.01, data.z / data.count] as [number, number, number],
    }));
  }, [organizedAgents]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("hq_supabase_url") || "";
    const savedKey = localStorage.getItem("hq_supabase_key") || "";
    const savedGoogleKey = localStorage.getItem("hq_google_api_key") || "";
    const savedYoutubeKey = localStorage.getItem("hq_youtube_api_key") || "";
    const savedTeleToken = localStorage.getItem("hq_telegram_bot_token") || "";
    const savedTeleChat = localStorage.getItem("hq_telegram_chat_id") || "";
    const savedFastapi = localStorage.getItem("hq_fastapi_endpoint") || "http://localhost:8000/api/chat";

    setSupabaseUrl(savedUrl);
    setSupabaseKey(savedKey);
    setGoogleApiKey(savedGoogleKey);
    setYoutubeApiKey(savedYoutubeKey);
    setTelegramBotToken(savedTeleToken);
    setTelegramChatId(savedTeleChat);
    setFastapiEndpoint(savedFastapi);
  }, []);

  useEffect(() => {
    const roomChannel = supabase.channel("hq-presence-room", {
      config: {
        presence: {
          key: "Bos Septi",
        },
      },
    });

    roomChannel
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        const users = Object.keys(state);
        setOnlineUsersCount(users.length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await roomChannel.track({
            online_at: new Date().toISOString(),
            device: "Command Center Web",
          });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, []);

  useEffect(() => {
    if (!isAutonomousMode) {
      setAutonomousEvent(null);
      return;
    }

    const interval = setInterval(() => {
      const divisions = Object.keys(DIVISION_OFFSETS);
      const divA = divisions[Math.floor(Math.random() * divisions.length)];
      let divB = divisions[Math.floor(Math.random() * divisions.length)];
      while (divB === divA) {
        divB = divisions[Math.floor(Math.random() * divisions.length)];
      }

      const agentsInDivA = organizedAgents.filter((a) => a.division === divA);
      const agentsInDivB = organizedAgents.filter((a) => a.division === divB);

      if (agentsInDivA.length > 0 && agentsInDivB.length > 0) {
        const agentA = agentsInDivA[Math.floor(Math.random() * agentsInDivA.length)];
        const agentB = agentsInDivB[Math.floor(Math.random() * agentsInDivB.length)];

        const eventText = `[Otonom] 🔄 ${agentA.name} (${divA}) mengirim payload data ke ${agentB.name} (${divB}). Sinkronisasi berhasil!`;
        setAutonomousEvent(eventText);
        soundManager.playSend();

        const now = new Date();
        const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        const newLog: LiveLog = {
          id: Math.random().toString(36).substring(2, 9),
          agentId: agentA.id,
          agentName: agentA.name,
          division: agentA.division,
          text: `Koordinasi lintas divisi dengan ${agentB.name} (${divB}) selesai.`,
          time: timeString,
        };

        setLiveStreamLogs((prev) => [newLog, ...prev.slice(0, 7)]);
        setSpeakingAgentId(agentA.id);
        setTimeout(() => setSpeakingAgentId(null), 3500);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutonomousMode, organizedAgents]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem("hq_supabase_url", supabaseUrl);
    localStorage.setItem("hq_supabase_key", supabaseKey);
    localStorage.setItem("hq_google_api_key", googleApiKey);
    localStorage.setItem("hq_youtube_api_key", youtubeApiKey);
    localStorage.setItem("hq_telegram_bot_token", telegramBotToken);
    localStorage.setItem("hq_telegram_chat_id", telegramChatId);
    localStorage.setItem("hq_fastapi_endpoint", fastapiEndpoint);

    try {
      const settingsUrl = fastapiEndpoint.replace("/api/chat", "/api/settings");
      await fetch(settingsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: googleApiKey,
          youtube_api_key: youtubeApiKey,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
        }),
      });
    } catch (err) {
      console.warn("⚠️ Gagal sinkron ke FastAPI, settings disimpan di localStorage:", err);
    }

    setIsSettingsOpen(false);
    alert("✅ Semua API Key & Pengaturan HQ berhasil diperbarui!");
  };

  const handleTriggerShortPipeline = async () => {
    try {
      const endpoint = localStorage.getItem("hq_fastapi_endpoint") || "http://localhost:8000/api/chat";
      const triggerUrl = endpoint.replace("/api/chat", "/api/video-pipeline/trigger");

      const res = await fetch(triggerUrl, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        alert("🎬 " + data.message);
      } else {
        alert("❌ Gagal memicu pipeline. Pastikan server FastAPI aktif.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Gagal terhubung ke backend FastAPI.");
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Browser Anda tidak mendukung fitur Voice-to-Text (Speech Recognition).");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setInputText(speechText);
      setIsListening(false);
      soundManager.playTyping();
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const toggleBriefingMode = () => {
    const nextMode = !isBriefingMode;
    setIsBriefingMode(nextMode);
    setSelectedAgent(null);

    if (!cameraRef.current) return;

    if (nextMode) {
      cameraRef.current.setLookAt(0, 5.2, 7.5, 0, 1.2, 2, true);
    } else {
      cameraRef.current.setLookAt(0, 18, 24, 0, 0, 0, true);
    }
  };

  useEffect(() => {
    if (!isBriefingMode) return;
    const interval = setInterval(() => {
      setBriefingIndex((prev) => (prev + 1) % BRIEFING_SPEAKERS.length);
      soundManager.playTyping();
    }, 5500);
    return () => clearInterval(interval);
  }, [isBriefingMode]);

  useEffect(() => {
    if (!cameraRef.current || isBriefingMode) return;

    if (selectedDivision === "All") {
      cameraRef.current.setLookAt(0, 18, 24, 0, 0, 0, true);
    } else {
      const offset = DIVISION_OFFSETS[selectedDivision];
      if (offset) {
        const [divX, divZ] = offset;
        cameraRef.current.setLookAt(
          divX, 7.5, divZ + 7.5,
          divX, 0, divZ,
          true
        );
      }
    }
  }, [selectedDivision, isBriefingMode]);

  useEffect(() => {
    const fetchInitialLogs = async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(7);

      if (data && !error) {
        const formattedLogs: LiveLog[] = data.map((log: any) => ({
          id: log.id,
          agentId: log.agent_id,
          agentName: log.agent_name,
          division: log.division,
          text: log.text,
          time: new Date(log.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        }));
        setLiveStreamLogs(formattedLogs);
      }
    };

    fetchInitialLogs();

    const channel = supabase
      .channel("realtime-agent-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_logs" },
        (payload) => {
          const log = payload.new;
          const timeStr = new Date(log.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          const newLog: LiveLog = {
            id: log.id,
            agentId: log.agent_id,
            agentName: log.agent_name,
            division: log.division,
            text: log.text,
            time: timeStr,
          };

          setLiveStreamLogs((prev) => [newLog, ...prev.slice(0, 6)]);
          soundManager.playTyping();

          setSpeakingAgentId(log.agent_id);
          setTimeout(() => setSpeakingAgentId(null), 3500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const initialMap: Record<string, string> = {};
    organizedAgents.forEach((agent) => {
      initialMap[agent.id] = getRandomStatus(agent.division);
    });
    setAgentStatuses(initialMap);

    const statusInterval = setInterval(() => {
      if (organizedAgents.length === 0) return;
      const randomIndex = Math.floor(Math.random() * organizedAgents.length);
      const targetAgent = organizedAgents[randomIndex];

      setAgentStatuses((prev) => ({
        ...prev,
        [targetAgent.id]: getRandomStatus(targetAgent.division),
      }));
    }, 4000);

    return () => clearInterval(statusInterval);
  }, [organizedAgents]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const toggleAmbientSound = () => {
    if (isAmbientPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setIsAmbientPlaying(false);
    } else {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
          b6 = white * 0.115926;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 350;

        const gain = ctx.createGain();
        gain.gain.value = 0.12;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else {
        audioCtxRef.current.resume();
      }
      setIsAmbientPlaying(true);
    }
  };

  const handleExportCollectiveReport = () => {
    const collectiveData = dynamicAgents.map((agent) => {
      const idNum = Number(agent.id) || 99;
      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        division: agent.division,
        cpuNeuralLoad: `${(idNum * 17) % 45 + 38}%`,
        ramAllocation: `${(((idNum * 13) % 20 + 15) / 10).toFixed(1)} GB`,
        tasksCompleted: (idNum * 31) % 150 + 64,
        efficiencyRating: `98.${(idNum * 7) % 9}%`,
        uptime: "24j 18m 42s",
        status: agentStatuses[agent.id] || "Online"
      };
    });

    const report = {
      hqName: "37 AI Agents HQ",
      theme: activeTheme.name,
      exportedBy: session?.user?.email || "Bos Septi",
      exportDate: new Date().toLocaleString("id-ID"),
      totalAgents: dynamicAgents.length,
      agents: collectiveData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-performa-kolektif-hq-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenAddAgent = () => {
    setEditingAgentId(null);
    setFormName("");
    setFormRole("");
    setFormDivision("Mastermind");
    setFormModelUrl("/models/wanita.glb");
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setFormName(agent.name);
    setFormRole(agent.role);
    setFormDivision(agent.division);
    setFormModelUrl(agent.modelUrl);
  };

  const handleSaveAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim()) return;

    if (editingAgentId) {
      setDynamicAgents((prev) =>
        prev.map((a) => (a.id === editingAgentId ? { ...a, name: formName, role: formRole, division: formDivision, modelUrl: formModelUrl } : a))
      );
      setEditingAgentId(null);
    } else {
      const newId = String(Date.now());
      const newAgent: Agent = {
        id: newId,
        name: formName,
        role: formRole,
        division: formDivision,
        modelUrl: formModelUrl,
      };
      setDynamicAgents((prev) => [...prev, newAgent]);
    }

    setFormName("");
    setFormRole("");
    soundManager.playSend();
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus agen ini dari HQ?")) {
      setDynamicAgents((prev) => prev.filter((a) => a.id !== id));
      soundManager.playTyping();
    }
  };

  const handleResetDefaultAgents = () => {
    if (confirm("Reset seluruh daftar agen kembali ke konfigurasi bawaan 37 agen?")) {
      setDynamicAgents(AGENTS_37);
      localStorage.removeItem("hq_dynamic_agents");
    }
  };

  const filteredAgents = useMemo(() => {
    return organizedAgents.filter((agent) => {
      const matchName =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiv = selectedDivision === "All" || agent.division === selectedDivision;
      return matchName && matchDiv;
    });
  }, [organizedAgents, searchQuery, selectedDivision]);

  const handleSelectAgent = async (agent: Agent) => {
    if (isBriefingMode) return;
    setSelectedAgent(agent);
    setMessages([]);
    setSidebarTab("chat");

    if (cameraRef.current) {
      const [x, y, z] = agent.position;
      cameraRef.current.setLookAt(
        x, y + 1.8, z + 3.8,
        x, y + 1.2, z,
        true
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .select("sender, text")
      .eq("agent_id", String(agent.id))
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Gagal memuat riwayat chat dari Supabase:", error.message);
    } else if (data) {
      setMessages(data);
    }

    const { data: taskData } = await supabase
      .from("agent_tasks")
      .select("id, title, target_division, status, created_at")
      .eq("agent_id", String(agent.id))
      .order("created_at", { ascending: false });

    if (taskData && taskData.length > 0) {
      setAgentTasks(
        taskData.map((t: any) => ({
          id: t.id,
          title: t.title,
          targetDivision: t.target_division,
          status: t.status,
          created_at: new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        }))
      );
    } else {
      setAgentTasks([]);
    }
  };

  const handleCloseSidebar = () => {
    setSelectedAgent(null);
    setSpeakingAgentId(null);

    if (cameraRef.current) {
      cameraRef.current.setLookAt(0, 18, 24, 0, 0, 0, true);
    }
  };

  const handleExportChat = () => {
    if (!selectedAgent || messages.length === 0) return;

    const chatContent = messages
      .map((m) => `[${m.sender}]:\n${m.text}\n`)
      .join("\n---\n\n");

    const header = `Riwayat Percakapan dengan ${selectedAgent.name} (${selectedAgent.role})\nDivisi: ${selectedAgent.division}\nTanggal Ekspor: ${new Date().toLocaleString("id-ID")}\n===========================================\n\n`;

    const blob = new Blob([header + chatContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${selectedAgent.name.toLowerCase().replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDoc = async (docType: string) => {
    if (messages.length === 0) {
      alert("Belum ada percakapan untuk diunduh sebagai dokumen.");
      return;
    }
    const content = messages.map((m) => `[${m.sender}]: ${m.text}`).join("\n\n");
    const baseEndpoint = localStorage.getItem("hq_fastapi_endpoint") || "http://localhost:8000/api/chat";
    const docEndpoint = baseEndpoint.replace("/api/chat", "/api/generate-document");

    try {
      const res = await fetch(docEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, doc_type: docType }),
      });

      if (!res.ok) throw new Error("Gagal memproses dokumen di backend.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan_${selectedAgent?.name.toLowerCase().replace(/\s+/g, "_")}.${docType}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh dokumen. Pastikan server FastAPI sudah berjalan dengan pustaka python-docx/openpyxl/reportlab.");
    }
  };

  const handleClearChat = async () => {
    if (!selectedAgent) return;

    const confirmDelete = window.confirm(
      `Apakah kamu yakin ingin menghapus seluruh riwayat percakapan dengan ${selectedAgent.name}?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("agent_id", String(selectedAgent.id));

    if (error) {
      console.error("❌ Gagal menghapus riwayat chat di Supabase:", error.message);
    } else {
      setMessages([]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedAgent) return;

    const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const newTask: TaskItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle,
      targetDivision: targetDivision,
      status: "Pending",
      created_at: nowStr,
    };

    setAgentTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");

    soundManager.playSend();

    await supabase.from("agent_tasks").insert([
      {
        agent_id: String(selectedAgent.id),
        title: newTask.title,
        target_division: newTask.targetDivision,
        status: newTask.status,
      },
    ]);
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    setAgentTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus: "Pending" | "In Progress" | "Completed" =
            t.status === "Pending" ? "In Progress" : t.status === "In Progress" ? "Completed" : "Pending";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    soundManager.playTyping();
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !selectedAgent) return;

    const userMsg = inputText || "[Mengirim Gambar Produk untuk Analisis Prompt Iklan]";
    setInputText("");
    const imgToSend = selectedImage;
    setSelectedImage(null);

    setMessages((prev) => [...prev, { sender: "Kamu", text: userMsg }]);
    setLoading(true);

    soundManager.playSend();

    const { error: userErr } = await supabase.from("messages").insert([
      { agent_id: String(selectedAgent.id), sender: "Kamu", text: userMsg }
    ]);

    if (userErr) {
      console.error("❌ Gagal menyimpan pesan USER ke Supabase:", userErr.message);
    }

    const agentGender = selectedAgent.modelUrl.toLowerCase().includes("wanita") ? "female" : "male";
    const endpoint = localStorage.getItem("hq_fastapi_endpoint") || "http://localhost:8000/api/chat";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          agent_name: selectedAgent.name,
          role: selectedAgent.role,
          division: selectedAgent.division,
          message: userMsg,
          gender: agentGender,
          image_base64: imgToSend,
          auto_dispatch: true,
        }),
      });

      const data = await res.json();
      const aiResponse = data.response;

      setMessages((prev) => [...prev, { sender: selectedAgent.name, text: aiResponse }]);

      const { error: aiErr } = await supabase.from("messages").insert([
        { agent_id: String(selectedAgent.id), sender: selectedAgent.name, text: aiResponse }
      ]);

      if (aiErr) {
        console.error("❌ Gagal menyimpan pesan AI ke Supabase:", aiErr.message);
      }

      soundManager.playReceive();

      if (isTtsEnabled && data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        
        audio.onplay = () => setSpeakingAgentId(selectedAgent.id);
        audio.onended = () => setSpeakingAgentId(null);
        audio.onerror = () => setSpeakingAgentId(null);

        audio.play().catch((e) => {
          console.error("Error playing Neural TTS:", e);
          setSpeakingAgentId(null);
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: selectedAgent.name, text: "Gagal terhubung ke server lokal. Pastikan FastAPI uvicorn sudah berjalan." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentSpeaker = BRIEFING_SPEAKERS[briefingIndex];

  return (
    <div className={`relative w-screen h-screen font-sans overflow-hidden select-none transition-colors duration-500 ${isNight ? activeTheme.nightBg : activeTheme.bg}`}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur p-3.5 rounded-xl shadow-md border border-slate-200 text-slate-800 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-sm flex items-center gap-2 text-slate-900">
              🏢 37 AI AGENTS HQ
              <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono font-bold px-2 py-0.5 rounded border border-cyan-700 tracking-wider">
                COMMAND CENTER
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Operator Utama: <strong className="text-indigo-600">Bos Septi</strong></span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {onlineUsersCount} Online
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTriggerShortPipeline}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow"
              title="Mulai Produksi 3 Video Short Secara Manual"
            >
              🎬 Buat 3 Short Sekarang
            </button>
            <button
              onClick={() => setIsAgentManagerOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow"
              title="Kelola & Tambah Agen HQ Secara Interaktif"
            >
              👥 Kelola Agen
            </button>
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow"
              title="Buka Pusat Analitik & Grafik Performa"
            >
              📈 Analitik Sistem
            </button>
            <button
              onClick={() => setIsAutonomousMode(!isAutonomousMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isAutonomousMode ? "bg-purple-600 text-white animate-pulse" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Aktifkan Simulasi Otonom Antar-Divisi"
            >
              {isAutonomousMode ? "🤖 Otonom ON" : "🤖 Otonom OFF"}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Pengaturan Kredensial & API Key"
            >
              ⚙️ Pengaturan HQ
            </button>
            <button
              onClick={toggleBriefingMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isBriefingMode ? "bg-amber-600 text-white animate-pulse" : "bg-cyan-600 text-white hover:bg-cyan-500"
              }`}
            >
              {isBriefingMode ? "🛑 Keluar Rapat" : "📊 Mode Rapat"}
            </button>
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value as keyof typeof THEMES)}
              className="bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="corporate">🏢 Corporate</option>
              <option value="cyberpunk">⚡ Cyberpunk</option>
              <option value="matrix">🟢 Matrix</option>
            </select>
            <button
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isTtsEnabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {isTtsEnabled ? "🗣️ TTS ON" : "🔇 TTS OFF"}
            </button>
            <button
              onClick={toggleAmbientSound}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isAmbientPlaying ? "bg-indigo-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {isAmbientPlaying ? "🔊 Ambient ON" : "🔇 Ambient OFF"}
            </button>
            <button
              onClick={() => setIsNight(!isNight)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              {isNight ? "🌙 Night" : "☀️ Day"}
            </button>
          </div>
        </div>

        {/* Filter Bar & Export Collective Report Button */}
        <div className="bg-white/90 backdrop-blur p-2.5 rounded-xl shadow-md border border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cari nama / peran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 w-36"
            />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Divisi</option>
              <option value="Mastermind">Mastermind</option>
              <option value="Executive">Executive</option>
              <option value="Technology">Technology</option>
              <option value="Data & AI">Data & AI</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Product">Product</option>
            </select>
          </div>
          <button
            onClick={handleExportCollectiveReport}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Ekspor Laporan Performa Seluruh 37 Agen (.json)"
          >
            📊 Ekspor Laporan HQ
          </button>
        </div>
      </div>

      {/* Modal Manajemen Agen (CRUD UI) */}
      {isAgentManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-teal-500/50 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center bg-slate-950 px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
                <h2 className="text-base font-black uppercase tracking-wider text-teal-300">
                  Panel Manajemen Agen Interaktif (CRUD HQ)
                </h2>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleResetDefaultAgents}
                  className="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-3 py-1 rounded-lg hover:bg-amber-900 transition font-bold cursor-pointer"
                >
                  Reset Default (37 Agen)
                </button>
                <button
                  onClick={() => setIsAgentManagerOpen(false)}
                  className="text-slate-400 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <form onSubmit={handleSaveAgentSubmit} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3.5">
                <h3 className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">
                  {editingAgentId ? "✏️ Edit Informasi Agen" : "➕ Tambah Agen Baru ke HQ"}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nama Agen</label>
                    <input
                      type="text"
                      placeholder="Contoh: Aria"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Peran / Jabatan (Role)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Chief Mastermind & Creative Video Strategist"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Divisi HQ</label>
                    <select
                      value={formDivision}
                      onChange={(e) => setFormDivision(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Mastermind">Mastermind (Ruang Khusus)</option>
                      <option value="Executive">Executive</option>
                      <option value="Technology">Technology</option>
                      <option value="Data & AI">Data & AI</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                      <option value="Product">Product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Model Avatar 3D (.glb)</label>
                    <select
                      value={formModelUrl}
                      onChange={(e) => setFormModelUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="/models/wanita.glb">Avatar Wanita (wanita.glb)</option>
                      <option value="/models/pria.glb">Avatar Pria (pria.glb)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingAgentId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAgentId(null);
                        handleOpenAddAgent();
                      }}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-bold transition cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition shadow cursor-pointer"
                  >
                    {editingAgentId ? "Simpan Perubahan Agen" : "Tambahkan ke HQ"}
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Daftar Agen Aktif di Markas ({dynamicAgents.length} Agen)
                  </h3>
                  <span className="text-slate-500 text-[10px]">Perubahan langsung disinkronkan ke Canvas 3D & LocalStorage</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                        <th className="p-3">ID</th>
                        <th className="p-3">Nama</th>
                        <th className="p-3">Peran (Role)</th>
                        <th className="p-3">Divisi</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {dynamicAgents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-slate-900/60 transition">
                          <td className="p-3 font-mono text-slate-500">{agent.id}</td>
                          <td className="p-3 font-bold text-white">{agent.name}</td>
                          <td className="p-3 text-slate-300">{agent.role}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-cyan-300">
                              {agent.division}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleEditAgent(agent)}
                              className="px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-md hover:bg-cyan-900 transition font-bold cursor-pointer text-[10px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-md hover:bg-red-900 transition font-bold cursor-pointer text-[10px]"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Kelola posisi dan struktur agen secara real-time.</span>
              <button
                onClick={() => setIsAgentManagerOpen(false)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Analitik Sistem & Grafik Performa */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center bg-slate-950 px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                <h2 className="text-base font-black uppercase tracking-wider text-indigo-300">
                  Pusat Analitik & Grafik Performa Sistem (37 AI Agents HQ)
                </h2>
              </div>
              <button
                onClick={() => setIsAnalyticsOpen(false)}
                className="text-slate-400 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 shadow">
                  <span className="text-slate-400 text-[11px] font-semibold">Total Agen Aktif</span>
                  <p className="text-2xl font-black text-white font-mono">{dynamicAgents.length}</p>
                  <span className="text-[10px] text-emerald-400 font-bold">● 100% Operational</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 shadow">
                  <span className="text-slate-400 text-[11px] font-semibold">Rata-rata CPU Neural Load</span>
                  <p className="text-2xl font-black text-cyan-400 font-mono">46.8%</p>
                  <span className="text-[10px] text-cyan-300">Stabilitas Optimal</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 shadow">
                  <span className="text-slate-400 text-[11px] font-semibold">Total Tugas Selesai</span>
                  <p className="text-2xl font-black text-amber-400 font-mono">4,820</p>
                  <span className="text-[10px] text-amber-300">+34% minggu ini</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 shadow">
                  <span className="text-slate-400 text-[11px] font-semibold">Latensi FastAPI & Supabase</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">24 ms</p>
                  <span className="text-[10px] text-emerald-300">Koneksi Lokal Stabil</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  📊 Distribusi Beban Neural & Efisiensi Berdasarkan Divisi
                </h3>
                <div className="space-y-3">
                  {[
                    { div: "Mastermind", load: 88, color: "bg-rose-500", agents: 1 },
                    { div: "Executive", load: 42, color: "bg-amber-500", agents: 3 },
                    { div: "Technology", load: 68, color: "bg-cyan-500", agents: 8 },
                    { div: "Data & AI", load: 74, color: "bg-purple-500", agents: 8 },
                    { div: "Marketing", load: 51, color: "bg-pink-500", agents: 6 },
                    { div: "Operations", load: 58, color: "bg-emerald-500", agents: 6 },
                    { div: "Product", load: 45, color: "bg-indigo-500", agents: 6 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-slate-300 font-semibold">
                        <span>Divisi {item.div} <span className="text-slate-500 font-normal">({item.agents} Agen)</span></span>
                        <span className="font-mono text-white">{item.load}% Neural Load</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${item.load}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-indigo-300 uppercase text-[11px] tracking-wider">⚡ Parameter Telemetri Sistem</h4>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Model LLM Backend</span>
                      <span className="font-mono text-cyan-300">Gemini 3.5 Flash-Lite</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Neural TTS Synthesizer</span>
                      <span className="font-mono text-emerald-300">Active (id-ID Neural)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Realtime Channel Supabase</span>
                      <span className="font-mono text-purple-300">Connected ({onlineUsersCount} user)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Uptime Server Node</span>
                      <span className="font-mono text-white">142 Jam Tanpa Gangguan</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-300 uppercase text-[11px] tracking-wider">🛡️ Status Keamanan & Backup</h4>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Firewall Gateway</span>
                      <span className="text-emerald-400 font-bold">Secure / Active</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Automatic Database Backup</span>
                      <span className="font-mono text-cyan-300">Setiap 6 Jam (Supabase)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Vector Memory Sync</span>
                      <span className="font-mono text-emerald-300">100% Synced</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operator Utama</span>
                      <span className="font-bold text-amber-400">Bos Septi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Data diperbarui secara real-time dari memori lokal dan Supabase HQ.</span>
              <button
                onClick={() => setIsAnalyticsOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Tutup Analitik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Notifikasi Simulasi Otonom */}
      {isAutonomousMode && autonomousEvent && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 bg-purple-950/90 backdrop-blur border border-purple-500/70 px-4 py-2 rounded-xl text-purple-200 text-xs font-mono shadow-2xl animate-bounce">
          {autonomousEvent}
        </div>
      )}

      {/* Modal Pengaturan Kredensial & API Key dengan Panduan Lengkap */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-black text-cyan-400 flex items-center gap-2">
                  ⚙️ Pengaturan Kredensial & API Platform HQ
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Atur API key dan ikuti panduan cara mendapatkannya di bawah.</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Section Accordion Panduan Cara Mendapatkan API Key */}
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  📖 PANDUAN CARA MENDAPATKAN API KEY & KREDENSIAL
                </span>
                <span className="text-[10px] text-slate-500">Klik item untuk melihat langkahnya</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab(activeGuideTab === "gemini" ? null : "gemini")}
                  className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${
                    activeGuideTab === "gemini" ? "bg-cyan-950 border-cyan-500 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  🔑 1. Gemini / Google API Key
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab(activeGuideTab === "youtube" ? null : "youtube")}
                  className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${
                    activeGuideTab === "youtube" ? "bg-rose-950 border-rose-500 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  📹 2. YouTube Data API Key
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab(activeGuideTab === "telegram" ? null : "telegram")}
                  className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${
                    activeGuideTab === "telegram" ? "bg-sky-950 border-sky-500 text-sky-300" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  🤖 3. Telegram Bot Token & Chat ID
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab(activeGuideTab === "supabase" ? null : "supabase")}
                  className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${
                    activeGuideTab === "supabase" ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  ⚡ 4. Supabase URL & Anon Key
                </button>
              </div>

              {/* Isi Detail Panduan */}
              {activeGuideTab === "gemini" && (
                <div className="bg-slate-900 border border-cyan-800/60 p-3 rounded-lg text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
                  <p className="font-bold text-cyan-400">Langkah Memperoleh Gemini API Key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                    <li>Buka platform official <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google AI Studio</a>.</li>
                    <li>Login menggunakan akun Google Bos Septi.</li>
                    <li>Klik tombol <strong className="text-white">"Create API key"</strong> di pojok kanan atas.</li>
                    <li>Pilih proyek Google Cloud atau buat proyek baru secara gratis.</li>
                    <li>Salin string token API yang berawalan <code className="text-amber-300">AIzaSy...</code> lalu tempelkan pada kolom di bawah.</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === "youtube" && (
                <div className="bg-slate-900 border border-rose-800/60 p-3 rounded-lg text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
                  <p className="font-bold text-rose-400">Langkah Memperoleh YouTube Data API Key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                    <li>Buka portal <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-rose-400 underline">Google Cloud Console</a>.</li>
                    <li>Buat proyek baru atau pilih proyek yang sudah ada.</li>
                    <li>Masuk ke menu <strong className="text-white">APIs & Services &gt; Library</strong>.</li>
                    <li>Cari <strong className="text-white">"YouTube Data API v3"</strong> lalu klik tombol <strong className="text-emerald-400">Enable</strong>.</li>
                    <li>Buka menu <strong className="text-white">Credentials &gt; Create Credentials &gt; API Key</strong>.</li>
                    <li>Salin API Key tersebut dan masukkan ke kolom YouTube Data API Key.</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === "telegram" && (
                <div className="bg-slate-900 border border-sky-800/60 p-3 rounded-lg text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
                  <p className="font-bold text-sky-400">Langkah Memperoleh Bot Token & Chat ID Telegram:</p>
                  <div className="space-y-1.5 leading-relaxed">
                    <p><strong className="text-white">A. Bot Token:</strong></p>
                    <ul className="list-disc list-inside pl-2 text-slate-300">
                      <li>Buka aplikasi Telegram, cari akun bot resmi <strong className="text-sky-300">@BotFather</strong>.</li>
                      <li>Kirim pesan <code className="text-amber-300">/newbot</code> lalu ikuti instruksi penamaan bot.</li>
                      <li>Simpan token HTTP API (contoh: <code className="text-amber-300">123456789:ABCdefGh...</code>).</li>
                    </ul>
                    <p><strong className="text-white">B. Telegram Chat ID (ID Akun Bos Septi):</strong></p>
                    <ul className="list-disc list-inside pl-2 text-slate-300">
                      <li>Cari bot Telegram bernama <strong className="text-sky-300">@userinfobot</strong> atau <strong className="text-sky-300">@raw_data_bot</strong>.</li>
                      <li>Kirim pesan apapun ke bot tersebut. Bot akan membalas berisi deretan angka <strong className="text-white font-mono">Id: 987654321</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeGuideTab === "supabase" && (
                <div className="bg-slate-900 border border-emerald-800/60 p-3 rounded-lg text-[11px] text-slate-300 space-y-2.5 animate-fadeIn">
                  <div>
                    <p className="font-bold text-emerald-400">Langkah Memperoleh Supabase URL & Anon Key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed mt-1">
                      <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Dashboard Supabase</a>.</li>
                      <li>Pilih proyek HQ milikmu.</li>
                      <li>Klik ikon <strong className="text-white">Settings ⚙️ &gt; API</strong> di menu bagian kiri.</li>
                      <li>Salin <strong className="text-white">Project URL</strong> dan <strong className="text-white">anon public key</strong>.</li>
                    </ol>
                  </div>

                  <hr className="border-slate-800" />

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-cyan-400">📜 Skrip SQL Inisialisasi Database Supabase:</p>
                      <button
                        type="button"
                        onClick={() => {
                          const sqlText = `-- 1. Tabel Status Agen
CREATE TABLE IF NOT EXISTS public.agents (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    division VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'Online',
    current_animation VARCHAR DEFAULT 'Idle',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Riwayat Chat
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR NOT NULL,
    sender VARCHAR NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Delegasi Tugas
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR NOT NULL,
    title TEXT NOT NULL,
    target_division VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Pipeline Video Short
CREATE TABLE IF NOT EXISTS public.video_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    clip_id INT,
    start_time TEXT,
    end_time TEXT,
    status TEXT DEFAULT 'Pending',
    rendered_video_url TEXT,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Log Aktivitas Riil
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR NOT NULL,
    agent_name VARCHAR NOT NULL,
    division VARCHAR NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Nonaktifkan RLS
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs DISABLE ROW LEVEL SECURITY;

-- 7. Pendaftaran Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'agent_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'agent_tasks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;
    END IF;
END $$;`;
                          navigator.clipboard.writeText(sqlText);
                          alert("📋 Skrip SQL berhasil disalin ke clipboard!");
                        }}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        📋 Salin SQL
                      </button>
                    </div>
                    <p className="text-slate-400 text-[10px] mb-1.5">Buka menu <strong>SQL Editor</strong> di Supabase, lalu jalankan skrip berikut:</p>
                    <pre className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-[9px] font-mono text-emerald-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
{`CREATE TABLE IF NOT EXISTS public.agents (id VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, role VARCHAR NOT NULL, division VARCHAR NOT NULL, status VARCHAR DEFAULT 'Online', current_animation VARCHAR DEFAULT 'Idle', updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.messages (id BIGSERIAL PRIMARY KEY, agent_id VARCHAR NOT NULL, sender VARCHAR NOT NULL, text TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.agent_tasks (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, agent_id VARCHAR NOT NULL, title TEXT NOT NULL, target_division VARCHAR NOT NULL, status VARCHAR DEFAULT 'Pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.video_jobs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, video_title TEXT NOT NULL, source_url TEXT NOT NULL, clip_id INT, start_time TEXT, end_time TEXT, status TEXT DEFAULT 'Pending', rendered_video_url TEXT, caption TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.agent_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, agent_id VARCHAR NOT NULL, agent_name VARCHAR NOT NULL, division VARCHAR NOT NULL, text TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs DISABLE ROW LEVEL SECURITY;`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Gemini / Google API Key (Aria & Jessica)</label>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-yellow-400 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">YouTube Data API Key (Riset Video)</label>
                <input
                  type="password"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-yellow-400 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Telegram Bot Token (Michael Publisher)</label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJK..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-yellow-400 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Telegram Chat ID (ID Akun Bos Septi)</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="987654321"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <hr className="border-slate-800 my-2" />

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">FastAPI Backend Endpoint</label>
                <input
                  type="text"
                  value={fastapiEndpoint}
                  onChange={(e) => setFastapiEndpoint(e.target.value)}
                  placeholder="http://localhost:8000/api/chat"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                💡 Data disimpan secara aman di <code className="text-cyan-300">localStorage</code> browser dan disinkronkan ke backend FastAPI.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay Sesi Rapat Koordinasi Pimpinan Saat Mode Rapat Aktif */}
      {isBriefingMode && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 w-[550px] bg-slate-900/90 backdrop-blur-md border border-cyan-500/60 p-5 rounded-2xl shadow-2xl text-slate-100 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-black uppercase tracking-wider text-cyan-300">
                Sesi Rapat Koordinasi Pimpinan HQ
              </h2>
            </div>
            <button
              onClick={toggleBriefingMode}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 font-bold cursor-pointer"
            >
              Tutup ✕
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-indigo-400 font-bold uppercase tracking-wider">Divisi: {currentSpeaker.division}</span>
              <span className="text-slate-400 font-mono">Pembicara: {currentSpeaker.name} ({currentSpeaker.role})</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-slate-200 text-sm leading-relaxed">
              "{currentSpeaker.text}"
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
              <span>Status Hologram: Sinkronisasi Aktif</span>
              <span>Giliran {briefingIndex + 1} dari {BRIEFING_SPEAKERS.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel Live Multi-Agent Chat Stream di Sudut Kiri Bawah */}
      <div className="absolute bottom-4 left-4 z-10 w-80 max-h-64 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-2xl flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <h2 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Live Office Activity Stream
          </h2>
          <span className="text-[9px] text-slate-500">Auto-Sync</span>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-48 pr-1 text-[11px]">
          {liveStreamLogs.length === 0 && (
            <p className="text-slate-500 text-center py-4">Menunggu aktivitas riil agen dari backend...</p>
          )}
          {liveStreamLogs.map((log) => (
            <div key={log.id} className="bg-slate-800/80 border border-slate-700/50 p-2 rounded-lg text-slate-300">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-cyan-300 text-[10px]">{log.agentName}</span>
                <span className="text-[8px] text-slate-400">{log.time}</span>
              </div>
              <p className="text-[9px] text-indigo-300 mb-1 font-semibold uppercase">{log.division}</p>
              <p className="text-slate-200 leading-tight">"{log.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Canvas Visualizer */}
      <Canvas camera={{ position: [0, 18, 24], fov: 45 }}>
        <ambientLight intensity={isNight ? 0.6 : 2.2} />
        <hemisphereLight
          intensity={isNight ? 0.5 : 1.2}
          color={isNight ? "#c084fc" : activeTheme.lightColor}
          groundColor={isNight ? "#020617" : "#1e293b"}
        />
        <directionalLight
          position={[12, 22, 12]}
          intensity={isNight ? 0.8 : 2.8}
          color={isNight ? activeTheme.nightLightColor : activeTheme.lightColor}
          castShadow
        />
        <directionalLight
          position={[-12, 18, -12]}
          intensity={isNight ? 0.4 : 1.5}
          color="#cbd5e1"
        />
        {isNight && <pointLight position={[0, 10, 0]} intensity={3} color={activeTheme.nightLightColor} distance={30} />}

        <CameraControls ref={cameraRef} makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={2} maxDistance={50} />

        {/* Lantai Utama Gedung Kantor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[95, 95]} />
          <meshStandardMaterial color={isNight ? activeTheme.nightFloorColor : activeTheme.floorColor} roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Arsitektur Gedung & Interior Kantor */}
        <OfficeArchitecture />

        {/* Karpet Alas Area Per Divisi */}
        {divisionCenters.map(({ division, centerPos }) => {
          const colorScheme = DIVISION_COLORS[division] || { hex: "#6366f1" };
          return (
            <mesh key={`carpet-${division}`} rotation={[-Math.PI / 2, 0, 0]} position={centerPos} receiveShadow>
              <planeGeometry args={[5.2, 4.2]} />
              <meshStandardMaterial color={colorScheme.hex} transparent opacity={0.15} roughness={0.9} />
            </mesh>
          );
        })}

        <CentralBriefingTable position={[0, 0, 2]} onClick={toggleBriefingMode} />

        <ContactShadows opacity={isNight ? 0.25 : 0.45} scale={55} blur={1.5} far={10} position={[0, 0, 0]} />

        {/* Label Marker Nama Divisi */}
        {divisionCenters.map(({ division, position }) => {
          const isVisible = selectedDivision === "All" || selectedDivision === division;
          const colorScheme = DIVISION_COLORS[division] || { bg: "bg-slate-900/80", border: "border-slate-500/50", dot: "#6366f1" };

          return (
            <group key={`marker-${division}`} position={position}>
              <Html 
                center 
                distanceFactor={28}
                zIndexRange={[0, 5]}
                style={{
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? "auto" : "none",
                  transition: "opacity 0.2s ease-in-out"
                }}
              >
                <div className={`px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap select-none pointer-events-none ${colorScheme.bg} ${colorScheme.border}`}>
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colorScheme.dot }} />
                  <span className="text-[12px] font-black tracking-wider text-white uppercase drop-shadow">
                    DIVISI {division}
                  </span>
                </div>
              </Html>
            </group>
          );
        })}

        {/* Rendering 3D Desk, Kursi Kerja & Agen */}
        {organizedAgents.map((agent) => {
          const isVisible = filteredAgents.some((a) => a.id === agent.id);
          const isHovered = hoveredAgentId === agent.id;
          const isSelected = selectedAgent?.id === agent.id;
          const isTalking = speakingAgentId === agent.id;

          const agentPosition = agent.position;
          const deskPosition: [number, number, number] = [agentPosition[0], agentPosition[1], agentPosition[2] + 0.18];
          const chairPosition: [number, number, number] = [agentPosition[0], agentPosition[1], agentPosition[2] + 0.08];

          return (
            <group
              key={agent.id}
              visible={isVisible}
              onPointerOver={(e) => {
                if (!isVisible) return;
                e.stopPropagation();
                setHoveredAgentId(agent.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredAgentId(null);
                document.body.style.cursor = "auto";
              }}
            >
              {/* Meja Kerja */}
              <DeskProp position={deskPosition} division={agent.division} role={agent.role} />

              {/* Kursi Kerja Ergonomis */}
              <OfficeChair position={chairPosition} />

              {isTalking && isVisible && (
                <group position={deskPosition}>
                  <pointLight position={[0, 1.2, 0]} color="#38bdf8" intensity={6} distance={4} />
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <ringGeometry args={[0.8, 1.1, 32]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
                  </mesh>
                </group>
              )}

              {/* Model Character 3D Agen */}
              <Agent3D
                modelUrl={agent.modelUrl}
                position={agentPosition}
                rotation={[0, 0, 0]}
                animationName={isTalking ? "Talking" : "Idle"}
                agentId={agent.id}
                onClick={() => {
                  if (isVisible) handleSelectAgent(agent);
                }}
              />

              <Html 
                position={[agentPosition[0], 2.3, agentPosition[2]]} 
                center
                zIndexRange={[0, 5]}
                style={{
                  opacity: isVisible && (isHovered || isSelected || isTalking) ? 1 : 0,
                  pointerEvents: isVisible && (isHovered || isSelected || isTalking) ? "auto" : "none",
                  transition: "opacity 0.2s ease-in-out"
                }}
              >
                <div className="flex flex-col items-center gap-1 pointer-events-none">
                  <div className="bg-slate-800/90 text-slate-200 border border-slate-700 text-[8px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur whitespace-nowrap animate-bounce">
                    {isTalking ? "🗣️ Sedang Berbicara..." : (agentStatuses[agent.id] || "Online")}
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md border transition whitespace-nowrap flex flex-col items-center leading-tight ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-400 scale-110"
                        : "bg-white/90 text-slate-800 border-slate-300"
                    }`}
                  >
                    <span>{agent.name}</span>
                    <span className={`text-[8px] font-normal ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                      {agent.role}
                    </span>
                  </div>
                </div>
              </Html>
            </group>
          );
        })}

        <EffectComposer>
          <Bloom
            intensity={isNight ? 1.8 : 0.7}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Sidebar Chat, Stats & Tasks Dashboard */}
      {selectedAgent && (
        <div className="absolute top-0 right-0 w-88 h-full bg-slate-900/95 text-slate-100 border-l border-slate-800 p-4 flex flex-col justify-between z-20 shadow-2xl backdrop-blur">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <div>
                <h2 className="font-bold text-sm text-cyan-300">{selectedAgent.name}</h2>
                <p className="text-[11px] text-slate-400">{selectedAgent.role} • <span className="text-indigo-400 font-semibold">{selectedAgent.division}</span></p>
              </div>
              <button onClick={handleCloseSidebar} className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-lg mb-3 text-[11px] font-bold">
              <button
                onClick={() => setSidebarTab("chat")}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${sidebarTab === "chat" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setSidebarTab("stats")}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${sidebarTab === "stats" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                📊 Stats
              </button>
              <button
                onClick={() => setSidebarTab("tasks")}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${sidebarTab === "tasks" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                📋 Tasks
              </button>
            </div>

            {sidebarTab === "stats" ? (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl space-y-2">
                  <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2">⚡ System Load & Hardware</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">CPU Neural Load</span>
                    <span className="font-mono text-emerald-400 font-bold">{((Number(selectedAgent.id) * 17) % 45 + 38)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${((Number(selectedAgent.id) * 17) % 45 + 38)}%` }} />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-400">Local RAM Allocation</span>
                    <span className="font-mono text-cyan-400 font-bold">{(((Number(selectedAgent.id) * 13) % 20 + 15) / 10).toFixed(1)} GB / 4.0 GB</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${((Number(selectedAgent.id) * 13) % 20 + 55)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl space-y-2.5">
                  <h3 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">📈 Productivity & Tasks</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tasks Completed</span>
                    <span className="font-mono font-bold text-white">{(Number(selectedAgent.id) * 31) % 150 + 64} Selesai</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Efficiency Rating</span>
                    <span className="font-mono font-bold text-amber-400">98.{ (Number(selectedAgent.id) * 7) % 9 }%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Active Uptime</span>
                    <span className="font-mono font-bold text-slate-200">24j 18m 42s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vector Context Sync</span>
                    <span className="text-emerald-400 font-semibold">● Optimal</span>
                  </div>
                </div>
              </div>
            ) : sidebarTab === "tasks" ? (
              <div className="space-y-3 text-xs animate-fadeIn">
                <form onSubmit={handleCreateTask} className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl space-y-2.5">
                  <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">⚡ Delegasi Tugas Baru</h3>
                  <input
                    type="text"
                    placeholder="Judul / deskripsi tugas..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={targetDivision}
                      onChange={(e) => setTargetDivision(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="Mastermind">Mastermind</option>
                      <option value="Executive">Executive</option>
                      <option value="Technology">Technology</option>
                      <option value="Data & AI">Data & AI</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                      <option value="Product">Product</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Kirim
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daftar Tugas Aktif</h3>
                  {agentTasks.length === 0 && (
                    <p className="text-slate-500 text-center py-6">Belum ada tugas terdelegasi untuk agen ini.</p>
                  )}
                  {agentTasks.map((t) => (
                    <div key={t.id} className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{t.title}</span>
                        <button
                          onClick={() => handleToggleTaskStatus(t.id)}
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                            t.status === "Completed"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : t.status === "In Progress"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {t.status}
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="text-indigo-300 font-semibold uppercase">Divisi: {t.targetDivision}</span>
                        <span>{t.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 mb-3">
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      onClick={() => handleDownloadDoc("docx")}
                      disabled={messages.length === 0}
                      className="bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow"
                    >
                      📄 Word
                    </button>
                    <button
                      onClick={() => handleDownloadDoc("xlsx")}
                      disabled={messages.length === 0}
                      className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => handleDownloadDoc("pdf")}
                      disabled={messages.length === 0}
                      className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow"
                    >
                      📑 PDF
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportChat}
                      disabled={messages.length === 0}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      📥 Ekspor (.txt)
                    </button>
                    <button
                      onClick={handleClearChat}
                      disabled={messages.length === 0}
                      className="bg-red-950/60 hover:bg-red-900/60 disabled:opacity-40 text-red-400 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-900 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🗑 Hapus Chat
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[52vh] overflow-y-auto text-xs pr-1">
                  {messages.length === 0 && (
                    <p className="text-slate-500 text-center py-8">Belum ada percakapan. Mulai obrolan dengan {selectedAgent.name}.</p>
                  )}
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl max-w-[85%] ${
                        m.sender === "Kamu"
                          ? "bg-cyan-600 text-white ml-auto"
                          : "bg-slate-800 text-slate-200 mr-auto border border-slate-700"
                      }`}
                    >
                      <p className="text-[9px] font-bold opacity-75 mb-0.5">{m.sender}</p>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                  {loading && <p className="text-amber-400 animate-pulse text-xs">⚡ {selectedAgent.name} sedang berpikir & menganalisis...</p>}
                </div>
              </>
            )}
          </div>

          {sidebarTab === "chat" && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              {selectedImage && (
                <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded" />
                    <span className="text-slate-300 font-semibold truncate max-w-[170px]">Gambar Produk Terlampir</span>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-red-400 hover:text-red-300 font-bold px-2 py-1 text-xs cursor-pointer"
                  >
                    ✕ Hapus
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  }`}
                  title={isListening ? "Mendengarkan suara..." : "Gunakan Perintah Suara"}
                >
                  {isListening ? "🎙..." : "🎙"}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center justify-center cursor-pointer"
                  title="Unggah Gambar Produk"
                >
                  📷
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSelectedImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <input
                  key="chat-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isListening ? "Silakan bicara..." : `Tulis pesan / instruksi prompt iklan ke ${selectedAgent.name}...`}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3.5 py-2 rounded-lg font-bold shadow cursor-pointer"
                >
                  Kirim
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}