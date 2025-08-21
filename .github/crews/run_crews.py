import os, datetime, json, subprocess, textwrap, pathlib

USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
USE_ANTHROPIC = bool(os.getenv("ANTHROPIC_API_KEY"))

NOTES_PATH = pathlib.Path("AUTOGEN_NOTES.md")

PROMPT = """You are reviewing a Next.js + Directus UI repo.
Propose a short, actionable plan (≤10 items) to:
- Improve table UX (virtualization, column manager)
- Strengthen security (server-only data, httpOnly cookies)
- Add tests for exports and quotas
Output as a concise checklist. Avoid changing secrets or env handling.
"""

def call_openai(prompt: str) -> str:
    import openai
    openai.api_key = os.environ["OPENAI_API_KEY"]
    client = openai.OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":"You are an expert code reviewer."},
                  {"role":"user","content": prompt}],
        temperature=0.2,
        max_tokens=600,
    )
    return resp.choices[0].message.content.strip()

def call_anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=700,
        temperature=0.2,
        messages=[{"role":"user","content": prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "text", None))

def main():
    now = datetime.datetime.utcnow().isoformat() + "Z"
    parts = [f"# AI Build Notes ({now})\n"]

    if USE_ANTHROPIC:
        try:
            parts.append("## Claude plan\n")
            parts.append(call_anthropic(PROMPT))
        except Exception as e:
            parts.append(f"_Claude failed: {e}_\n")

    if USE_OPENAI:
        try:
            parts.append("\n## OpenAI plan\n")
            parts.append(call_openai(PROMPT))
        except Exception as e:
            parts.append(f"_OpenAI failed: {e}_\n")

    text = "\n".join(parts)
    NOTES_PATH.write_text(text, encoding="utf-8")
    print(f"Wrote {NOTES_PATH}")

    # Optionally format repo / run a simple check (non-fatal)
    try:
        subprocess.run(["git", "add", str(NOTES_PATH)], check=True)
        subprocess.run(["git", "commit", "-m", "chore(ai): add AUTOGEN_NOTES"], check=False)
    except Exception as e:
        print("Commit step skipped:", e)

if __name__ == "__main__":
    main()

