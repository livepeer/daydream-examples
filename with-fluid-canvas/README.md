# FluidCanvas Demo

An interactive WebGL-based fluid simulation built with React, TypeScript, and Vite. This demo showcases real-time fluid dynamics with customizable parameters and visual effects.

https://github.com/user-attachments/assets/38b8a811-a500-4767-86a0-4bd99900f1bd

## Features

- **Real-time fluid simulation** using WebGL shaders
- **Interactive controls** for mouse and touch input
- **Customizable parameters**:
  - Color selection
  - Splat force intensity
  - Curl effects
  - Velocity dissipation
  - Glow effects
- **Visual enhancements**:
  - Bloom lighting effects
  - Sunrays rendering
  - Background streaming capabilities
- **Media streaming** - Canvas can be captured as MediaStream for recording

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

4. **Interact with the simulation:**
   - Click and drag on the canvas to create fluid effects
   - Use the control panel to adjust simulation parameters
   - Experiment with different colors and forces

## Tech Stack

- **React 19** with functional components and hooks
- **TypeScript** for type safety
- **WebGL** for high-performance graphics
- **Vite** for fast development and building
- **Custom shaders** for fluid dynamics simulation
