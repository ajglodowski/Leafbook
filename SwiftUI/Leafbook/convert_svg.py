#!/usr/bin/env python3
from PIL import Image, ImageDraw
import math

# Create a 1024x1024 transparent image
size = 1024
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Scale factor from SVG viewBox (120x120) to 1024x1024
scale = size / 120

def scale_point(x, y):
    return (x * scale, y * scale)

def scale_coord(coord):
    return coord * scale

# Convert SVG polygon points to PIL format
# Bookmark ribbon: points="82,0 82,28 90,22 98,28 98,0"
bookmark_points = [
    scale_point(82, 0),
    scale_point(82, 28),
    scale_point(90, 22),
    scale_point(98, 28),
    scale_point(98, 0),
]
draw.polygon(bookmark_points, fill='#5a7a52')

# Transform coordinates for the leaf group
# Original: translate(54, 56) rotate(-15)
center_x, center_y = scale_point(54, 56)
rotation_angle = -15  # degrees

def transform_point(x, y):
    # Rotate around origin
    rad = math.radians(rotation_angle)
    x_rot = x * math.cos(rad) - y * math.sin(rad)
    y_rot = x * math.sin(rad) + y * math.cos(rad)
    # Then translate
    return (center_x + x_rot * scale, center_y + y_rot * scale)

# Draw the leaf path with proper Bezier curves
# Path: M 0,-42 C 18,-34 27,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -27,-14 -18,-34 0,-42 Z

def cubic_bezier_point(t, p0, p1, p2, p3):
    """Calculate point on cubic Bezier curve at parameter t (0 to 1)"""
    mt = 1 - t
    return (
        mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
        mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
    )

def draw_bezier_curve(curves, segments=50):
    """Draw Bezier curves and return polygon points for filling"""
    all_points = []

    for curve in curves:
        p0, p1, p2, p3 = curve
        for t in range(segments + 1):
            t_normalized = t / segments
            x, y = cubic_bezier_point(t_normalized, p0, p1, p2, p3)
            all_points.append(transform_point(x, y))

    return all_points

# Define the Bezier curves for the leaf path
# M 0,-42 - starting point
# C 18,-34 27,-14 24,8 - first curve: from (0,-42) to (24,8) with control points (18,-34), (27,-14)
# C 22,24 12,38 0,46 - second curve: from (24,8) to (0,46) with control points (22,24), (12,38)
# C -12,38 -22,24 -24,8 - third curve: from (0,46) to (-24,8) with control points (-12,38), (-22,24)
# C -27,-14 -18,-34 0,-42 - fourth curve: from (-24,8) to (0,-42) with control points (-27,-14), (-18,-34)

curves = [
    ((0, -42), (18, -34), (27, -14), (24, 8)),
    ((24, 8), (22, 24), (12, 38), (0, 46)),
    ((0, 46), (-12, 38), (-22, 24), (-24, 8)),
    ((-24, 8), (-27, -14), (-18, -34), (0, -42)),
]

leaf_points = draw_bezier_curve(curves, segments=100)
draw.polygon(leaf_points, fill='#5a7a52')

# Draw lines with green color #8fae87
line_color = '#8fae87'
line_width = int(scale_coord(2.2))

# Midrib
p1 = transform_point(0, -40)
p2 = transform_point(0, 44)
draw.line([p1, p2], fill=line_color, width=line_width)

# Vein pair 1
line_width_vein = int(scale_coord(1.6))
p1 = transform_point(0, -18)
p2 = transform_point(-19, -6)
draw.line([p1, p2], fill=line_color, width=line_width_vein)

p1 = transform_point(0, -18)
p2 = transform_point(19, -6)
draw.line([p1, p2], fill=line_color, width=line_width_vein)

# Vein pair 2
p1 = transform_point(0, 6)
p2 = transform_point(-21, 18)
draw.line([p1, p2], fill=line_color, width=line_width_vein)

p1 = transform_point(0, 6)
p2 = transform_point(21, 18)
draw.line([p1, p2], fill=line_color, width=line_width_vein)

# Stem
stem_width = int(scale_coord(2.5))
p1 = transform_point(0, 44)
p2 = transform_point(3, 56)
draw.line([p1, p2], fill='#5a7a52', width=stem_width)

# Save as PNG with transparency
img.save('AppIcon-Dark.png', 'PNG')
print('Successfully created transparent PNG with PIL')
