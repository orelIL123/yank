const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../native/אורחות צדיקים/full_text.txt');
const outputFile = path.join(__dirname, '../native/src/data/orhot_tzadikim_data.json');

try {
  let text = fs.readFileSync(inputFile, 'utf8');
  
  const sections = [];
  let currentTitle = '';
  let currentContent = [];
  
  const lines = text.split('\n');
  let capture = false;
  let inTOC = true; // Assume we start in TOC/Metadata
  
  // Regex for headers
  // Matches "שער [Number] - שער [Topic]"
  // Also matches "הקדמה"
  const gateRegex = /^שער\s+.+\s+-\s+שער\s+.+$/;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines if we haven't started capturing
    if (!line && !capture) continue;
    
    // Check for "הקדמה" to start the real content.
    // The TOC also has "הקדמה", but usually the real one is followed by body text.
    // In the file, the TOC block seems to have special characters or just be a list.
    // We'll assume the *second* "הקדמה" is the real one, OR we check if the line *starts* with it.
    // The grep output showed the TOC lines indented. The real headers might not be.
    
    // Let's use a simple heuristic:
    // If we hit "הקדמה" and we are inTOC, we might be starting the real content if the *next* few lines look like text.
    // BUT, simpler: The TOC is at the top. The real content follows.
    // The TOC entries are: "הקדמה", "שער הראשון...", etc.
    // The real headers are the same.
    // We can collect ALL matches, then filter out the ones that have no content.
    
    const isIntro = line === 'הקדמה';
    const isGate = gateRegex.test(line);
    
    if (isIntro || isGate) {
        // We found a header.
        // Save the previous section if it has content.
        if (currentTitle) {
            const contentStr = currentContent.join('\n').trim();
            // Filter out empty sections (likely TOC items)
            if (contentStr.length > 50) {
                sections.push({
                    title: currentTitle,
                    content: contentStr
                });
            }
        }
        
        currentTitle = line;
        currentContent = [];
        capture = true;
    } else {
        if (capture) {
            currentContent.push(line);
        }
    }
  }
  
  // Push the last section
  if (currentTitle && currentContent.length > 0) {
      const contentStr = currentContent.join('\n').trim();
      if (contentStr.length > 50) {
          sections.push({
              title: currentTitle,
              content: contentStr
          });
      }
  }
  
  console.log(`Found ${sections.length} valid sections.`);
  
  // We expect 29 sections (Intro + 28 Gates).
  // If we have less, we missed something.
  
  // To get 30 days, we need to split one.
  // Let's find the longest one.
  let longestIndex = -1;
  let maxLength = 0;
  
  sections.forEach((s, idx) => {
      if (s.content.length > maxLength) {
          maxLength = s.content.length;
          longestIndex = idx;
      }
  });
  
  if (longestIndex !== -1) {
      const longSection = sections[longestIndex];
      console.log(`Splitting longest section: ${longSection.title} (Length: ${maxLength})`);
      
      const content = longSection.content;
      const mid = Math.floor(content.length / 2);
      // Try to split at a paragraph (double newline) or at least a newline
      let splitPos = content.indexOf('\n\n', mid);
      if (splitPos === -1) splitPos = content.indexOf('\n', mid);
      if (splitPos === -1) splitPos = mid; // Fallback
      
      const p1 = {
          title: `${longSection.title} (חלק א)`,
          content: content.substring(0, splitPos).trim()
      };
      const p2 = {
          title: `${longSection.title} (חלק ב)`,
          content: content.substring(splitPos).trim()
      };
      
      sections.splice(longestIndex, 1, p1, p2);
  }
  
  // Map to final format with Day 1..30
  const result = sections.map((s, i) => ({
      day: i + 1,
      title: s.title,
      content: s.content
  }));
  
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`Wrote ${result.length} days to ${outputFile}`);

} catch (err) {
  console.error(err);
}