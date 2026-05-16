# Utopia Call Logger
### Free forever — Gemini AI + Notion + Vercel

Log a call in 20 seconds. AI reads your note and fills your Notion CRM automatically.

---

## Deploy in 4 steps

### Step 1 — Get your Gemini API key (free)

1. Go to **aistudio.google.com**
2. Sign in with Google
3. Click **Get API key** → Create API key
4. Copy it (starts with `AIza`)

Free tier: 1,500 calls/day — more than enough.

---

### Step 2 — Get your Notion API key (free)

1. Go to **notion.so/my-integrations**
2. Click **+ New integration**
3. Name: `Call Logger` · Workspace: yours · Click Save
4. Copy the **Internal Integration Secret** (starts with `secret_`)
5. Open your **🎯 Lead & Deal Pipeline** database in Notion
6. Click `···` top right → **Add connections** → select **Call Logger**

---

### Step 3 — Put files on GitHub

1. Go to **github.com** → sign up free if needed
2. Click **+** → **New repository** → name it `utopia-call-logger` → Create
3. Click **uploading an existing file**
4. Drag everything from the unzipped folder → **Commit changes**

---

### Step 4 — Deploy on Vercel

1. Go to **vercel.com** → sign up free with GitHub
2. Click **Add New Project** → import `utopia-call-logger`
3. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | `AIza...` |
| `NOTION_API_KEY` | `secret_...` |

4. Click **Deploy**
5. You get a live URL like `utopia-call-logger.vercel.app`

---

### Add to iPhone home screen

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button (box with arrow at the bottom)
3. Tap **Add to Home Screen**
4. Name it **Call Logger** → Add

One tap after every call. Done.

---

## Cost breakdown

| Service | Cost |
|---------|------|
| Vercel hosting | Free |
| Gemini AI (1,500 calls/day) | Free |
| Notion API | Free |
| **Total** | **$0** |
