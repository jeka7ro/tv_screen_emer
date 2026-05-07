const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/DisplayScreen.js', 'utf8');

// Replace the old render logic
const target = `            if (isPlaylist && len > 3 && !isActive && !isPrev && !isNext) {
               return null;
            }

            return (
              <div 
                key={item.id || idx}
                className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-1000 ease-in-out"
                style={{ opacity: isActive ? 1 : 0 }}
              >`;

const replacement = `            if (isPlaylist && len > 3 && !isActive && !isPrev && !isNext) {
               return null;
            }

            // PERFECT CROSSFADE LOGIC:
            // The active slide jumps to z-index 20 and fades in (opacity 0 -> 1).
            // The previous slide drops to z-index 10 and STAYS opacity 1.
            // This ensures the new slide fades IN ON TOP of the old slide, preventing any "dip to black".
            const zIndex = isActive ? 20 : (isPrev ? 10 : 0);
            const opacity = isActive ? 1 : (isPrev ? 1 : 0);

            return (
              <div 
                key={item.id || idx}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out"
                style={{ opacity: opacity, zIndex: zIndex }}
              >`;

content = content.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/DisplayScreen.js', content);
