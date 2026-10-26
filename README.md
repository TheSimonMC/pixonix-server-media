# Pixonix Server Media

Artwork for Pitschonix.eu and attack.pitschonix.eu. These are the only bundled mappings. Other addresses use the client’s black default background; saved multiplayer lists are left alone.

Each folder in `minecraft_servers` contains a manifest and PNG assets. Run `python tools/build_index.py` after changing artwork. The builder only accepts these two folders and exact addresses; no wildcard aliases are published.

`icon.png` is the server icon, `background.png` is the list background, `banner.png` is an optional TAB banner and `logo.png` is optional logo artwork. Existing `@2x` assets take precedence. Images are bounded to 4096 pixels per side, 8 megapixels and 16 MiB. The index includes SHA-256 checksums.

Clients download the index and needed images over HTTPS. Local cached indices are restricted to the same two addresses. A missing TAB banner stays absent. The index cannot change connection addresses or execute code.
