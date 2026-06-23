"""
Phase 0 seed generator for the Sandbox Request Management Portal.

Reads the real FY27 lab catalogue spreadsheet and emits clean, normalized
seed JSON. Catalogue statuses are mapped onto the PRD lifecycle state machine
(Ready / InUse / InTesting / Stale / Retired) and a `requestable` flag, plus
deterministically-synthesized fields the catalogue lacks but the portal needs
(last refresh, release notes, voucher issued/redeemed counts, active partners).

Deterministic: a stable hash of each lab id seeds the synthesized values, so
re-running produces identical output.
"""
import openpyxl, json, re, hashlib, warnings, datetime, os
warnings.filterwarnings("ignore")

SRC = "External-PostBuild2026_GL_Catalog_FY27.xlsx"
OUT = "portal/src/data/labs.json"
SHEET = "Lab Catalog FY27"

# --- normalization maps -----------------------------------------------------
SOLUTION_AREA = {
    "AI Business Solutions": "AI Business Solutions",
    "AI Business Process": "AI Business Solutions",
    "AI Workforce": "AI Business Solutions",
    "Cloud & AI Platforms": "Cloud & AI Platforms",
    "Cloud and AI Platform": "Cloud & AI Platforms",
    "Security": "Security",
}
TYPE = {
    "Guided Lab": ("guided-lab", "Guided Lab"),
    "GPS Skilling": ("gps-skilling", "GPS Skilling"),
    "Standard Sandbox": ("standard-sandbox", "Standard Sandbox"),
    "Hack in a Day": ("hiad", "Hack in a Day"),
    "Hack to Skill": ("hack-to-skill", "Hack to Skill"),
    "Hack to Build": ("hack-to-build", "Hack to Build"),
}
STATUS = {
    "Available": "Available",
    "In Pipeline": "In Pipeline",
    "In-Pipeline": "In Pipeline",
    "In Pipeline (Enhancement)": "In Pipeline (Enhancement)",
    "Archive Now": "Archive Now",
    "Archive Q1 FY27": "Archive Q1 FY27",
}

# catalogue status -> (lifecycle, requestable, badge)
# lifecycle states follow the PRD: Ready / InUse / InTesting / Stale / Retired
def lifecycle_for(status, h):
    if status == "Available":
        # most are Ready; ~30% are actively In Use (active vouchers elsewhere)
        return ("InUse", True) if h % 10 < 3 else ("Ready", True)
    if status == "In Pipeline (Enhancement)":
        return ("Stale", True)        # runs but mid-refresh -> held path
    if status == "In Pipeline":
        return ("InTesting", False)   # new lab, not built yet -> coming soon
    if status == "Archive Now":
        return ("Retired", False)     # blocked
    if status == "Archive Q1 FY27":
        return ("Retired", False)     # retiring, blocked
    return ("Ready", True)


def slugify(s):
    s = re.sub(r"\[NEW\]", "", s, flags=re.I)
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:60]


def split_list(cell, sep_modules=False):
    if not cell:
        return []
    txt = str(cell)
    if sep_modules:
        parts = re.split(r"\n+|\r+", txt)
        out = []
        for p in parts:
            p = re.sub(r"^\s*\d+[\.\)]\s*", "", p).strip()
            if p:
                out.append(p)
        return out
    return [p.strip() for p in txt.split(",") if p.strip()]


def hnum(s):
    return int(hashlib.sha256(s.encode()).hexdigest(), 16)


# Interest-grabbing one-liner per lab. Keyword-driven, first match wins.
# Deliberately punchy and benefit-led, and free of em dashes.
HOOK_RULES = [
    (("copilot for sales", "copilot for sale", "dynamic copilot for sales"),
     "Close deals faster with AI that lives right inside your CRM and inbox."),
    (("m365 copilot", "microsoft 365 copilot", "copilot for m365"),
     "Put Microsoft 365 Copilot to work across Word, Excel, Teams and Outlook."),
    (("copilot studio", "leave management", "store operations", "agent"),
     "Design and ship your own AI agents with Copilot Studio, no heavy code needed."),
    (("rag", "chatbot", "ai search", "langchain", "knowledge"),
     "Ground a chatbot in your own data and take it all the way to production."),
    (("openai", "generative ai", "dall-e", "prompt"),
     "Go hands-on with Azure OpenAI, from prompt engineering to responsible AI."),
    (("fabric", "lakehouse", "real-time intelligence", "delta lake", "eventhouse"),
     "Turn raw data into real-time insight with Microsoft Fabric."),
    (("databricks", "spark"),
     "Engineer and analyze data at scale on Azure Databricks."),
    (("defender for endpoint", "edr"),
     "Hunt, investigate and shut down endpoint attacks like a real SOC analyst."),
    (("defender for cloud", "posture", "cspm"),
     "Lock down cloud workloads and fix risks before attackers ever find them."),
    (("sentinel", "secops", "365 defender", "defender suite", "xdr"),
     "Run modern security operations across Microsoft's unified defense stack."),
    (("purview", "data security", "sensitivity label", "compliance"),
     "Discover, classify and protect sensitive data right across your estate."),
    (("kubernetes", "aks", "cloud native", "container", "docker"),
     "Containerize, deploy and scale a cloud-native app on Kubernetes."),
    (("landing zone", "alz", "caf"),
     "Stand up an enterprise-ready Azure foundation the right way."),
    (("migrat", "modernization", "modernize", "site recovery", "hyper-v"),
     "Move real workloads to Azure with a proven, end-to-end migration playbook."),
    (("virtual machine", "compute", "availability set", "iis"),
     "Master core Azure compute, networking and recovery from the ground up."),
    (("app in a day", "power apps", "power platform", "low code", "canvas app", "dataverse"),
     "Build a working business app fast on the Power Platform."),
    (("power bi", "analyst in a day", "faiad", "dataflow"),
     "Go from raw tables to polished, refreshable reports in a single day."),
    (("document", "ocr", "invoice", "form processing"),
     "Automate document-heavy busywork with Azure AI."),
    (("cosmos",), "Build globally distributed, low-latency apps on Cosmos DB."),
    (("synapse",), "Unify big-data and analytics workloads with Azure Synapse."),
    (("devops", "github", "ci/cd", "pipeline"),
     "Ship faster with secure, automated DevOps pipelines."),
    (("marketing",), "Let AI take the busywork out of campaigns and content."),
    (("databricks",), "Engineer data at scale on Azure Databricks."),
]

AREA_FALLBACK = {
    "AI Business Solutions": "Apply Microsoft AI to a real business scenario, start to finish.",
    "Cloud & AI Platforms": "Get hands-on with the Azure platform on a real-world build.",
    "Security": "Defend a live environment using Microsoft's security stack.",
}


def make_hook(title, products, skill, area):
    hay = " ".join([title, skill or "", " ".join(products)]).lower()
    for keys, line in HOOK_RULES:
        if any(k in hay for k in keys):
            return line
    return AREA_FALLBACK.get(area, "Build practical, job-ready skills on Microsoft Cloud.")


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb[SHEET]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    hi = next(i for i, r in enumerate(rows)
              if r and "Solution Area" in [str(c).strip() if c else "" for c in r])
    hdr = [str(c).strip() if c else "" for c in rows[hi]]
    col = {name: hdr.index(name) for name in hdr if name}

    def g(r, name):
        i = col.get(name)
        return r[i] if i is not None and i < len(r) else None

    today = datetime.date(2026, 6, 23)
    seen, labs = set(), []
    for r in rows[hi + 1:]:
        title = g(r, "Lab Title")
        if not title or not str(title).strip():
            continue
        title = re.sub(r"\s+", " ", str(title)).strip()
        # Normalize dash clutter in titles: " - / – / — " separators become a
        # clean colon; stray en/em dashes become hyphens. Keeps wording intact.
        title = re.sub(r"\s+[–—]\s+", ": ", title)
        title = title.replace("—", "-").replace("–", "-")
        raw_type = str(g(r, "Lab Catalog") or "").strip()
        if raw_type not in TYPE:
            continue
        type_id, type_label = TYPE[raw_type]

        base = slugify(title) or "lab"
        lab_id = f"{type_id}-{base}"
        n = 2
        while lab_id in seen:
            lab_id = f"{type_id}-{base}-{n}"; n += 1
        seen.add(lab_id)

        h = hnum(lab_id)
        raw_status = str(g(r, "Status") or "Available").strip()
        status = STATUS.get(raw_status, "Available")
        lifecycle, requestable = lifecycle_for(status, h)

        sa = SOLUTION_AREA.get(str(g(r, "Solution Area") or "").strip(), "Other")
        level = str(g(r, "Level (in GPS Catalog format)") or "").strip() or None
        if level not in ("Beginner", "Intermediate", "Advanced"):
            level = None
        is_new = "[new]" in title.lower()

        # synthesized lifecycle metadata (deterministic from id hash)
        days_ago = (5 + h % 40) if lifecycle in ("Ready", "InUse") else (90 + h % 120)
        last_refresh = (today - datetime.timedelta(days=days_ago)).isoformat() \
            if lifecycle != "InTesting" else None
        issued = 0 if lifecycle in ("InTesting", "Retired") else 20 + h % 380
        redeemed = int(issued * (0.4 + (h % 50) / 100.0))
        last_redeemed = (today - datetime.timedelta(days=h % 30)).isoformat() if redeemed else None
        partner_pool = ["WaferWire LLC", "Contoso", "Fabrikam", "Northwind",
                        "Adventure Works", "Tailspin", "Proseware"]
        npart = 0 if lifecycle in ("InTesting", "Retired") else 1 + h % 3
        partners = [partner_pool[(h + i) % len(partner_pool)] for i in range(npart)]
        partners = sorted(set(partners))

        skill = str(g(r, "Skill Area") or "").strip() or None
        prods = split_list(g(r, "Featured Product (in GPS Catalog format)")) \
            if str(g(r, "Featured Product (in GPS Catalog format)") or "").strip().upper() != "NA" else []

        labs.append({
            "id": lab_id,
            "title": title,
            "hook": make_hook(title, prods, skill, sa),
            "previewUrl": None,
            "isNew": is_new,
            "type": type_id,
            "typeLabel": type_label,
            "solutionArea": sa,
            "skillArea": str(g(r, "Skill Area") or "").strip() or None,
            "level": level,
            "overview": str(g(r, "Course Overview (in GPS Catalog format)") or "").strip(),
            "modules": split_list(g(r, "Lab Modules / Exercises"), sep_modules=True),
            "products": split_list(g(r, "Featured Product (in GPS Catalog format)"))
            if str(g(r, "Featured Product (in GPS Catalog format)") or "").strip().upper() != "NA" else [],
            "enhancements": (str(g(r, "Post Build 2026 Enhancements")).strip()
                             if g(r, "Post Build 2026 Enhancements")
                             and str(g(r, "Post Build 2026 Enhancements")).strip().upper() not in ("NA", "ARCHIVE")
                             else None),
            "catalogStatus": status,
            "lifecycle": lifecycle,
            "requestable": requestable,
            "lastRefresh": last_refresh,
            "vouchers": {"issued": issued, "redeemed": redeemed, "lastRedeemed": last_redeemed},
            "activePartners": partners,
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(labs, f, indent=2, ensure_ascii=False)

    # catalog metadata, surfaced as the "Last updated" metric in the portal
    meta = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc)
        .isoformat(timespec="minutes"),
        "labCount": len(labs),
    }
    with open(os.path.join(os.path.dirname(OUT), "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    # summary
    from collections import Counter
    print(f"Wrote {len(labs)} labs -> {OUT}")
    print("lifecycle:", dict(Counter(l["lifecycle"] for l in labs)))
    print("requestable:", dict(Counter(l["requestable"] for l in labs)))
    print("type:", dict(Counter(l["typeLabel"] for l in labs)))
    print("solutionArea:", dict(Counter(l["solutionArea"] for l in labs)))


if __name__ == "__main__":
    main()
