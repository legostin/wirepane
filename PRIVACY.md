# Privacy policy

Wirepane is a local HTTPS debugging proxy for Claude Code on macOS. This note says what the program on your Mac actually does with data. It describes the plugin in this repository (version 0.9.3).

## What runs, and where

Wirepane does not run a server of its own, and it has no account and no telemetry. It does not send recordings, certificates, or usage data to the author.

The proxy is a Node.js process on your Mac. By default it listens on `127.0.0.1`, so only this Mac can use it. If you set **Listen on LAN**, it also accepts connections from your network so a phone can use it. It asks for no password: any device on that network that is set to use it can send traffic through it, and that traffic is recorded on this Mac like your own. Set it back to this Mac only when you are done.

## What it records

What reaches the proxy is what you point at it: the browser the pane opens, a simulator, an Android device, or, after **Turn on for this Mac**, every app on this Mac that uses the system proxy. Captured traffic is decrypted on this Mac so you and Claude Code can inspect it.

With the tracked-domain list off (the pane shows **Domains: all**), every host that comes through is recorded, and decrypted where the client trusts Wirepane's CA. With the system proxy on, that includes what a browser sends to your bank or your mail. Turn on the list (**Domains**) to record only your app's hosts. Other hosts then pass through without being decrypted or recorded; the proxy only counts their names, in memory, for the doctor.

Some traffic is never decrypted:

- Anthropic's and Claude's hosts (`*.anthropic.com`, `*.claude.ai`, `*.claude.com`) pass through untouched and are not recorded.
- While the system proxy points here, HTTPS connections from Claude Code, the Claude app, and the programs they started pass through untouched and are not recorded. A plain `http://` request is not told apart by the program that sent it.
- Hosts in **Hosts never decrypted** (Apple's by default) and hosts that refused the proxy's certificate twice pass through as an encrypted tunnel. The list records the host name, not the content.

## Where a request goes

A request is forwarded to the host in its URL, except:

- with an upstream proxy set, it goes to that proxy first (see [Upstream proxies](#upstream-proxies));
- a rule that sends it to another address (`mapRemote`, `replaceUrl`) sends it there, with its headers, cookies, and `Authorization`. You or Claude add these rules, and they are kept in the project's `.claude/proxy-rules.json`;
- a recorded request sent again with `replay_request`, or a held request let go with `resume_request`, goes to the URL it was given, which Claude can change.

## What is stored on your Mac

Recordings and the proxy's own files live under `~/.claude/proxy-mod` (your home directory):

- `flows/<run>/` holds the recorded requests: URLs, headers, bodies, WebSocket messages, and server-sent events. These can include passwords, tokens, and other personal data from the app you are debugging.
- `ca/` and `certs/` hold the certificate authority Wirepane creates on this Mac (the private keys are mode `0600`) and the per-host certificates it signs.
- `browser/` holds the separate browser profiles used by **Browser → Open**, with the cookies and history of what you open in them.
- `tracking.json` holds the domain patterns you asked the proxy to record. `trusted-scripts.json` holds hashes of rule scripts you approved, not the captured traffic.
- `system-proxy-backup.json` holds the system-proxy settings from before Wirepane changed them, so they can be put back. `android-proxied.json` holds the adb path, port, and device serials to point back.
- `sidecar.json` and `sidecar.lock` say whether a proxy is running. `sidecar.log` is that process's log: in the usual daemon it receives warning, error, and fatal lines, with stack traces, which can name a host. The requests themselves are not copied into this file. It is only added to: nothing trims or deletes it.

When a proxy starts, it deletes every `flows/<run>/` folder, other than its own, whose modification time is more than two days old. Nothing deletes them on a timer: if no proxy starts again, they stay until you delete them. While a proxy runs, it keeps the files of its latest 2000 requests and deletes older ones. **Clear** in the pane clears the list in the session. It does not delete those files.

Rules live in the project, in `.claude/proxy-rules.json`. Exporting a HAR writes a copy where you asked, under the project unless you gave an absolute path.

Claude Code's own plugin store on this Mac keeps the pane layout and a per-session copy of the tracked-domain list. Wirepane does not choose that store's path.

### Settings

Claude Code keeps the plugin's settings (**Proxy reachable from**, **Hosts never decrypted**, **Upstream proxy**, and the others in `/config`) in its `settings.json`, under `pluginConfigs`, in plain text. An upstream proxy URL can hold a user name and a password. They are stored there, and they are passed to the proxy's processes on their command line, so another program on this Mac that lists processes (`ps`) can read them while the proxy runs.

## How to delete it

1. Run `/proxy stop`. That stops the proxy, puts the macOS system proxy back, and points Android devices it changed back.
2. Delete the data directory: `rm -rf ~/.claude/proxy-mod`. That removes the recordings, the CA and its key, browser profiles, backups, and the log.
3. Delete `<project>/.claude/proxy-rules.json` if you do not want the rules, and delete any HAR file you exported.
4. If **Upstream proxy** holds a password, empty it in `/config`.
5. Text Claude already read through a tool is part of that Claude Code conversation. Clearing or deleting the conversation is done in Claude Code. Wirepane does not keep a second copy of the chat.

Uninstalling the plugin (`/plugin uninstall wirepane@wirepane`) does not by itself remove `~/.claude/proxy-mod` or a CA you trusted. Remove the CA as described below.

## What Claude Code is given

The pane shows traffic inside Claude Code. A tool returns a request, or part of one, only when Claude calls that tool. Wirepane hands that text back to Claude Code as the tool result. It does not open its own connection to Anthropic or to the author. What Claude Code then does with the conversation is Claude Code's, not a request Wirepane makes.

Two buttons in the pane put text in your prompt, for you to send or edit: **To prompt** (a request's method, its URL with the query, and its status) and **Ask Claude to change it** (a held request's method and URL). Nothing goes to Claude until you send the prompt.

## What it reads on the machine

To run the proxy and the doctor it reads local state: your home directory, whether Node and adb are installed, `ANDROID_HOME`, the routing table, the network-service order, the current system-proxy settings, the process list (`ps`), and who holds the proxy port (`lsof`). None of that is uploaded.

The login keychain is used only for Wirepane's own CA:

- `security verify-cert -c` on that CA file asks macOS whether this Mac trusts it. This runs when the doctor or the macOS setup tab checks trust. It does not list your passwords or other keychain items.
- `security add-trusted-cert` adds that CA to `~/Library/Keychains/login.keychain-db` only when you press **Trust CA on this Mac**. macOS asks you to confirm.

## What it changes, and how to undo it

Turning the system proxy on, trusting the CA, starting a browser or emulator through the proxy, and pointing an Android device at the proxy happen only when you press the matching control. Claude's tools do none of these. They can change the rules, the tracked domains, a held request (let go, changed, answered, or cut), and a WebSocket connection (a message sent, the connection closed), send a recorded request again, and write a HAR file.

Putting settings back also happens on its own: when the proxy stops, when the last session leaves, when a session starts and finds the system proxy left on by a proxy that is gone, and if the watchdog sees the proxy was killed while the system proxy still pointed here.

| Change | Undo |
| --- | --- |
| macOS system proxy | `/proxy stop`, **Turn off**, or the doctor's **Put back**. The previous settings are in `system-proxy-backup.json`. |
| CA in the login keychain | Keychain Access: search for a certificate named like `Wirepane CA`, and remove it. |
| CA on an iOS Simulator | Remove it in the simulator's settings, or erase the simulator. |
| CA you installed on an iPhone from the setup page | **Settings → General → VPN & Device Management**. |
| CA you installed on an Android phone or emulator from the setup page | **Settings → Security → Encryption & credentials → Trusted credentials → User** (the path differs a little by maker). |
| Separate browser profile | Delete `~/.claude/proxy-mod/browser`. |
| Android device proxy | **Revert**, or `/proxy stop`. |
| Android emulator system CA (**Trust in all apps**) | Reboot the emulator. It was added only on an image that allows root, and only for that boot. That boot's `adb` also runs as root until then (`adb unroot` ends it), and the CA file stays on the emulator at `/data/local/tmp/wirepane-ca.pem` (`adb shell rm /data/local/tmp/wirepane-ca.pem`). |
| Plugin settings (`wirepane.listen`, `wirepane.insecureHosts`, `wirepane.noDecrypt`, `wirepane.upstreamProxy`) | Change them again in the pane or in `/config`. |

**Install Node.js** runs only if you press it and no Node was found: `brew install node`, or, without Homebrew, opening `https://nodejs.org/en/download` in your browser.

## Upstream proxies

If you set an upstream proxy, connections to servers go to that proxy first (an office or VPN proxy you named). Credentials in that URL are sent to that proxy: for Basic or NTLM sign-in to an HTTP proxy, or as the user name and password of a SOCKS5 proxy. A setting that starts with `pac+` is a PAC file: the proxy downloads that file from the URL you gave, refreshes it after ten minutes, and runs `FindProxyForURL` locally to choose the next proxy. Credentials in the PAC URL are not sent to the PAC server; they are used for the proxies the file names. Where these credentials are stored is under [Settings](#settings).

## Contact

Questions and corrections: [GitHub issues](https://github.com/legostin/wirepane/issues) on [legostin/wirepane](https://github.com/legostin/wirepane).
