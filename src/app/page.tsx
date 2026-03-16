"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Bridge from "@/components/bridge";
import SideNav from "@/components/SideNav";
import WorkoutTracker from "@/components/WorkoutTracker";
import ReviewScreen from "@/components/ReviewScreen";
import IOBay from "@/components/IOBay";
import Corkboard from "@/components/Corkboard";
import QuoteBoard from "@/components/QuoteBoard";
import Winboard from "@/components/Winboard";
import ProjectBoard from "@/components/ProjectBoard";
import SovereignTodo from "@/components/SovereignTodo";
import SharedLists from "@/components/SharedLists";
import IdentityMirror from "@/components/IdentityMirror";
import DailyBrief from "@/components/DailyBrief";
import ReadyRoom from "@/components/ReadyRoom";
import AdminBoard from "@/components/AdminBoard";
import WishBoard from "@/components/WishBoard";
import RecycleBin from "@/components/RecycleBin";
import ExerciseHub from "@/components/ExerciseHub";

import { useSession, signIn, signOut } from "next-auth/react";

import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";

export type Module =
  | "BRIDGE"
  | "READY_ROOM"
  | "SHARED_LISTS"
  | "PROJECTS"
  | "TODO"
  | "CORKBOARD"
  | "MIRROR"
  | "IO_BAY"
  | "RECYCLE_BIN"
  | "WISHES"
  | "ADMIN"
  | "SETTINGS";

const VERSION = "17.1.1-TWIN-PLUS-FORENSIC-RESTORE";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sourceLayer?: string;
  vote?: number | null;
  type?: "holodeck_turn" | "standard";
  speakerId?: string;
  speakerLabel?: string;
}

export interface ChatSegment {
  id: string;
  messages: Message[];
  attachments: any[];
  isSealed: boolean;
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  scopeId: string;
  segments: ChatSegment[];
  updatedAt: string;
}

export const VoiceButton = ({
  onTranscript,
  isTyping,
  size = "md",
}: {
  onTranscript: (text: string) => void;
  isTyping?: boolean;
  size?: "sm" | "md";
}) => {
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startListening = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Neural Voice Ingestion not supported.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();

      const source =
        audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);

      analyzerRef.current.fftSize = 64;
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);

      const updateFrequency = () => {
        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          setAudioData(new Uint8Array(dataArray));
          animationRef.current = requestAnimationFrame(updateFrequency);
        }
      };

      updateFrequency();

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);

      recognition.onend = () => {
        setIsListening(false);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        setAudioData(new Uint8Array(0));
      };

      recognition.onresult = (event: any) => {
        onTranscript(event.results[0][0].transcript);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isListening && (
        <div className="flex gap-[2px] items-center h-4">
          {Array.from(audioData)
            .slice(0, 8)
            .map((val, i) => (
              <div
                key={i}
                className="w-[3px] bg-accent shadow-[0_0_8px_var(--accent)] rounded-full transition-all duration-75"
                style={{ height: `${Math.max(15, (val / 255) * 100)}%` }}
              />
            ))}
        </div>
      )}

      <button
        type="button"
        onClick={startListening}
        disabled={isTyping}
        className={`rounded-full transition-all flex items-center justify-center ${
          isListening
            ? "bg-red-500 shadow-[0_0_20px_#ef4444]"
            : "text-white/20 hover:text-accent"
        } ${size === "sm" ? "p-1" : "p-2"}`}
      >
        <svg
          className={size === "sm" ? "h-4 w-4" : "h-5 w-5"}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    </div>
  );
};

export default function Page() {

  const { data: session, status } = useSession();

  const [activeModule, setActiveModule] = useState<Module>("BRIDGE");
  const [apiKey, setApiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");

  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [wishes, setWishes] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isExercisesOpen, setIsExercisesOpen] = useState(false);
  const [isDailyBriefOpen, setIsDailyBriefOpen] = useState(false);

  const [isKernelReady, setIsKernelReady] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [manifestOwner, setManifestOwner] = useState<string | null>(null);

  // Dynamic priority: 1. Google Session 2. Local Manifest Owner 3. Fallback
  const userName = session?.user?.name || manifestOwner || "User";

  /*
  ------------------------------------------------------------------
  TWIN+ KERNEL BOOT
  ------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function start() {
      console.log("[Twin+] Kernel boot starting");

      try {
        await twinPlusKernel.init();

        // Attempt to extract owner name from the local twin manifest
        if (twinPlusKernel.ready()) {
            const res = await fetch('/api/sync?file=twin_manifest.json');
            if (res.ok) {
                const manifest = await res.json();
                if (manifest.owner_email) {
                    const emailPrefix = manifest.owner_email.split('@')[0];
                    const rawName = emailPrefix.split('.')[0];
                    setManifestOwner(rawName.charAt(0).toUpperCase() + rawName.slice(1));
                }
            }
        }

        console.log("[Twin+] Kernel initialized");
      } catch (err) {
        console.error("[Twin+] Kernel init failed", err);
      }

      if (mounted) {
        setIsKernelReady(true);
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isKernelReady) {
    return (
      <div className="h-dvh w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" />
          <p className="system-text text-accent animate-pulse tracking-[0.4em]">
            INITIALIZING NEURAL LINK...
          </p>
        </div>
      </div>
    );
  }

  /*
  ------------------------------------------------------------------
  MAIN UI
  ------------------------------------------------------------------
  */

  return (
    <div className="h-dvh w-screen overflow-hidden bg-black text-white flex flex-col relative">

      {isExercisesOpen && (
        <ExerciseHub onDismiss={() => setIsExercisesOpen(false)} />
      )}

      {isDailyBriefOpen && (
        <DailyBrief
          tasks={tasks}
          apiKey={apiKey}
          searchKey={searchKey}
          userName={userName}
          onDismiss={() => setIsDailyBriefOpen(false)}
        />
      )}

      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-black z-30">

        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-2 text-accent hover:bg-accent/10 rounded-md transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
            </button>
            <div
                className="text-accent font-black tracking-widest cursor-pointer text-sm md:text-base"
                onClick={() => setActiveModule("BRIDGE")}
            >
                TEMPUS VICTA
            </div>
        </div>

        <div className="flex items-center gap-4">

          <button
            onClick={() => setIsDailyBriefOpen(true)}
            className="text-xs text-accent font-bold"
          >
            BRIEF
          </button>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
              {VERSION}
            </span>
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
          </div>
        </div>

      </header>

      <div className="flex flex-grow overflow-hidden relative">

        {/* MOBILE OVERLAY */}
        {isNavOpen && (
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsNavOpen(false)}
            />
        )}

        <aside className={`
            fixed inset-y-0 left-0 transform ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
            z-50 w-64 border-r border-white/10 bg-black shrink-0
        `}>
          <SideNav
            activeModule={activeModule}
            onModuleChange={(m) => {
                setActiveModule(m);
                setIsNavOpen(false);
            }}
          />
        </aside>

        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-black">

          {activeModule === "BRIDGE" && (
            <Bridge
              tasks={tasks}
              calendar={calendar}
              onNavigate={setActiveModule as any}
            />
          )}

          {activeModule === "READY_ROOM" && (
            <ReadyRoom
              chats={chats}
              setChats={setChats}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
              projects={tasks.filter(t => t.status === 'IN_PROGRESS').map(t => ({ id: t.id, title: t.title }))}
              tasks={tasks}
              calendar={calendar}
              apiKey={apiKey}
              searchKey={searchKey}
              assistantName="J5"
              userName={userName}
            />
          )}

          {activeModule === "SHARED_LISTS" && <SharedLists />}

          {activeModule === "PROJECTS" && (
            <ProjectBoard
              externalTasks={tasks}
              setTasks={setTasks}
            />
          )}

          {activeModule === "TODO" && (
            <SovereignTodo
              externalTasks={tasks}
              setTasks={setTasks}
            />
          )}

          {activeModule === "CORKBOARD" && (
            <Corkboard
              externalNotes={notes}
              setNotes={setNotes}
              userName={userName}
            />
          )}

          {activeModule === "MIRROR" && (
            <IdentityMirror
              externalTasks={tasks}
              setExternalTasks={setTasks}
              externalQuotes={quotes}
              setQuotes={setQuotes}
              userName={userName}
            />
          )}

          {activeModule === "IO_BAY" && <IOBay />}

          {activeModule === "RECYCLE_BIN" && <RecycleBin />}

          {activeModule === "WISHES" && (
            <WishBoard
              wishes={wishes}
              onWish={(text) => setWishes(prev => [{ id: Date.now().toString(), text, status: 'PENDING', timestamp: new Date().toISOString() }, ...prev])}
            />
          )}

          {activeModule === "ADMIN" && (
            <AdminBoard
              wishes={wishes}
              setWishes={setWishes}
              setTasks={setTasks}
            />
          )}

        </main>
      </div>

      <footer className="h-10 border-t border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-neon-green" />
            <span className="system-text text-[8px] text-white/40 uppercase tracking-widest">
              Neural Link: Stable
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="system-text text-[8px] text-white/40 uppercase tracking-widest">
              Twin+ Substrate: Active
            </span>
          </div>
        </div>
        <div className="system-text text-[8px] text-white/20 uppercase tracking-[0.3em]">
          PROTOTYPE_ENV_SOVEREIGN_V2
        </div>
      </footer>
    </div>
  );
}
