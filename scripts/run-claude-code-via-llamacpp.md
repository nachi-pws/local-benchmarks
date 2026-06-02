Got it — you want Claude Code to be able to connect to your local `llama.cpp` server **without interfering with your Pro subscription when you launch it normally**. That’s absolutely possible. The trick is to keep your **default config** pointing to Anthropic (your Pro account), and use a **separate config file** or a command‑line override when you want to connect locally.

---

## 🔹 Option 1: Separate config file
1. In your `.claude` folder (`C:\Users\LDR\.claude\`), create a new file called `config-local.json`.
2. Put your local server settings inside:

```json
{
  "llm": {
    "provider": "openai-compatible",
    "api_base": "http://127.0.0.1:8000",
    "api_key": "none",
    "model": "Qwen3-Coder-30B-A3B"
  }
}
```

3. Launch Claude Code with:
```powershell
claude code --config C:\Users\LDR\.claude\config-local.json --model Qwen3-Coder-30B-A3B
```

This way, your **main config** (Pro subscription) stays untouched, and you only use the local config when you explicitly point to it.

---

## 🔹 Option 2: Command‑line override (no extra file)
You can skip creating a file and just override settings inline:

```powershell
claude code --api-base http://127.0.0.1:8000 --model Qwen3-Coder-30B-A3B
```

This tells Claude Code to use your local `llama.cpp` server for that session only. When you run `claude code` normally, it will still use your Pro subscription.

---

## ✅ Best practice
- Keep your **Pro subscription config** as the default (`settings.json` or `config.json`).
- Use a **secondary config file** or **command‑line flags** when you want to switch to local models.
- That way, you don’t risk breaking your Pro setup, and you can toggle between cloud and local easily.

---

Would you like me to give you a **ready‑to‑run PowerShell script** that sets up `config-local.json` and launches Claude Code against your Qwen model, so you can switch back and forth with a single command?