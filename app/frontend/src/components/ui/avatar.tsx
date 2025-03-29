//import React, { useRef } from "react";
//import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const AvatarModel = () => {
    const { scene } = useGLTF("./assets/brunette.glb"); // Nahraďte cestu k vašemu modelu
    return <primitive object={scene} scale={1.5} />;
};

const Avatar = () => {
    return (
        <div style={{ width: "100%", height: "400px" }}>
            <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <AvatarModel />
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default Avatar;
