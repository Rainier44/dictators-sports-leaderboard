# October Guard Font Setup

To use the October Guard font in your leaderboard, follow these steps:

## Option 1: Local Font Files (Recommended)

1. Create a `fonts` folder in your project directory
2. Convert your October Guard font to web formats:
   - `.woff2` (best compression, modern browsers)
   - `.woff` (fallback for older browsers) 
   - `.ttf` (fallback for very old browsers)

3. Place the converted files in the fonts folder:
   ```
   your-project/
   ├── fonts/
   │   ├── october-guard.woff2
   │   ├── october-guard.woff
   │   └── october-guard.ttf
   ├── index.html
   ├── style.css
   └── script.js
   ```

## Option 2: Online Font Converter

If you don't have web font formats:

1. Go to https://cloudconvert.com/ttf-to-woff2
2. Upload your October Guard .ttf or .otf file
3. Convert to woff2, woff formats
4. Download and place in fonts folder

## Option 3: Quick Fallback

If you can't set up the custom font right now, the leaderboard will automatically fall back to Georgia serif font, which still looks great!

## Font Usage

The custom font is used for:
- Main title: "SPORTSMAN VAN HET JAAR"
- Player names in score animations
- Makes everything look more dramatic and themed!

## Troubleshooting

- Make sure font file paths match the CSS exactly
- Check browser developer tools for font loading errors
- Ensure font files are in the same directory as your HTML file