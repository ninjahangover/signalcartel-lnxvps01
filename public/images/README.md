# Background Images Directory

## Adding the Luxury Skyline Background

To add your luxury skyline background image to the Signal Cartel landing page:

1. **Place your background image in this directory** (`/public/images/`)
2. **Name the file** `background01.jpg` (or update the filename in the code)
3. **Recommended specifications:**
   - **Format**: JPG, PNG, or WebP
   - **Resolution**: 1920x1080 or higher (4K recommended for best quality)
   - **Aspect Ratio**: 16:9 or wider
   - **File Size**: Optimize for web (under 2MB recommended)
   - **Content**: Luxury city skyline, preferably with night lighting or golden hour

## Current Implementation

The landing page (`src/app/page.tsx`) is configured to display:
- Background image: `/images/background01.jpg`
- With a gradient overlay for better text readability
- Fallback gradient background if image doesn't load
- Responsive positioning (center bottom)

## Alternative Background Options

If you have multiple background images, you can also add:
- `luxury-skyline-mobile.jpg` - for mobile optimization
- `luxury-skyline-dark.jpg` - for dark theme variant
- `luxury-skyline.webp` - for better compression

## Usage in Code

The background is implemented in `src/app/page.tsx` with:
```css
background-image: linear-gradient(overlay), url('/images/background01.jpg')
```

To change the image, either:
1. Replace `background01.jpg` with your image file, or
2. Update the filename in the code at line 11 of `src/app/page.tsx`