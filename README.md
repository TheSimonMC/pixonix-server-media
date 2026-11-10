# Pixonix Server Media

A mapping lets you customize how your Minecraft Java Edition server appears in Pixonix. You can add artwork to the server list, give players shortcuts to game modes, and set rules for specific client mods.

## Create a mapping

1. [Open the mapping editor](https://thesimonmc.github.io/pixonix-server-media/) and enter the name and address players use to join your server. Include the port if it differs from `25565`. If players use more than one address, add the others under **Folder ID and alternate addresses**.
2. Check the folder ID. The editor suggests one based on your server name. If you're updating an existing mapping, use its current folder ID.
3. Add any artwork, Quick Joins, or mod rules you want. Use the preview to see how your mapping will look in the client.
4. Read the [submission terms](SUBMISSION_TERMS.md), check the box, then select **Download ZIP**. The editor processes your files in your browser. Closing or reloading the tab clears your draft.

## Submit your mapping

[Fork this repository](https://github.com/TheSimonMC/pixonix-server-media/fork), then extract the ZIP into the root of your fork. Your manifest should be at `minecraft_servers/<your_id>/manifest.json`. If you're updating a mapping, remove any artwork you no longer use.

[Open a pull request](https://github.com/TheSimonMC/pixonix-server-media/compare) and include a public link that shows you represent the server. Check the submission terms box in the pull request description. Your files are public as soon as you push them to your public fork. GitHub checks the manifest, images, server addresses, Quick Joins, and mod rules. If a check fails, open its log for details and push the fix to the same branch.

Once the checks pass, the repository owner reviews the submission. Pull requests that change only mappings merge automatically once the owner approves the latest changes and all required checks pass. GitHub Pages then publishes the artwork and the updated [server catalog](https://thesimonmc.github.io/pixonix-server-media/index.json). Compatible clients check for updates every 24 hours while running and use their cached catalog when offline.

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
