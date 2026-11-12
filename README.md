# Pixonix Server Media

A server mapping sets the artwork players see in Pixonix, adds shortcuts to game modes and controls which supported mods players can use on your server.

## Create a mapping

[Open the mapping editor](https://thesimonmc.github.io/pixonix-server-media/). Enter your server’s display name and Java address. Include the port if it differs from `25565`. For an existing mapping, keep the same folder ID.

Select at least one category and add a server icon and a background. Drop a PNG onto each field or click to choose it. Use **Add address** if players can reach the server under another address. Social links, a player list banner, Quick Joins and mod rules are optional.

Switch views in the client preview to check your artwork. The export section lists any required fields still empty. Your draft stays in the browser tab. Accept the [submission terms](SUBMISSION_TERMS.md) and select **Download ZIP** before closing it.

## Submit a mapping

1. [Fork this repository](https://github.com/TheSimonMC/pixonix-server-media/fork). Extract the ZIP into the root of your fork so the manifest is at `minecraft_servers/<your_id>/manifest.json`. When updating a mapping, remove artwork you no longer use.
2. [Open a pull request](https://github.com/TheSimonMC/pixonix-server-media/compare). Include a public link showing that you represent the server and check the submission terms box. Your files become public when you push them to a public fork.
3. GitHub checks the files and verifies that the public addresses in each updated mapping answer a Minecraft Java status request. This includes aliases and direct Quick Joins. If the server is offline, bring it online and rerun the check. Push any address corrections to the same branch.

A maintainer reviews the submission. Mapping-only pull requests merge after a maintainer approves the latest changes and the checks pass. Pixonix checks the [published catalog](https://thesimonmc.github.io/pixonix-server-media/index.json) every 24 hours while running and uses its cached copy offline.

## Artwork

| File | Where players see it |
| --- | --- |
| `icon.png` | Beside the server name in the multiplayer server list and wherever Pixonix shows the server logo |
| `background.png` | Behind the server's entry in the list |
| `banner.png` | Above the in-game player list (Tab). Choose a display width between 80 and 250 pixels. |

Use a still PNG for each image. Each file can be up to 16 MiB and 8,388,608 pixels in total, with a maximum width or height of 4,096 pixels. Icons and backgrounds also support high-resolution versions. If you include both `icon.png` and `icon@2x.png`, for example, the client uses `icon@2x.png`. Existing mappings with a separate `logo.png` or `logo@2x.png` keep their standalone logo.

## Quick Joins

Players can choose a mode directly on the server entry. If the buttons exceed the available width, the last button opens the full list. You can add up to 12 modes.

- Choose **Server address** for a destination such as `duels.example.net`. Configure your server or proxy to route that address to Duels. Use a listed hostname or one of its subdomains.
- Choose **Proxy command (/server)** and enter a backend ID such as `lobby-01`. Pixonix connects to the network, then sends `/server lobby-01` three seconds after joining. Check the route in game since a public status request can only verify the network address.

## Mod rules

You can disable Shield Status, Hit Range, Stretched Res, Fly Speed, Freelook, or Health Indicator for players on your server. Fullbright has three settings.

| Fullbright rule | What happens on your server |
| --- | --- |
| Player's choice | Players can use their preferred mode. |
| Night Vision only | Players who enable Fullbright get Night Vision. Fullbright stays off for players who turned it off. |
| Disable Fullbright | Both Gamma and Night Vision are unavailable in the mod. |

Players keep their saved settings when they leave the server.
