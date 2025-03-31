import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const AvatarModel = ({ analyser }: { audioContext: AudioContext; analyser: AnalyserNode }) => {
    const { scene } = useGLTF("/child_blend.fbx"); // Ensure the model is in the public folder
    //const { scene } = useFBX("/child_blend.fbx"); // Ensure the model is in the public folder
    const mouthRef = useRef<any>(null);

    // Animace rtů na základě zvuku
    useFrame(() => {
        if (analyser && mouthRef.current) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // Získání průměrné hodnoty frekvence
            const avgFrequency = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            // Nastavení blendshape pro pohyb rtů (např. "MouthOpen")
            if (mouthRef.current.morphTargetInfluences) {
                mouthRef.current.morphTargetInfluences[0] = avgFrequency / 256; // Normalizace hodnoty
            }
        }
    });

    return <primitive object={scene} scale={1.5} ref={mouthRef} />;
};

export default AvatarModel;
// AvatarModel.tsx
