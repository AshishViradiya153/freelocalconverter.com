# Brutalist Directory UI Prompt

Copy and paste the prompt below into any LLM (like Gemini, GPT-4, or Claude) to recreate this exact UI.

---

## The Prompt

"Build a high-end, responsive 'Brutalist' Directory UI using React, Tailwind CSS, and Lucide React icons. The design should feel raw, technical, and high-contrast, inspired by early web aesthetics and modern brutalist design.

### Core Design Principles:
1. **Palette:** Strict high-contrast. Background: `#FFFFFF` (White), Text: `#000000` (Black), Primary Accent: `#FACC15` (Yellow-400).
2. **Typography:** Use a bold Monospace font (like JetBrains Mono or Space Mono) for everything. All headings should be uppercase with tight tracking (`tracking-tighter`).
3. **Borders & Shadows:** Use thick 4px black borders for all containers and 2px for smaller elements. Use 'Hard Shadows' instead of soft blurs: `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`.
4. **Interactions:** Buttons should have a 'pressed' effect where they translate down and right while the shadow disappears (`active:translate-x-1 active:translate-y-1 active:shadow-none`).

### Layout Structure:
1. **Main Container:** A max-width container with a 4px black border and a large 8px hard shadow.
2. **Header:** A full-width section with a Yellow-400 background and a 4px bottom border. Title should be massive (up to `text-8xl` on desktop), uppercase, and multi-line.
3. **Sidebar (Filter):** 
   - On Desktop: A fixed-width left sidebar with a 4px right border.
   - On Mobile: Stacks on top with a 4px bottom border.
   - Includes a search input and a list of category buttons. Category buttons should turn black with white text when active.
4. **Grid System:** A responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) with `auto-rows-fr` to ensure cards don't stretch vertically if there's only one.
5. **Cards:** 
   - White background, 4px bottom and right borders.
   - Hover state: Background changes to Yellow-400.
   - Icon container: A white box with a 2px border and a 4px hard shadow.
   - Content: Large uppercase title, bold description, and a full-width 'EXECUTE' button at the bottom.

### Technical Requirements:**
- Use `motion` (framer-motion) for smooth layout transitions and entry animations.
- Ensure the grid is perfectly aligned with the borders (no gaps between cards).
- Implement a 'No Results' empty state with a brutalist warning icon."

---

## Tailwind Configuration (for shadcn users)

To get the exact look with shadcn, add these to your `tailwind.config.js` or `globals.css`:

### 1. Hard Shadow Utility
In your `globals.css`:
```css
@layer utilities {
  .shadow-brutal {
    box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
  }
  .shadow-brutal-sm {
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
  }
}
```

### 2. Typography & Theme
In your `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderWidth: {
        '4': '4px',
      },
    },
  },
}
```

### 3. shadcn Component Overrides
When using shadcn components (Button, Input, Card), always apply these classes to match the style:
- `rounded-none` (Brutalist design rarely uses rounded corners)
- `border-4 border-black`
- `shadow-brutal`
- `hover:bg-yellow-400 hover:text-black`

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Tool } from './types';
import { CATEGORIES, TOOLS } from './constants';

const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = (Icons as any)[name];
  if (!LucideIcon) return <Icons.HelpCircle className={className} />;
  return <LucideIcon className={className} />;
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-yellow-400 selection:text-black">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <header className="p-8 md:p-12 border-b-4 border-black bg-yellow-400">
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl md:text-8xl font-black uppercase leading-none tracking-tighter break-words"
            >
              TOOL <br /> DIRECTORY <br /> V1.0.0
            </motion.h1>
          </header>

          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Sidebar Filter */}
            <aside className="w-full lg:w-80 border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-white p-6 md:p-8 space-y-8 shrink-0">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Icons.Search size={14} /> Search_
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Type to filter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-black p-3 outline-none focus:bg-black focus:text-white transition-colors placeholder:text-black/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Icons.Filter size={14} /> Categories_
                </label>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-left p-3 border-2 border-black font-bold transition-all whitespace-nowrap lg:whitespace-normal flex justify-between items-center group ${
                        activeCategory === cat.id 
                          ? 'bg-black text-white translate-x-1 -translate-y-1 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]' 
                          : 'hover:bg-yellow-400'
                      }`}
                    >
                      <span>{cat.name.toUpperCase()}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 border border-current ${activeCategory === cat.id ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content Grid */}
            <div className="flex-grow bg-black">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                <AnimatePresence mode="popLayout">
                  {filteredTools.map((tool: Tool) => (
                    <motion.div
                      layout
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border-b-4 border-r-4 border-black p-6 md:p-8 hover:bg-yellow-400 transition-colors group cursor-crosshair flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="p-4 border-2 border-black bg-white group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <IconComponent name={tool.icon} className="w-8 h-8" />
                        </div>
                        <div className="text-[10px] font-black bg-black text-white px-2 py-1 uppercase tracking-tighter">
                          {tool.category}
                        </div>
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <h3 className="text-2xl md:text-3xl font-black leading-none uppercase tracking-tighter">
                          {tool.name}
                        </h3>
                        <p className="text-sm font-bold leading-tight text-black/70">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-8">
                        <button className="w-full py-4 border-4 border-black font-black uppercase hover:bg-black hover:text-white transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2">
                          EXECUTE_TOOL <Icons.ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Empty state if no tools found */}
                {filteredTools.length === 0 && (
                  <div className="col-span-full bg-white p-20 text-center border-b-4 border-black">
                    <Icons.AlertTriangle className="mx-auto w-16 h-16 mb-4" />
                    <h2 className="text-4xl font-black uppercase">No tools found_</h2>
                    <p className="mt-4 font-bold">Try adjusting your search or category filters.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                      className="mt-8 px-8 py-4 border-4 border-black font-black uppercase hover:bg-black hover:text-white transition-all"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-[1600px] mx-auto px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-50">
        <div>© 2026 BRUTAL_TOOLS_DIRECTORY</div>
        <div className="flex gap-8">
          <a href="#" className="hover:underline">Privacy_Policy</a>
          <a href="#" className="hover:underline">Terms_Of_Service</a>
          <a href="#" className="hover:underline">Github_Repo</a>
        </div>
      </footer>
    </div>
  );
}
/* BRUTALIST UI CORE STYLES */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --primary: 48 96% 53%; /* Yellow-400 */
    --primary-foreground: 0 0% 0%;
    --border: 0 0% 0%;
    --ring: 0 0% 0%;
    --radius: 0px; /* Brutalist = No rounded corners */
  }
}

@layer utilities {
  /* Hard Shadows (The Brutalist Signature) */
  .shadow-brutal {
    box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
  }
  
  .shadow-brutal-sm {
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
  }

  /* Pressed State for Buttons */
  .active-brutal:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
  }

  /* No Scrollbar for Horizontal Filter */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

/* Typography Overrides */
h1, h2, h3, h4, button, label {
  text-transform: uppercase;
  letter-spacing: -0.05em;
  font-weight: 900;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-display: "Space Grotesk", sans-serif;
  --font-serif: "Playfair Display", serif;
  --font-outfit: "Outfit", sans-serif;
}

