# Pixonix Server Media

A server mapping sets the artwork players see in Pixonix, adds shortcuts to game modes and controls which supported mods players can use on your server.

## Create a mapping

[Open the mapping editor](https://thesimonmc.github.io/pixonix-server-media/). Enter your server’s display name and Java address. Include the port if it differs from `25565`. For an existing mapping, keep the same folder ID.

Add artwork, Quick Joins or mod rules as needed. You can switch between the server list, player list and game mode picker in the preview. Your draft stays in the browser tab. Accept the [submission terms](SUBMISSION_TERMS.md) and select **Download ZIP** before closing it.

## Submit a mapping

1. [Fork this repository](https://github.com/TheSimonMC/pixonix-server-media/fork). Extract the ZIP into the root of your fork so the manifest is at `minecraft_servers/<your_id>/manifest.json`. When updating a mapping, remove artwork you no longer use.
2. [Open a pull request](https://github.com/TheSimonMC/pixonix-server-media/compare). Include a public link showing that you represent the server and check the submission terms box. Your files become public when you push them to a public fork.
3. GitHub checks the files. If a check fails, its log explains what to fix. Push the correction to the same branch.

A maintainer reviews the submission. Mapping-only pull requests merge after a maintainer approves the latest changes and the checks pass. Pixonix checks the [published catalog](https://thesimonmc.github.io/pixonix-server-media/index.json) every 24 hours while running and uses its cached copy offline.

## Artwork

| File | Where players see it |
| --- | --- |
| `icon.png` | Beside the server name in the multiplayer server list |
| `background.png` | Behind the server's entry in the list |
| `banner.png` | Above the in-game player list (Tab). Choose a display width between 80 and 250 pixels. |
| `logo.png` | Wherever the client displays a standalone server logo |

Use a still PNG for each image. Each file can be up to 16 MiB and 8,388,608 pixels in total, with a maximum width or height of 4,096 pixels. The icon, background, and logo also support high-resolution versions. If you include both `icon.png` and `icon@2x.png`, for example, the client uses `icon@2x.png`.

## Quick Joins

A Quick Join lets players connect directly to a game mode. For example, add **Duels** with the address `duels.example.net` and configure your server or proxy to send players who join at that address to Duels. You can add up to 12 destinations. Each must use a hostname listed in the mapping or one of its subdomains.

## Mod rules

You can disable Shield Status, Hit Range, Stretched Res, Fly Speed, Freelook, or Health Indicator for players on your server. Fullbright has three settings.

| Fullbright rule | What happens on your server |
| --- | --- |
| Player's choice | Players can use their preferred mode. |
| Night Vision only | Players who enable Fullbright get Night Vision. Fullbright stays off for players who turned it off. |
| Disable Fullbright | Both Gamma and Night Vision are unavailable in the mod. |

Players keep their saved settings when they leave the server.
