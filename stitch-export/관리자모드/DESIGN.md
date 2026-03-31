# Design System Document: Precision Reliability Framework

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Watchmaker"**

In the context of the *Core Component Reliability Integrated Verification System*, we are not merely building a database; we are crafting a high-precision instrument. The "Digital Watchmaker" philosophy prioritizes absolute clarity, rhythmic spacing, and structural depth. 

Instead of a standard "flat" enterprise dashboard, this system utilizes **Layered Intellect**. We break the "template" look by eschewing traditional borders in favor of tonal shifts and sophisticated elevation. The layout uses intentional white space (negative space) to draw the eye toward critical data points, ensuring that the reliability of the components is mirrored by the reliability of the interface.

---

## 2. Colors: The Tonal Depth Strategy
We move beyond simple "blue and gray" by using a palette that mimics physical materials—frosted glass, fine paper, and deep ink.

### Palette Roles
- **Primary (`#00213f`)**: Our "Deep Ink." Reserved for high-level navigation and authoritative headers.
- **Surface & Containers**: The foundation of our depth. 
    - `surface`: The base canvas.
    - `surface_container_low`: Used for large background sections to create a "well" for content.
    - `surface_container_highest`: Used for active or highlighted interactive elements.
- **Accents**: 
    - `error` (`#ba1a1a`): High-contrast alert for component failure.
    - `on_tertiary_container`: A sophisticated "caution" tint.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts. 
*   *Example:* A data table (`surface_container_lowest`) should sit on a section background (`surface_container_low`) to define its edge through contrast, not a stroke.

### The "Glass & Gradient" Rule
To inject "soul" into the enterprise environment:
- Use **Backdrop Blur** (12px–20px) on sidebar navigation and modal overlays using a semi-transparent `surface_container_lowest`.
- Use **Subtle Gradients**: Transition from `primary` to `primary_container` for primary Action Buttons to provide a tactile, convex feel.

---

## 3. Typography: Editorial Authority
We utilize **Pretendard** not just for legibility, but as a structural element.

- **Display & Headlines (`display-lg` to `headline-sm`)**: Set with tighter letter-spacing (-0.02em) and `Font-Weight: 700`. These serve as the "anchors" of the page.
- **Body (`body-md`, `body-lg`)**: The workhorse. Maintain a generous line-height (1.6) to ensure technical data remains readable during long verification sessions.
- **Labels (`label-md`)**: Use `on_surface_variant` in `All Caps` or with increased letter-spacing for metadata headers to distinguish them from actionable data.

---

## 4. Elevation & Depth: The Layering Principle
Hierarchy is achieved through **Tonal Layering** rather than structural lines.

- **Stacking Surfaces**: 
    1. Base: `surface`
    2. Page Section: `surface_container_low` (In-set)
    3. Content Cards: `surface_container_lowest` (Raised)
- **Ambient Shadows**: For floating modals or tooltips, use "Cloud Shadows."
    - *Spec:* `0px 20px 40px rgba(24, 28, 30, 0.06)`. This mimics natural light, making elements feel like they are hovering naturally rather than being "stuck" on.
- **The Ghost Border Fallback**: If a divider is mechanically necessary, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The High-Precision Library

### Data Tables (The Core Component)
- **Structure**: Forbid horizontal divider lines. Use row stripping with a subtle shift from `surface_container_lowest` to `surface_container_low`.
- **Typography**: Numeric data should use tabular figures (monospaced numbers) for easy vertical scanning of reliability metrics.

### Buttons & Chips
- **Primary Button**: Background gradient (`primary` to `primary_container`), `lg` roundedness (0.5rem), and `on_primary` text.
- **Status Chips**: Use `error_container` for failures and `secondary_fixed` for neutral states. No borders; use a soft fill and bold `on-container` text.

### Search Bars with Auto-Suggestions
- **Style**: A `surface_container_highest` background with a `Glassmorphism` dropdown. The suggestion list should use `surface_bright` with a 12px blur to separate it from the underlying dashboard.

### Dashboard Widgets
- **The "Bento" Grid**: Use varied heights and widths based on the Spacing Scale (e.g., a 2:1 ratio for the main verification chart).
- **Charts**: Use `surface_tint` and `secondary` for data series. Avoid high-saturation "rainbow" charts; stay within the professional blue/gray spectrum.

### Modals & Overlays
- **Backdrop**: `on_surface` at 40% opacity with a heavy blur.
- **Container**: `surface_container_lowest` with `xl` (0.75rem) corner radius.

---

## 6. Do's and Don'ts

### Do:
- **Use "Breathing Room":** Apply at least `spacing-10` (2.25rem) between major functional modules.
- **Intentional Asymmetry:** In the dashboard, align text to the left but allow charts to bleed to the right edge of their containers to create a modern, editorial feel.
- **Micro-Interactions:** When hovering over a data row, shift the background to `primary_fixed` at 30% opacity for a soft, sophisticated "active" state.

### Don't:
- **Don't use 100% Black:** Always use `on_surface` (`#181c1e`) for text to maintain a premium, ink-like softness.
- **Don't use Rounded Corners on everything:** Use `none` (0px) or `sm` (0.125rem) for technical data cells to maintain a "scientific" look, reserving `lg` and `xl` for containers and buttons.
- **Don't Use Dividers:** If you feel the urge to draw a line, increase the `spacing` scale instead. Trust the white space.

---

## 7. Signature Layout: The Sidebar
The sidebar is not a drawer; it is a **Monolith**.
- Use `primary` (`#00213f`) as the background.
- Active states should use a "pill" indicator in `primary_fixed_dim`, creating a high-contrast, high-end navigation experience that feels like a physical switchboard.