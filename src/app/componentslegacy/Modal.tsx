"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventItem = {
  date: string;
  title: { en: string; es: string };
  registerLink?: string;
  featuring: string[];
  description?: string; // Optional field for future use
};

interface AdminModalProps {
  rawJSON: string;
  setRawJSON: (value: string) => void;
  setEvents: (events: EventItem[]) => void;
}

export default function AdminModal({ rawJSON, setRawJSON, setEvents }: AdminModalProps) {
  const [show, setShow] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [eventData, setEventData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_PIN = "2025"; // Change or load from env variable
const router = useRouter();
  // Shift+E shows login prompt
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "E") {
        setShow(true);
        setAuthenticated(false);
        setPinInput("");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Load initial data
  useEffect(() => {
    try {
      const parsed = JSON.parse(rawJSON);
      setEventData(parsed.events || []);
    } catch (err) {
      console.error("Failed to parse events JSON:", err);
    }
  }, [rawJSON]);

  const handleAuth = () => {
    if (pinInput === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      alert("Incorrect PIN");
    }
  };

  // Input change handlers
  const updateEvent = (index: number, key: keyof EventItem, value: string) => {
    const updated = [...eventData];

    if (key === "date" || key === "registerLink" || key === "description") {
      updated[index][key] = value;
    }
    setEventData(updated);
  };

  const updateTitle = (index: number, lang: "en" | "es", value: string) => {
    const updated = [...eventData];
    updated[index].title[lang] = value;
    setEventData(updated);
  };
  const addFeaturing = (eventIdx: number) => {
  setEventData(prev => {
    const updated = [...prev];
    const feat = [...updated[eventIdx].featuring, ""];
    updated[eventIdx] = { ...updated[eventIdx], featuring: feat };
    return updated;
  });
};

const removeFeaturing = (eventIdx: number, nameIdx: number) => {
  setEventData(prev => {
    const updated = [...prev];
    const feat = [...updated[eventIdx].featuring];
    feat.splice(nameIdx, 1);
    updated[eventIdx] = { ...updated[eventIdx], featuring: feat };
    return updated;
  });
};

const updateFeaturing = (eventIdx: number, nameIdx: number, value: string) => {
  setEventData(prev => {
    const updated = [...prev];
    const feat = [...updated[eventIdx].featuring];
    // keep internal spaces; just strip accidental leading spaces
    feat[nameIdx] = value.replace(/^\s+/, "");
    updated[eventIdx] = { ...updated[eventIdx], featuring: feat };
    return updated;
  });
};

  const addEvent = () => {
    setEventData([
      ...eventData,
      { date: "TBD", title: { en: "New Event", es: "Nuevo Evento" }, registerLink: "", featuring: [] },
    ]);
  };

  const removeEvent = (index: number) => {
    const updated = [...eventData];
    updated.splice(index, 1);
    setEventData(updated);
  };

  const handleSave = async () => {
    const cleaned = eventData.map(ev => ({
      ...ev,
      featuring: ev.featuring
        .map(n => n.trim()) // keep internal spaces, remove ends
        .filter(Boolean),   // drop empty strings
    }));

    const newData = { events: cleaned };
    const jsonString = JSON.stringify(newData);

    setEvents(cleaned);
    setRawJSON(jsonString);

    const payload = {
      id: 6,
      value: jsonString, // double stringified in the outer JSON
    };

    try {
      setLoading(true);
      const response = await fetch("https://softball-science-data.vercel.app/locker/6", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save events");
        
      setShow(false);
      router.push("/#events");
      // ✅ Success: show alert
    //   alert("✅ Events saved successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
      alert("Error: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-white text-black w-11/12 max-w-5xl p-6 rounded-lg shadow-xl">
        {!authenticated ? (
          // ---------------- Admin PIN Prompt ----------------
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-black">Admin Login</h2>
            <p className="text-black text-xl">Enter admin PIN to continue</p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className=" p-2 w-40 text-center rounded  border-2 border-purple-500"
            />
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAuth}
                className="px-10 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Enter
              </button>
            </div>
          </div>
        ) : (
          // ---------------- Events Editor ----------------
          <><div className="">
            <h2 className="text-xl font-bold mb-4 text-black">Edit Events - Amount:<span className="text-purple-500 p-2 bold text-[30px]  mt-[-10x] inline-block">{eventData.length}</span></h2>

            <div id="eventEditList" className="space-y-6 overflow-y-auto max-h-[70vh] p-6 bg-[#b0b0b0] rounded custom-scrollbar">
              {eventData.map((event, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-2 bg-purple-900 flex justify-between items-center flex-wrap">
                  <div className="flex justify-between items-center flex-wrap w-full">
                    <h3 className="font-bold text-[34px] border-b-2 border-yellow">Event {index + 1}</h3>
                    <button
                      onClick={() => removeEvent(index)}
                      className="bg-red-600 py-2 px-10 rounded text-white text-sm hover:bg-red-700 mt-1"
                    >
                      Remove Event {index + 1}
                    </button>
                  </div>

                  <label className="text-white block text-sm font-medium w-[48%]">
                    Date <span className="hero-highlight">(MM/DD/YYYY)</span>:
                    <input
                      placeholder="MM/DD/YYYY"
                      name="date"
                      type="text"
                      value={event.date}
                      onChange={(e) => updateEvent(index, "date", e.target.value)}
                      className="w-full border rounded p-1 mt-1 text-black"
                    />
                  </label>
                  
                  <label className="text-white block text-sm font-medium w-[48%]">
                    Register Link <span className="hero-highlight">( Only Shows if event is in the future )</span>:
                    <input
                      placeholder="URL"
                      name="registerLink"
                      type="text"
                      value={event.registerLink || ""}
                      onChange={(e) => updateEvent(index, "registerLink", e.target.value)}
                      className="w-full border rounded p-1 mt-1 text-black"
                    />
                  </label>

                  <label className="text-white block text-sm font-medium  w-[48%]">
                    Title <span className="hero-highlight">(English)</span>:
                    <input
                      placeholder="Title in English"
                      name="title-en"
                      type="text"
                      value={event.title.en}
                      onChange={(e) => updateTitle(index, "en", e.target.value)}
                      className="w-full border rounded p-1 mt-1 text-black"
                    />
                  </label>

                  <label className="text-white block text-sm font-medium  w-[48%]">
                    Title <span className="hero-highlight">(Spanish)</span>:
                    <input
                      placeholder="Título en español"
                      name="title-es"
                      type="text"
                      value={event.title.es}
                      onChange={(e) => updateTitle(index, "es", e.target.value)}
                      className="w-full border rounded p-1 mt-1 text-black"
                    />
                  </label>
                  <label className="text-white block text-sm font-medium w-full">
                    Description <span className="hero-highlight">(Optional)</span>:
                    <input
                      placeholder="Describe the event"
                      name="featuring"
                      type="text"
                      value={event.description || ""}
                      onChange={(e) => updateEvent(index, "description", e.target.value)}
                      className="w-full border rounded p-1 mt-1 text-black"
                    />
                  </label>
                  <div className="text-white block text-sm font-medium w-full">
  <div className="flex items-center justify-between">
    <span>Featuring</span>
    <button
      type="button"
      onClick={() => addFeaturing(index)}
      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
    >
      + Add name
    </button>
  </div>

  <div className="space-y-2 mt-2">
    {event.featuring.length === 0 && (
      <div className="text-white/80 text-xs">No names yet.</div>
    )}

    {event.featuring.map((name, i) => (
      <div key={i} className="flex gap-2 items-start ml-2">
        <input
          type="text"
          placeholder="First Last"
          value={name}
          onChange={(e) => updateFeaturing(index, i, e.target.value)}
          className="flex-1 border rounded p-1 mt-1 text-black"
        />
        <button
          type="button"
          onClick={() => removeFeaturing(index, i)}
          className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700 mt-1"
        >
          Remove name
        </button>
      </div>
    ))}
  </div>
</div>
                </div>
              ))}
            </div>

            <button
              onClick={addEvent}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ➕ Add Event
            </button>

            
          </div>
          <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
}
