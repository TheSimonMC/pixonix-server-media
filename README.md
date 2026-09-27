# PIXONIX Server Media

Server icons, banners and address mappings for PIXONIX Client and PIXONIX Mod.

The initial collection comes from [LabyMod/server-media](https://github.com/LabyMod/server-media), also referenced by [TheSimonMC/server-media](https://github.com/TheSimonMC/server-media). Original files are preserved in `minecraft_servers`. The imported revision is recorded in `UPSTREAM.json`.

Images identify their respective servers. Names, logos and trademarks belong to their owners. Inclusion does not imply a partnership or endorsement. The original [notices](docs/UPSTREAM-README.md#trademark-legal-notices) remain applicable. This repository does not grant new rights to third-party artwork.

## Add or update a server

1. Create `minecraft_servers/yourserver/manifest.json` with `server_name`, `nice_name`, `direct_ip` and optional `server_wildcards`.
2. Add `icon.png` or `icon@2x.png`. Optional files: `banner.png`, `background.png`, `background@2x.png`, `logo.png`, `logo@2x.png`.
3. Run `python tools/build_index.py` and commit `index.json` together with the source files.

Example:

```json
{
  "server_name": "yourserver",
  "nice_name": "Your Server",
  "direct_ip": "play.example.net",
  "server_wildcards": ["%.example.net"]
}
```

Use PNG images. An actual banner should have a wide aspect ratio, ideally 5:1. Only submit artwork you are allowed to provide. See the preserved [file guide](docs/upstream/Files.md) for the upstream layout.

## Client behavior

PIXONIX reads `index.json` over HTTPS and downloads only images needed for visible servers. Files are checked against their SHA-256 hashes and cached locally. Updates to this repository become available without rebuilding the client. A cached index is refreshed after one hour; failed refreshes retain the previous working data.

The server list uses the custom icon and banner/background. The Tab player list shows the banner above the server's existing header. If no banner exists, PIXONIX can compose a header from the existing background and logo. Missing images leave Minecraft's normal display intact. The Server Media module can be disabled, with separate switches for icons, list banners and Tab banners.

The collection never adds servers to a player's saved list, changes connection addresses, executes commands or sends account credentials. GitHub receives ordinary image/index requests, not the player's complete server list.
