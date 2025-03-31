import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AvatarModel from "./avatarmodel";

const Avatar = () => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    useEffect(() => {
        const context = new AudioContext();
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256; // Nastavení velikosti FFT
        setAudioContext(context);
        setAnalyser(analyserNode);

        return () => {
            context.close();
        };
    }, []);

    const speak = (text: string) => {
        if (audioContext && analyser) {
            const utterance = new SpeechSynthesisUtterance(text);
            const synth = window.speechSynthesis;

            // Připojení výstupu k analyzátoru
            const source = audioContext.createMediaStreamSource(synth.speak(utterance) as any);
            source.connect(analyser);
        }
    };

    return (
        <div style={{ width: "100%", height: "400px" }}>
            <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                {audioContext && analyser && <AvatarModel audioContext={audioContext} analyser={analyser} />}
                <OrbitControls />
            </Canvas>
            <button onClick={() => speak("Hello, I am your virtual assistant!")} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
                Speak
            </button>
        </div>
    );
};

export default Avatar;
