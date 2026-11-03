"use client";

import { FlowingGradient, Shader } from "shaders/react";

export type EndGlowProps = {
  colors: [string, string, string, string];
  speed: number;
  distortion: number;
  onUnavailable: () => void;
};

/**
 * The WebGPU part, in its own chunk (loaded only when the end screen comes near).
 * `shaders` draws on the GPU with WebGPU; FlowingGradient is a slow, organic blend of four colours.
 * Telemetry is switched off: the library would otherwise report GPU stats from a few visitors to its makers.
 */
export default function EndGlowShader({ colors, speed, distortion, onUnavailable }: EndGlowProps) {
  const [a, b, c, d] = colors;
  return (
    <Shader className="size-full" disableTelemetry colorSpace="srgb" onUnavailable={onUnavailable}>
      <FlowingGradient colorA={a} colorB={b} colorC={c} colorD={d} speed={speed} distortion={distortion} />
    </Shader>
  );
}
