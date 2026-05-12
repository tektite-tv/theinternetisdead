## v1.56.36

- Enabled the bundled ChatGPT stored themes so selecting them applies their visual customizer overlay immediately.
- Restored root `stored-themes/index.json` with the existing ChatGPT stored theme paths while keeping the ChatGPT folder index intact.
- Updated extension version to `1.56.36`.

## v1.56.35

- Updated extension version to `1.56.35`.
- Simplified the popup header so the top rectangle only shows the icon and tool dropdown.
- Hid the old header title/subtitle text while preserving the JS metadata updates, because apparently even text ghosts need somewhere to haunt.

## v1.56.34 - Rename Blue Ocean stored theme

- Renamed `stored-themes/chatgpt-ocean-blue.json` to `stored-themes/chatgpt-blue-ocean.json`.
- Updated the bundled stored theme label/id/display name to **chatgpt-blue-ocean**.
- Updated `stored-themes/index.json` so the dropdown lists **chatgpt-blue-ocean**.
- Updated extension version to `1.56.34`.

## v1.56.31 - Stored theme switching replaces old theme

- Changing the Stored Themes dropdown now resets the active page customizer state before applying the newly selected stored theme.
- Stored theme application now replaces the previous page theme instead of merging over it, so old texture filters, static colors, blend modes, and other settings do not linger.
- Updated extension version to `1.56.31`.

## v1.56.30 - Add ChatGPT Ocean Blue stored theme

- Added `stored-themes/chatgpt-ocean-blue.json` to `stored-themes/index.json` so it appears in the **Stored Themes** dropdown.
- Normalized the bundled theme label to **chatgpt-ocean-blue** instead of using the old conversation title/export timestamp.
- Set the theme to ChatGPT origin matching, so it applies across `https://chatgpt.com` instead of one saved conversation URL.
- Updated extension version to `1.56.30`.

## v1.56.29 - Stored themes show consistently

- Changed **Stored Themes** so bundled themes listed in `stored-themes/index.json` are visible even when their saved `pageKey` came from another page.
- Active-page matches sort first; other-page themes get an `other page` suffix instead of silently vanishing.
- Updated bundled theme labels to prefer the theme's saved display name instead of only the filename.
- Regenerated `stored-themes/index.json` from the actual JSON files in `/stored-themes/`.
- Changed manifest resources to allow `stored-themes/*.json`, so newly bundled theme JSON files do not need one more ceremonial manifest sacrifice.

## v1.56.27 - Hueshift leaves black/white alone by default

- Changed default hueshift back to filtering page color via hue rotation, so black, white, and gray stay neutral instead of getting tinted.
- Changed the checkbox under **Cycle inversion with 5-second fades** to **Apply hueshift to black/white too**.
- Leaving that checkbox off keeps monochrome page areas unchanged; turning it on uses the stronger overlay-style tint so those neutral areas can be affected too.
- Kept **Enable Inversion** and **Cycle inversion** behavior intact.


## v1.56.26 - Optional black/white hue-cycle stop

- Added **Include black/white in hueshift cycle** under **Cycle inversion with 5-second fades**.
- Left it **off by default**, so normal hueshift stays chromatic instead of wandering through monochrome like a cursed photocopier.
- Kept **Enable Inversion** and **Cycle inversion** behavior intact.
- Saved the new option per page and included it in saved customizer themes.

## v1.56.25

- Added a **Texture Color Mode** dropdown under **Texture Filter** with Normal, Grayscale, Chromatic Aberration, Inverted, Sepia, Terminal Green, Vaporwave, Acid Wash, Deep Fried, and Washed Out modes.
- Moved texture color treatment into the runtime CSS filter stack so `cobblestone.png` and `tv-wood.png` stay unedited in `/assets/`, because individually grayscaling textures is exactly the kind of tiny file crime that becomes tomorrow's haunting.
- Texture color mode saves per page, exports with saved page themes, resets with page customization, and applies immediately alongside the existing texture intensity/scale controls.

## v1.56.24

- Rebranded visible extension/menu names from `tektite` / `tektites` to `theinternetisdead`.
- Updated the manifest name/title, popup menu labels, Settings visibility labels, favorite context-menu title, reader aria label, and exported/stored theme metadata.
- Kept old stored theme `tektite-customizer-page-theme` compatibility while exporting new themes as `theinternetisdead-customizer-page-theme`, because breaking saved themes would be a very browser-extension-shaped tragedy.

## v1.56.23

- Added a **Default Menu To Open When Clicking Extension Button** dropdown to the bottom of **Settings**.
- Added a saved `defaultSuiteTool` preference so the popup can open on the selected menu instead of pretending one dropdown state is destiny.
- Kept **Settings** as the default first-open menu unless the user changes the new dropdown.


## v1.56.22

- Renamed **Main Menu** to **Settings**.
- Made `theinternetisdead-customizer` the default popup menu.
- Moved **Settings** to the bottom of the dropdown list.

## v1.56.21

- Fixed the Main Menu visibility rows so menu names are no longer crushed into useless ellipses.
- Visibility labels now use full readable menu names with their checkbox aligned cleanly on the right.

## v1.56.20

- Moved the browser/tab audio slider UI into its own `theinternetisdead-browser-controls` dropdown menu.
- Replaced the old Main Menu volume block with checked-by-default menu visibility toggles. Unchecking a menu now hides it from the dropdown without deleting the feature, because apparently even dropdowns need social boundaries.
- Kept `stored-themes/index.json` unchanged because no new stored theme JSON files were added.

## v1.56.7



## v1.56.19

- Rebuilt the **Static Color Filter** control into one combined UI block.
- Made the visible color value itself the color picker target and color indicator.
- Moved the clear **×** inside the same control instead of leaving UI shrapnel beside it.

## v1.56.18

- Added a **Broken Features** entry to the extension menu picker.
- Moved the disabled **YouTube Fullscreen CRT Mode (BROKEN)** checkbox into that menu as the only visible control there.
- Kept the checkbox disabled so the broken experiment stays quarantined instead of wandering back into the customizer like a raccoon with commit access.

## v1.56.17

- Replaced the **Clear Static Color Filter** text button with a compact **×** button beside the static color picker.
- Moved **Enable Hueshift** and **Enable Inversion** down above **Save Page Theme**.
- Removed the grayed-out broken YouTube Fullscreen CRT checkbox from the popup UI.

## v1.56.16

- Changed the **Stored Themes** dropdown default label to **Unchanged**.
- After a stored theme is selected, the top dropdown option becomes **Reset Theme**, which clears the active page customization using the same reset flow as **Reset Page Theme**.

## v1.56.15

- Hid the `.json` extension in the **Stored Themes** dropdown labels while still loading the actual files from `stored-themes/index.json`.

## v1.56.14

- Renamed **Saved Themes** to **Stored Themes** and made option labels come from `stored-themes/index.json` entries.

## v1.56.13

- Changed **Save Page Theme** exports to suggest only a JSON filename, letting the user choose any folder in the save dialog instead of suggesting `saved-themes/`.
- Kept the per-page saved theme dropdown behavior intact.

## v1.56.11

- Added a **Stored Themes** dropdown at the top of `theinternetisdead-customizer`.
- Added a **Save Page Theme** button above **Reset Page Theme**.
- Clicking **Save Page Theme** opens the browser save dialog and suggests a JSON filename.
- Added the `downloads` permission for the JSON theme export flow.
- Scaled the popup UI down to 50% using a global popup zoom so the layout, spacing, colors, and control relationships stay visually the same, just smaller.
- Kept the internal panel proportions intact instead of rewriting every button and slider by hand, because that way madness lives.

## v1.56.6

- Made every `theinternetisdead-customizer` setting save and apply to the active page immediately.
- Added a content-script readiness check so existing tabs can receive live customizer updates after the extension reloads.
- Made **Reset Page Theme** instantly clear the active page visuals, not just storage.
- Selecting a texture filter from the dropdown now applies it immediately; the `+` button still works as a backup for the same action.

## v1.56.4

New pages now start with all customizer visual effects disabled until settings are saved for that exact page URL.

This stops fresh pages from inheriting stale/global hueshift, inversion, static color, texture, or CRT settings from older builds. The extension popup still opens normally, but the active page is treated as clean unless it already has its own saved customizer state.

# theinternetisdead-extension-suite

## v1.56.5

- Renamed **Reset Visual Effects** to **Reset Page Theme**.
- Reset now removes only the active page's saved customizer settings, leaving other pages alone.

## v1.56.2

- Hid the popup-level scrollbar that appeared when the theinternetisdead-storage-reader menu drawer expanded.
- Kept the internal storage-reader lime scrollbars visible for the actual storage lists.

## v1.56.0

- Merged `theinternetisdead-storage-reader` into the suite dropdown.
- Added a `theinternetisdead-storage-reader` panel for current-tab `localStorage` and `sessionStorage`.
- Keeps values hidden by default behind a Show/Hide control for safer screen recording.
- Added Storage Reader icons to the suite bundle.

One combined MV3 Edge/Chrome extension suite with a spiral emoji icon.

## Included tools

- `Main Menu`  
  Browser-wide media volume slider with per-tab subsliders for tabs where HTML audio/video is detected.

- `theinternetisdead-customizer`  
  Renamed from `tektite-theinternetisalive`. Hueshift overlay, inversion, and inversion cycling.

- `theinternetisdead-favorites-menu`  
  Native right-click submenu populated from your Edge favorites/bookmarks bar.

- `theinternetisdead-reader-extension`  
  Renamed from `microsoft-david-reader-extension`. Includes a suite icon and a simple selected-text speech reader using Microsoft David when available.

## Install in Microsoft Edge

1. Open `edge://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `theinternetisdead-extension-suite` folder
5. Use the popup dropdown to switch between tool panels.

## Notes

The suite uses one popup with a top dropdown. The favorites menu appears in the native right-click menu as **theinternetisdead Favorites**.

The native context menu cannot be styled like the popup because browser APIs continue their long war against joy.


## v1.1.0 fix

Fixed duplicate native context menu errors like:

`Cannot create item with duplicate id tektite-suite-favorites-root`

The favorites menu rebuild is now queued/debounced, waits for `contextMenus.removeAll()`, and safely ignores transient creation errors instead of filling Edge's extension error page with digital smoke.


## v1.2.0 fix

Restored the `theinternetisdead-reader-extension` controls that got flattened during the suite merge:

- popup text box
- ▶ Play button
- ■ Stop button
- selected-text reading button
- word highlight option
- page word highlighting while reading selected page text

The reader panel is still renamed from `microsoft-david-reader-extension`, but now it behaves much closer to the actual reader tool instead of being a sad two-button skeleton wearing a reader hat.


## v1.3.0 UI polish

Moved the tool dropdown into the top header rectangle.

The header icon, title, and subtitle now update to match the selected tool:

- `theinternetisdead-customizer`
- `theinternetisdead-hover-reader`
- `theinternetisdead-favorites-menu`
- `theinternetisdead-reader-extension`


## v1.4.0 popup layout fix

Fixed the top header layout:

- header icon is constrained to fit inside the square
- dropdown now reliably switches the active tool panel
- removed redundant inner title/icon rectangles from each dashed panel
- the top header is now the only tool identity display


## v1.5.0 reader restoration

Restored the original floating reader behavior from `microsoft-david-reader-extension` inside the suite:

- selecting page text now shows the floating ▶ / ■ control bubble
- the stop button expands on hover like the original
- reader controls can be dragged and remember position
- current/read-word highlighting uses the CSS Highlight API again
- highlight CSS is restored:
  - read-so-far: lime text with translucent lime background
  - current word: lime text on black background

The suite popup reader panel still exists, but the page selection controls are back where they belong.


## v1.6.0 reader popup cleanup

Removed the bottom two rectangles from the `theinternetisdead-reader-extension` popup panel:

- removed the popup text box
- removed the purple explanatory note box

The reader panel now keeps the controls only. The Play button reads selected page text, matching the floating reader behavior.


## v1.7.0 customizer additions

Added two new `theinternetisdead-customizer` checkboxes below **Cycle inversion every 3 seconds**:

- Enable scanlines
- Scale viewport to 4:3 CRT frame

The CRT frame mode wraps the page viewport in a centered 4:3-ish TV frame with a dark border, lime/purple outline, and inner screen shadow. Some websites may resist this because modern layouts are an unholy stack of position-fixed tantrums.


## v1.8.0 CRT frame refinement

Improved the **Scale viewport to 4:3 CRT frame** mode:

- added a fake old-TV speaker grille panel on the left
- added a control panel on the right with two channel-style knobs
- reduced the viewport width so the side hardware has room to exist
- hid scrollbars for the framed viewport and surrounding page

So now it looks more like an actual TV shell and less like a webpage in witness protection.


## v1.9.0 CRT furniture fix

The TV side panels are now real injected DOM elements instead of relying on `html::before` / `html::after`.

This should make the left speaker grille and right two-knob control panel actually appear in the black surround area. The previous CSS-only version could get swallowed by page stacking and layout rules, because naturally the web is a haunted layer cake.


## v1.10.0 scrollbar hiding fix

CRT mode now hides scrollbars more aggressively:

- native browser scrollbars
- WebKit scrollbars
- Radix/custom scrollbar elements
- common custom scrollbar classes
- dynamically recreated scrollbar elements via observer/interval cleanup

This is necessary because some sites, including ChatGPT, use custom scrollbar DOM elements instead of normal browser scrollbars, because apparently one scrollbar implementation was not enough suffering.


## v1.11.0 CRT Effects merge

Combined the old scanlines and 4:3 frame toggles into one checkbox:

- **CRT Effects**

CRT Effects now includes:

- 4:3 TV frame
- stronger scanlines
- inner viewport vignette
- RGB chromatic aberration / drift
- hidden scrollbar cleanup

The scanlines and vignette now sit inside the viewport effect instead of acting like a separate little checkbox with commitment issues.


## v1.12.0 CRT viewport ratio

Changed **CRT Effects** viewport from 4:3 to **16:9** while keeping the same height target.

The TV shell now behaves more like a widescreen CRT/old monitor treatment instead of a squarer classroom-cart box.


## v1.13.0 safer scrollbar hiding

Removed the aggressive DOM scrollbar suppression that hid elements based on classes/roles like `scrollbar`, `thumb`, or Radix scroll areas.

CRT mode now hides scrollbars with CSS-only browser scrollbar rules:

- `scrollbar-width: none`
- `-ms-overflow-style: none`
- `::-webkit-scrollbar { display: none }`

This avoids deleting or hiding page DOM elements, which is better because modern apps use random scrollbar-looking divs for actual layout and interaction. Naturally.


## v1.14.0 non-invasive CRT mode

Changed CRT Effects to overlay-only mode.

Removed the page-breaking parts:

- no fixed `body`
- no resized `body`
- no forced internal scrollbar hiding
- no restructuring the page layout

CRT Effects now draws the 16:9 frame, side panels, scanlines, vignette, and RGB drift as a fixed pointer-events-none overlay above the page. It does not remove actual scrollbars or alter scroll containers. This is less physically “inside the TV,” but it should stop breaking web apps, which is apparently frowned upon.


## v1.15.0 responsive CRT scaling

CRT Effects now scales the page down while preserving the browser's normal aspect ratio.

Responsive behavior:

- desktop: page scales down enough to make room for left/right TV panels
- narrower screens: side panels shrink
- small screens: side panels hide and the page scale increases to avoid crushing the viewport
- resize events recalculate the scale and side panel widths

This is more invasive than pure overlay mode because the page content is wrapped in a temporary shell while CRT Effects is enabled, but it avoids forcing 4:3 or 16:9 dimensions. It keeps the real browser viewport ratio and scales the whole page uniformly.


## v1.16.0 CRT wood cabinet texture

Packed `assets/tv-wood.png` into the extension.

CRT Effects now tiles the black background behind the scaled viewport with the wood panel texture, with a dark radial overlay so it still reads like a CRT/TV cabinet instead of a picnic table having a software crisis.


## v1.17.0 wood texture loading fix

Fixed `assets/tv-wood.png` not showing.

The previous version referenced the image as `url("assets/tv-wood.png")`, which pages interpret relative to their own domain. This version:

- declares `assets/tv-wood.png` in `web_accessible_resources`
- uses `chrome.runtime.getURL("assets/tv-wood.png")`
- injects the resolved extension URL into the CSS variable

So the wood texture should actually load inside content pages instead of asking the website to provide your TV cabinet texture like some kind of confused furniture subscription.


## v1.18.0 CRT wood layer fix

Fixed the wood texture only appearing behind one speaker/control panel.

The wood texture is now a dedicated full-screen injected `.tektite-crt-wood` layer inside the CRT decor overlay, behind the viewport frame and both side panels. This avoids relying on the page/html background, which websites love to override because apparently a background can’t just mind its business.


## v1.19.0 CRT layering fix

Fixed the page being hidden under the wood texture.

CRT Effects now uses three explicit layers:

1. `tektite-suite-customizer-crt-cabinet`
   - wood texture background
   - left speaker panel
   - right knob panel

2. `tektite-suite-customizer-page-shell`
   - the actual webpage, scaled down
   - fills the full scanline/vignette screen area

3. `tektite-suite-customizer-crt-overlay`
   - scanlines
   - vignette
   - RGB chromatic aberration

So the wood cabinet sits behind the page, while the scanlines/vignette sit above it. Revolutionary concept: the picture should be in front of the cabinet. Apparently we had to rediscover television.


## v1.20.0 CRT screen fill fix

Fixed the page and scanline/vignette layer not filling the whole inside of the green outline.

The CRT layout no longer scales a full 100vw/100vh page down from the center. It now computes one exact responsive screen rectangle:

- page shell uses that rectangle
- scanline/vignette/RGB overlay uses that same rectangle
- side panels sit outside it
- the green outline wraps the same screen area the page fills

So the page should fill the full interior of the CRT screen instead of sitting inset inside it like a tiny frightened browser postcard.


## v1.21.0 true scaled-browser CRT viewport

Fixed CRT Effects so the page behaves like a normal browser viewport scaled into the CRT screen.

Previous v1.20 behavior:
- changed the page shell to the smaller screen rectangle
- caused sites to reflow as if the browser viewport was smaller

New behavior:
- page shell remains `100vw x 100vh`
- the full normal browser viewport is visually scaled down into the CRT screen
- the scanline/vignette overlay uses the same scaled screen rectangle
- the browser aspect ratio is preserved
- side panels occupy the leftover space

This should feel like the actual browser output is being shown on a smaller TV screen, instead of the website being shoved into a smaller layout container like a raccoon in a lunchbox.


## v1.22.0 CRT screen padding fix

Removed the black padding that was blocking the full viewport.

The page shell no longer uses a real border, because borders consume content area like tiny CSS termites. The CRT frame is now drawn with outer `box-shadow` rings on the overlay screen instead:

- black CRT frame ring
- lime outline
- purple outline
- glow

The scaled browser viewport now fills the whole inside of the green outline, while the scanlines/vignette still cover that same exact screen area.


## v1.23.0 CRT edge mask

Added a 5px black outline around the outside of the CRT viewport.

This masks the left/right chromatic aberration flicker where the RGB drift was leaking past the screen edge. The page shell also gets a matching scaled black edge so tiny anti-aliased slivers are covered.


## v1.24.0 rounded CRT edge mask fix

Moved the 5px black edge mask into its own dedicated overlay element:

`tektite-crt-edge-mask`

This ring sits above the scanlines/RGB drift and uses the same rounded screen rectangle as the viewport, so it should mask the chromatic aberration leak around the rounded corners instead of drawing behind the screen on some unhelpful layer.


## v1.25.0 scanline corner clipping fix

Fixed the scanline/vignette/RGB layer poking out underneath the rounded black edge mask.

Changes:

- the CRT screen overlay now has `overflow: hidden`
- the overlay is clipped with a rounded `clip-path`
- scanline/vignette/RGB pseudo-elements are inset by 5px
- their radius is reduced to sit behind the black edge mask

So the RGB/scanline layer should stay inside the rounded screen instead of leaking under the corners like cursed light pollution.


## v1.26.0 side panel material fix

Restored the left/right CRT hardware panels to black/gray.

`tv-wood.png` now stays on the cabinet background only. The speaker grille and right knob/control panel no longer use the wood texture.


## v1.27.0 YouTube Fullscreen CRT Mode

Renamed the customizer checkbox from **CRT Effects** to **YouTube Fullscreen CRT Mode**.

The CRT cabinet/page-scaling effect is now gated:

- checkbox must be enabled
- current site must be `youtube.com` / `youtu.be`
- a fullscreen element must be active
- the fullscreen element must be a video/player or contain a video/player

Outside YouTube fullscreen video, the checkbox can stay enabled but the CRT effect will not appear. This keeps the rest of the internet from being shoved into a wooden haunted television when it did not consent.


## v1.28.0 theinternetisdead.org fullscreen embeds

Allowed **YouTube Fullscreen CRT Mode** on `theinternetisdead.org` as well.

The CRT effect can now activate when:

- the checkbox is enabled
- the site is `youtube.com`, `youtu.be`, or `theinternetisdead.org`
- a fullscreen video/player/embed is active

Fullscreen detection now also accepts fullscreen iframes and embed-like video containers, so embedded videos on `theinternetisdead.org` can summon the haunted cabinet instead of being denied at the velvet rope like a common div.


## v1.29.0 fullscreen-safe CRT mode

Fixed YouTube kicking out of fullscreen when CRT mode activates.

Cause:
- the old CRT effect wrapped/moved page DOM into a shell
- browsers cancel fullscreen when the fullscreen element is moved or reparented
- naturally, the browser reacts like you touched a holy relic

Fix:
- fullscreen CRT mode no longer wraps or moves the page/player DOM
- it applies a temporary class to the current fullscreen element
- the fullscreen element is visually scaled into the CRT screen rectangle
- cabinet / side panels / scanlines / vignette remain overlay layers

This should stop YouTube and embedded fullscreen videos from exiting fullscreen when the CRT mode activates.


## v1.30.0 fullscreen video targeting fix

Fixed CRT mode showing audio but no video, with the CRT layers scaled down.

Cause:
- v1.29 scaled the fullscreen root/player element itself
- that caused the CRT layers and player/video layout to get dragged into the same transform mess

Fix:
- fullscreen root is no longer transformed
- CRT cabinet/overlay layers are mounted inside the fullscreen element
- the actual `video` element is targeted directly
- the video is positioned into the CRT screen rectangle
- overlays stay above the video without being scaled by the video/player root

This should keep fullscreen active, keep the video visible, and stop the cabinet/layers from being miniaturized into the void.


## v1.31.0 YouTube media surface targeting

Fixed fullscreen CRT mode still showing no video.

The extension now targets the visible media surface around the video, not just the raw `<video>` element:

- `.html5-video-container`
- `.ytp-player-content`
- `#movie_player`
- `.html5-video-player`
- fallback to the video parent / video itself

The media surface is forced into the CRT signal rectangle, while the video is forced to fill that surface with `object-fit: contain`.

Controls/captions are raised above the CRT overlay where possible. YouTube’s player DOM remains a bureaucratic hydra, but this should stop the signal area from being an expensive black rectangle with audio.


## v1.32.0 video container targeting fix

Fixed the likely cause of the CRT signal area still showing no video.

The previous version could apply both the media-surface class and video class to the same `<video>` element. That made CSS fight itself: the element was treated as both the container and the contained video, because apparently one bug was not humiliating enough.

Changes:

- media surface is now always a container around the video, never the video itself
- the actual video fills that container
- YouTube `.html5-main-video` inline offsets are overridden more directly
- class targeting reapplies shortly after fullscreen entry because YouTube mutates the player DOM after fullscreen
- content script now runs in all frames for embedded fullscreen cases

This should give the CRT signal area an actual picture instead of yet another elegant black rectangle with sound.


## v1.36.0 revert to working video targeting + safe cabinet background

Reverted the fullscreen video targeting back to the v1.32-style approach, because that was the version where the actual video showed up in the signal area.

Then added the wood cabinet background as a low z-index fullscreen child:

- cabinet/backdrop layer: z-index 1
- video/media target: z-index 3
- CRT scanline/vignette overlay: z-index 5
- controls/captions: z-index 7

The side panels stay black/gray. The wood texture only paints the fullscreen cabinet background behind the video, instead of covering the media surface like a cursed furniture eclipse.


## v1.37.0 normal-scale YouTube chrome + video-only signal

Changed fullscreen CRT mode so YouTube chrome stays normal scale:

- title/top chrome stays at normal fullscreen scale
- timeline/player controls stay at normal fullscreen scale
- only the video media surface gets positioned into the CRT signal rectangle
- video fills that signal surface with `object-fit: contain`
- cabinet/wood background stays behind the media surface
- scanline/vignette/RGB overlay stays above the video
- controls/chrome stay above the overlay

This avoids moving the entire `#movie_player` / `.html5-video-player` stack, because doing that makes YouTube’s UI and video vanish into yet another divine punishment made of CSS.


## v1.38.0 direct inline fullscreen video positioning

The previous class-based approach still lost to YouTube's live fullscreen player layout on some runs.

This build reapplies direct inline `style.setProperty(..., "important")` rules every 250ms while CRT mode is active:

- the actual media surface is fixed into the CRT signal rectangle
- the actual video fills that surface
- title/timeline/player chrome stay normal fullscreen scale and above the CRT overlay
- cabinet/wood background stays behind the media
- CRT scanline/vignette overlay stays above the video

It also stores/restores previous inline styles when CRT mode exits, because yes, we are now doing tiny CSS surgery on a moving hydra.


## v1.39.0 stale visual state fix

Fixed the page turning purple by default from stale stored customizer state.

Older builds stored visual effect toggles in `chrome.storage.local`, so a newly loaded build could inherit old values and apply hueshift/CRT behavior before the user touched anything.

Changes:

- added **Reset Page Theme** button to `theinternetisdead-customizer`
- reset now clears only the active page customization entry and leaves other page customizations alone
- content script no longer lets legacy `customizerScanlines` / `customizerCrtFrame` resurrect CRT mode
- hueshift overlay is hidden by default in CSS before state is applied

If a specific page still opens purple after installing this version, open that page and click **Reset Page Theme** once in the customizer panel.


## v1.40.0 WeakMap restore fix

Fixed the YouTube error:

`crtPreviousStyle.clear is not a function`

Cause:

`crtPreviousStyle` was a `WeakMap`, and `WeakMap` does not support `.clear()`.

Fix:

Changed `crtPreviousStyle` to a normal `Map`, then restored saved inline styles from its entries before clearing it. This stops the content script from crashing while exiting or resetting CRT fullscreen styling.


## v1.41.0 canvas signal rendering

Stopped trying to reposition YouTube's actual video DOM.

CRT fullscreen mode now renders the active `<video>` into a dedicated canvas:

`tektite-suite-customizer-crt-signal-canvas`

Layer order:

- cabinet / wood background
- canvas signal showing the video
- CRT scanlines/vignette/RGB overlay
- YouTube title/timeline/controls above overlay

This avoids fighting YouTube's fullscreen player layout while still showing the moving video inside the CRT signal area. The audio still comes from the original YouTube video; the visible signal is the canvas copy. Browser sorcery, but at least it stops asking YouTube's DOM for permission to exist.


## v1.43.0 restore visible canvas signal

Reverted the v1.42 change that mounted the canvas and overlay inside YouTube's player stack. That caused only the panels to remain visible because YouTube swallowed the injected signal layers.

This version keeps the proven v1.41 layer placement:

- cabinet mounted on fullscreen root
- canvas signal mounted on fullscreen root
- CRT overlay mounted on fullscreen root
- YouTube chrome promoted above the overlay

It keeps the performance improvement:

- uses `requestVideoFrameCallback` when available
- draws canvas at lower internal resolution

So the video signal should reappear, with less lag, without feeding the canvas to YouTube's player-stack cave goblin.


## v1.44.0 YouTube chrome visibility fix

The player controls were still clickable but not visible. That means YouTube chrome existed, but CRT overlay / YouTube autohide styling was burying or fading the visible UI.

Changes:

- lowered CRT overlay one layer
- forces YouTube top title/chrome to `position: fixed` at the top of fullscreen
- forces YouTube bottom controls/timeline to `position: fixed` at the bottom of fullscreen
- forces opacity/visibility/display on title, controls, gradients, progress bar, captions, and spinner
- removes `ytp-autohide` from the fullscreen player stack while CRT mode is active
- re-applies this during CRT mode because YouTube keeps re-mutating its chrome

The controls should now be visible above the CRT overlay instead of merely haunt-clickable.


## v1.45.0 visible fallback YouTube controls

Added a custom visible CRT control overlay because YouTube's own controls were clickable but not visibly painting above the CRT layers.

New overlay includes:

- fullscreen title bar
- play/pause button
- current time / duration
- visible progress bar
- click-to-seek on the progress bar

It controls the real underlying YouTube video, while the CRT canvas continues to display the video signal.

This avoids depending on YouTube's native chrome rendering correctly through its autohide and stacking maze. We now have our own visible controls, because the real ones decided to become ghosts with hover cursors.


## v1.46.0 exit fullscreen control

Added an exit fullscreen button to the bottom right of the custom CRT controls.

The button uses fullscreen exit APIs in this order:

- `document.exitFullscreen()`
- `document.webkitExitFullscreen()`
- `document.mozCancelFullScreen()`
- `document.msExitFullscreen()`

So CRT mode now has a visible escape hatch instead of making the user hunt for YouTube's native controls through a haunted overlay stack.


## v1.47.0 fullscreen exit and cleanup fix

Added CRT fullscreen double-click behavior:

- double-click anywhere while CRT fullscreen mode is active exits fullscreen
- the custom exit button uses the same cleanup path

Also added stronger cleanup when fullscreen closes:

- stops canvas drawing loops
- clears CRT timers
- restores inline styles
- removes fullscreen target classes
- hides cabinet / overlay / canvas / custom controls
- moves injected CRT elements back to `document.documentElement`
- removes the CRT fullscreen class from `<html>`

This should stop stuck CRT layers from hanging around after exiting fullscreen, because apparently UI cleanup is not optional despite what every haunted overlay has ever believed.


## v1.48.0 broken CRT option disabled

Kept **YouTube Fullscreen CRT Mode** visible in the `theinternetisdead-customizer` panel, but disabled it:

- checkbox is greyed out
- red **(Broken)** tag appears beside it
- popup forces the stored CRT setting off
- content script hard-disables CRT fullscreen behavior even if stale storage still exists

This preserves the UI breadcrumb without letting the broken fullscreen experiment keep attacking YouTube like a CSS raccoon.


## v1.49.0 disabled CRT comments

Added comments marking the broken **YouTube Fullscreen CRT Mode** as intentionally disabled:

- popup comment above the greyed-out checkbox
- source comment above `shouldShowCrtEffects()`

The experimental code remains in place for future repair, but activation stays blocked.


## v1.50.0 remove theinternetisdead-hover-reader

Removed `theinternetisdead-hover-reader` from the suite:

- removed the popup dropdown option
- removed the hover-reader panel
- removed hover-reader popup wiring
- removed `content-hover-reader.js`
- removed the content script reference from `manifest.json`

The rest of the suite remains intact.


## v1.52.0 Main Menu volume controls

Added a **Main Menu** option at the top of the popup dropdown:

- browser-wide media volume slider at the top
- per-tab volume sliders for tabs with detectable HTML audio/video
- refresh button for rescanning audio tabs
- new `content-volume.js` content script for applying media volume on pages
- fixed leftover popup script braces from the hover-reader removal cleanup

Note: these controls target normal HTML `<audio>` and `<video>` elements. Some WebAudio-based players may ignore the slider, because the web platform remains a haunted filing cabinet.


## v1.52 popup fit fix
- Clamped Main Menu tab-audio slider cards so range controls stay inside the popup instead of sliding off the panel like escaped neon plumbing.


### v1.53.0
- Cleaned up Main Menu audio UI: removed extra explanatory text, dashed divider, Audio Tabs heading, and tab slider card outlines.
- Matched per-tab audio slider rows to the Browser Volume title/slider layout.


### v1.54.0
- Added hover-only marquee behavior for long tab titles in the Main Menu audio slider list.
- Marquee only activates when the title actually overflows, so short titles stay still instead of doing needless haunted ticker-tape theatre.



### v1.55.0
- Removed the redundant Main Menu heading above Browser Volume.
- Collapsed all Main Menu volume controls under a single **Volume Controls** button.
- Added a slideout panel for Browser Volume, tab sliders, and Refresh Audio Tabs.


## v1.56.1

- Made the theinternetisdead-storage-reader scrollbars thin lime green in Chromium and Firefox-style scrollbar engines.


## v1.56.2

- Hid the outer popup/menu scrollbar caused by expanding the storage-reader menu drawer.
- Preserved the thin lime scrollbars inside `storage-items` and `storage-value`.

## v1.56.9

- Reworked the half-scale popup pass to use actual halved CSS dimensions and font sizes instead of the browser `zoom` shortcut.
- Keeps the extension UI visually proportional while avoiding popup sizing/rendering weirdness from `zoom`.


## v1.56.9

Adjusted the popup from true half-scale to a more usable compact 75% scale. The layout, spacing, and visual style remain proportional, but the popup is no longer tiny enough to require a jeweler's loupe.


## v1.56.10

- Added a **Texture Scale** slider under **Texture Intensity** in `theinternetisdead-customizer`.
- Texture scale saves per page, applies immediately, resets with page customization, and scales seamless PNG texture tiling from 25% to 300%.


## 1.56.14

- Renamed the customizer dropdown label from **Saved Themes** to **Stored Themes**.
- Changed the dropdown display text to use the entries from `stored-themes/index.json` instead of the exported theme JSON's internal `name` field.
- Kept stored themes filtered to the active page by `pageKey` / `pageUrl`, while preventing stale names like “Texture Filter Update” from appearing in the dropdown.

## 1.56.13

- Changed **Stored Themes** so the dropdown only reads bundled JSON theme files listed in `stored-themes/index.json`.
- Added `stored-themes/chatgpt-crimson-crackle.json` as the first bundled theme.
- **Save Page Theme** still opens a save-file dialog and exports the current page URL/page key inside the JSON, but it no longer adds that exported theme to the dropdown automatically.
- To add more dropdown themes, place the JSON file in `/stored-themes/` and add its path to `/stored-themes/index.json`, then reload the unpacked extension.

### 1.56.29

- Renamed the bundled stored theme to `chatgpt-crimson-crackle` so the Saved Themes dropdown shows the intended theme name instead of the old page title metadata.
- Updated `stored-themes/index.json` to point at `stored-themes/chatgpt-crimson-crackle.json`.
- Added origin matching for bundled stored themes that declare `pageMatchMode: "origin"`, so the ChatGPT theme behaves like a ChatGPT-wide theme instead of one old conversation URL.
