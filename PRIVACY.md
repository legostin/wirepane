# Privacy policy

Wirepane is a local HTTPS debugging proxy for Claude Code on macOS. This note says what the program on your Mac actually does with data. It describes the plugin in this repository (version 0.9.3).

## What runs, and where

Wirepane does not run a server of its own, and it has no account and no telemetry. It does not send recordings, certificates, or usage data to the author.

The proxy is a Node.js process on your Mac. By default it listens on `127.0.0.1`. If you set **Listen on LAN**, it also accepts connections from your network so a phone can use it. Captured traffic is decrypted on this Mac so you and Claude Code can inspect it.

A request is forwarded to the host in its URL. Wirepane does not send it anywhere else, except in the cases under [Upstream proxies](#upstream-proxies).

## What is stored on your Mac

Recordings and the proxy's own files live under `~/.claude/proxy-mod` (your home directory):

- `flows/<run>/` holds the recorded requests: URLs, headers, bodies, WebSocket messages, and server-sent events. These can include passwords, tokens, and other personal data from the app you are debugging.
- `ca/` and `certs/` hold the certificate authority Wirepane creates on this Mac (the private keys are mode `0600`) and the per-host certificates it signs.
- `browser/` holds the separate browser profile used by **Browser → Open**.
- `tracking.json` holds the domain patterns you asked the proxy to record. `trusted-scripts.json` holds hashes of rule scripts you approved, not the captured traffic.
- `system-proxy-backup.json` holds the system-proxy settings from before Wirepane changed them, so they can be put back. `android-proxied.json` holds the adb path, port, and device serials to point back.
- `sidecar.json` and `sidecar.lock` say whether a proxy is running. `sidecar.log` is that process's log: in the usual daemon it receives error and fatal lines, which can name a host. The full request stream is not copied into this file.

The proxy deletes a `flows/<run>/` folder, other than the run that is open, when that folder's modification time is more than two days old. **Clear** in the pane clears the list in the session. It does not delete those files.

Rules live in the project, in `.claude/proxy-rules.json`. Exporting a HAR writes a copy where you asked, under the project unless you gave an absolute path.

Claude Code's own plugin store on this Mac keeps the pane layout and a per-session copy of the tracked-domain list. Wirepane does not choose that store's path.

## How to delete it

1. Run `/proxy stop`. That stops the proxy, puts the macOS system proxy back, and points Android devices it changed back.
2. Delete the data directory: `rm -rf ~/.claude/proxy-mod`. That removes the recordings, the CA and its key, browser profiles, backups, and the log.
3. Delete `<project>/.claude/proxy-rules.json` if you do not want the rules, and delete any HAR file you exported.
4. Text Claude already read through a tool is part of that Claude Code conversation. Clearing or deleting the conversation is done in Claude Code. Wirepane does not keep a second copy of the chat.

Uninstalling the plugin (`/plugin uninstall wirepane@wirepane`) does not by itself remove `~/.claude/proxy-mod` or a CA you trusted. Remove the CA as described below.

## What Claude Code is given

The pane shows traffic inside Claude Code. A tool returns a request, or part of one, only when Claude calls that tool. Wirepane hands that text back to Claude Code as the tool result. It does not open its own connection to Anthropic or to the author. What Claude Code then does with the conversation is Claude Code's, not a request Wirepane makes.

## What it reads on the machine

To run the proxy and the doctor it reads local state: your home directory, whether Node and adb are installed, `ANDROID_HOME`, the routing table, the network-service order, the current system-proxy settings, the process list (`ps`), and who holds the proxy port (`lsof`). None of that is uploaded.

The login keychain is used only for Wirepane's own CA:

- `security verify-cert -c` on that CA file asks macOS whether this Mac trusts it. This runs when the doctor or the macOS setup tab checks trust. It does not list your passwords or other keychain items.
- `security add-trusted-cert` adds that CA to `~/Library/Keychains/login.keychain-db` only when you press **Trust CA on this Mac**. macOS asks you to confirm.

## What it changes, and how to undo it

Turning the system proxy on, trusting the CA, starting a browser or emulator through the proxy, and pointing an Android device at the proxy happen when you press the matching control (or when Claude uses a tool you invoked). Putting settings back also happens on its own: when the proxy stops, when the last session leaves, and if the watchdog sees the proxy was killed while the system proxy still pointed here.

| Change | Undo |
| --- | --- |
| macOS system proxy | `/proxy stop`, **Turn off**, or the doctor's **Put back**. The previous settings are in `system-proxy-backup.json`. |
| CA in the login keychain | Keychain Access: search for a certificate named like `Wirepane CA`, and remove it. |
| CA on an iOS Simulator | Remove it in the simulator's settings, or erase the simulator. |
| CA you installed on an iPhone from the setup page | **Settings → General → VPN & Device Management**. |
| Separate browser profile | Delete `~/.claude/proxy-mod/browser`. |
| Android device proxy | **Revert**, or `/proxy stop`. |
| Android emulator system CA (**Trust in all apps**) | Reboot the emulator. It was added only on an image that allows root, and only for that boot. |
| Plugin settings (`wirepane.listen`, `wirepane.insecureHosts`, `wirepane.noDecrypt`, `wirepane.upstreamProxy`) | Change them again in the pane. They are not Claude's permission mode. |

**Install Node.js** runs only if you press it and no Node was found: `brew install node`, or, without Homebrew, opening `https://nodejs.org/en/download` in your browser.

## Upstream proxies

If you set an upstream proxy, connections to servers go to that proxy first (an office or VPN proxy you named). Credentials in that URL are sent to that proxy for Basic or NTLM sign-in. A setting that starts with `pac+` is a PAC file: the proxy downloads that file from the URL you gave, refreshes it after ten minutes, and runs `FindProxyForURL` locally to choose the next proxy. Credentials in the PAC URL are not sent to the PAC server; they are used for the proxies the file names.

## Contact

Questions and corrections: [GitHub issues](https://github.com/legostin/wirepane/issues) on [legostin/wirepane](https://github.com/legostin/wirepane).
