# Pixonix Server Media

A server mapping tells Pixonix which artwork to show when a player saves your Minecraft Java server. It can also offer direct joins to individual modes and disable selected client features while someone plays on your network.

**[Open the mapping editor](https://thesimonmc.github.io/pixonix-server-media/)**

## Add your server

1. Enter the network name, its Java address and a short folder ID, such as `oak_network`. Add any other addresses players use to reach the same server. Addresses match exactly, including non-default ports.
2. Choose your PNGs. The preview shows the multiplayer row, the TAB list, your logo and the Quick Join menu. All artwork is optional. The editor reads files in your browser and discards the draft when you close or reload the tab.
3. Add any Quick Joins or mod rules, then select **Download ZIP**.
4. [Fork this repository](https://github.com/TheSimonMC/pixonix-server-media/fork). Extract the ZIP and add its `minecraft_servers/<your_id>/` folder at the same location in your fork. For an update, replace the files in your existing folder and remove any artwork you have retired.
5. [Open a pull request](https://github.com/TheSimonMC/pixonix-server-media/compare). Include a public link that lets the reviewer verify your connection to the server. Submit only artwork you have permission to publish.

GitHub checks the manifest, images, addresses, Quick Joins and mod rules. The repository owner reviews submissions and destination ownership before merging. After a merge, GitHub Pages publishes the editor, images and [client catalog](https://thesimonmc.github.io/pixonix-server-media/index.json) together. Compatible clients check for changes every 24 hours while running and can use the previous catalog offline.

## Artwork

| File | Where it appears |
| --- | --- |
| `icon.png` | Server icon in the multiplayer list |
| `background.png` | Background of the multiplayer row |
| `banner.png` | Banner above the TAB player list. Set its display width from 80 to 250 pixels. |
| `logo.png` | Separate network logo for surfaces that support it |

For the icon, background and logo you can also supply an `@2x.png` version, such as `icon@2x.png`. It takes precedence. Use still PNG images up to 4096 pixels on each side, 8,388,608 pixels in total and 16 MiB per file.

## Quick Joins and mod rules

A **Quick Join** connects through Minecraft’s multiplayer connection screen. For example, a mapping for `example.net` can offer **Duels** at `duels.example.net`. Configure your server or proxy to route that hostname to Duels. Each mapping supports up to 12 destinations on its listed hosts or their subdomains.

Under **Mod rules**, select an entire mod or expand it to disable a single on/off feature. For example, you can disable Freelook or just the live ping measurement. The rules apply to the connected server. A restriction sent by the server’s plugin also applies. Disconnecting restores the player’s own settings.

## What is `tools/`?

It contains the Python checker that GitHub runs on submissions. The editor writes the manifest and ZIP for you. If you prefer to check a fork locally, install Pillow and run `python tools/build_index.py` from the repository root. Add `--output index.local.json` to inspect the generated catalog. The root `index.json` serves older client builds.
