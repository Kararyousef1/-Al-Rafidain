from PIL import Image
import os

# Paths
input_path = os.path.join('public', 'icons', 'icon-512.png')
output_path = os.path.join('public', 'favicon.ico')

# Check if source exists
if not os.path.exists(input_path):
    print(f"Error: Source file not found at {input_path}")
    exit(1)

# Open the 512x512 image
img = Image.open(input_path)

# Create favicon.ico with multiple sizes (16x16, 32x32, 48x48)
# ICO format supports multiple sizes in one file
sizes = [16, 32, 48]
icons = []

for size in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    icons.append(resized)

# Save as ICO (the first image in the list will be the default)
icons[0].save(
    output_path,
    format='ICO',
    sizes=[(s, s) for s in sizes],
    append_images=icons[1:],
)

print(f"✅ favicon.ico created successfully at: {output_path}")
print(f"   Sizes included: {', '.join(f'{s}x{s}' for s in sizes)}")