# Pixonix Server Media

A server mapping tells Pixonix which artwork to show when a player saves your Minecraft Java server. It can also offer direct joins to individual modes and disable selected client features while someone plays on your network.

**[Open the mapping editor](https://thesimonmc.github.io/pixonix-server-media/)**

## Add your server

1. Enter the network name, its Java address and a short folder ID, such as `oak_network`. Add any other addresses players use to reach the same server. Addresses match exactly, including non-default ports.
2. Choose your PNGs. The preview shows the multiplayer row, the TAB list, your logo and the Quick Join menu. All artwork is optional. The editor reads files in your browser and discards the draft when you close or reload the tab.
3. Add any Quick Joins or mod rules, then select **Download ZIP**.
4. [Fork this repository](https://github.com/TheSimonMC/pixonix-server-media/fork). Extract the ZIP and add its `minecraft_servers/<your_id>/` folder at the same location in your fork. For an update, replace the files in your existing folder and remove any artwork you have retired.
5. [Open a pull request](https://github.com/TheSimonMC/pixonix-server-media/compare). Include a public link that lets the reviewer verify your connection to the server. Submit only artwork you have permission to publish.

GitHub checks your manifest, PNGs, addresses, Quick Joins and mod rules. If a check fails, open its log, fix the reported file and push the change to the same branch in your fork. The pull request updates automatically.

Once the checks pass, the owner verifies that you represent the server and reviews your artwork and destinations. Mapping-only submissions merge automatically after the owner approves the current revision and all branch requirements pass. GitHub Pages publishes the editor, images and [client catalog](https://thesimonmc.github.io/pixonix-server-media/index.json) together. Compatible clients check for changes every 24 hours while running and can use the previous catalog offline.

## Artwork

| File | Where it appears |
| --- | --- |
| `icon.png` | Server icon in the multiplayer list |
| `background.png` | Background of the multiplayer row |
| `banner.png` | Banner above the TAB player list. Set its display width from 80 to 250 pixels. |
| `logo.png` | Separate network logo for surfaces that support it |

For the icon, background and logo you can also supply an `@2x.png` version, such as `icon@2x.png`. It takes precedence. Use still PNG images up to 4096 pixels on each side, 8,388,608 pixels in total and 16 MiB per file.

## Quick Joins and mod rules

A **Quick Join** connects through Minecraftâ€™s multiplayer connection screen. For example, a mapping for `example.net` can offer **Duels** at `duels.example.net`. Configure your server or proxy to route that hostname to Duels. Each mapping supports up to 12 destinations on its listed hosts or their subdomains.

**Mod rules** can restrict Shield Status, Hit Range, Stretched Res, Fly Speed, Fullbright, Freelook and Health Indicator. Select a mod to disable it, or expand its settings to restrict a single switch. All other mods stay under the player’s control. When a player disconnects, their own settings apply again.
