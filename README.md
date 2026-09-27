# PIXONIX Server Media

Server icons, backgrounds and TAB banners for PIXONIX Client and PIXONIX Mod.

## Add or update a server

1. Create `minecraft_servers/yourserver/manifest.json`.
2. Add the PNG files listed below.
3. Run `python tools/build_index.py` and commit the files together with `index.json`.

```json
{
  "server_name": "yourserver",
  "nice_name": "Your Server",
  "direct_ip": "play.example.net",
  "server_wildcards": ["%.example.net"]
}
```

The folder name must match `server_name`. Wildcards match whole domain labels, so `%.example.net` also covers `play.example.net`.

## Images

| File | Used for |
| --- | --- |
| `icon.png` or `icon@2x.png` | Square icon in the server list |
| `background.png` or `background@2x.png` | Background behind the server-list entry |
| `banner.png` | Banner above the TAB player list |
| `logo.png` or `logo@2x.png` | Optional server logo retained in the catalogue |

Use transparent PNGs for icons and banners where appropriate. TAB banners work best at 5:1. The `@2x` files take priority when available. Files may be up to 4096 pixels per side, 8 megapixels and 16 MiB.

A server without `banner.png` gets no extra TAB image. The client does not create a replacement from its background and logo. Server-list backgrounds use the upper part of the image. The server's own MOTD, player-list header and footer remain intact.

## Updates and cache

PIXONIX downloads the index over HTTPS and loads artwork as needed. SHA-256 checks protect the local image cache. Repository updates do not require a new client build.

The client checks the index on first use and when Multiplayer is opened or refreshed, at most once per minute. It also checks hourly while in use. Existing cached data remains available if a request fails. Hosting caches can delay a new repository update by a few minutes.

Server Media can be switched off, with separate controls for icons, list backgrounds and TAB banners. It does not add saved servers, change connection addresses, execute commands or send Minecraft credentials.

## Image ownership

Server names, logos and trademarks belong to their respective owners. Images identify those servers and do not imply endorsement or partnership. This repository grants no additional rights to third-party artwork. Submit only files you have permission to provide.
