"""
Volunteer finder: discovers volunteer groups near you, scans their websites for
listed opportunities, and prints a summary with the details volunteers need
(date, time, location, contact, link).

Pipeline:
  1. Location from ipinfo.io
  2. Discover groups: web search (DuckDuckGo, no key) across many cause areas,
     plus nearby nonprofits/shelters/community centers from OpenStreetMap
  3. Visit each group's site (respecting robots.txt), follow "volunteer" /
     "get involved" links, and extract opportunities with whatever details the
     page offers (structured event data first, then text heuristics)
  4. Visit individual opportunity pages to fill in missing date/time/location
  5. Print a summary (upcoming dated events first, then ongoing opportunities,
     then groups to check by hand) and save it to a text file

Install:  pip install requests beautifulsoup4 ddgs
Run:      python volunteer_finder.py
          python volunteer_finder.py --radius 40 --max-sites 50 --out my_summary.txt

Notes: sites that load listings with JavaScript, or sit behind logins, can't be
read by this approach and are flagged. Details are extracted heuristically, so
always confirm date, time, and location on the opportunity's own page.
"""

import argparse
import json
import math
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

USER_AGENT = "volunteer-finder/3.0 (personal project)"
HEADERS = {"User-Agent": USER_AGENT}
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TODAY = date.today()
NOT_LISTED = "Not listed (see link)"

CATEGORIES = {
    "Environment": "environmental conservation cleanup",
    "Animals": "animal shelter rescue",
    "Food & hunger": "food bank pantry meals",
    "Education & youth": "tutoring mentoring youth",
    "Health & wellness": "hospital clinic health",
    "Seniors": "senior center elderly",
    "Housing & homelessness": "housing homeless shelter",
    "Disaster relief": "disaster relief red cross",
    "Arts & culture": "arts museum library",
    "Community & veterans": "community service veterans",
}

SKIP_DOMAINS = (
    "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com",
    "youtube.com", "tiktok.com", "pinterest.com", "reddit.com", "yelp.com",
    "tripadvisor.com", "wikipedia.org", "indeed.com", "glassdoor.com",
    "nextdoor.com", "quora.com", "google.com", "bing.com",
)
AGGREGATORS = (
    "volunteermatch.org", "idealist.org", "justserve.org", "serve.gov",
    "volunteer.gov", "catchafire.org", "handsonnetwork.org",
)

# ------------------------------------------------------------- text patterns

LINK_RE = re.compile(
    r"volunteer|get[- ]?involved|opportunit|ways[- ]to[- ](help|give)|join[- ]us|sign[- ]?up",
    re.I,
)
OPP_RE = re.compile(
    r"volunteer|shift|sign[- ]?up|register|clean[- ]?up|work ?day|tutor|mentor|"
    r"training|orientation|distribution|\bdrive\b|\bevent|help (us|out)|needed",
    re.I,
)
BOILER_RE = re.compile(
    r"privacy|cookie|terms of|donat|newsletter|subscribe|log ?in|skip to|"
    r"all rights reserved|facebook|instagram|twitter",
    re.I,
)

MONTHS = (
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
)
MONTH_NUM = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

ISO_RE = re.compile(r"(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)")
DATE_TEXT_RE = re.compile(
    r"\b(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+)?(" + MONTHS +
    r")\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b", re.I)
DATE_NUM_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b")

AMPM = r"(a\.?m\.?|p\.?m\.?)"
TIME_RANGE_RE = re.compile(
    r"\b(\d{1,2})(?::(\d{2}))?\s*" + AMPM + r"?\s*(?:-|–|—|to|until)\s*"
    r"(\d{1,2})(?::(\d{2}))?\s*" + AMPM + r"(?![a-z])", re.I)
TIME_RE = re.compile(r"\b(\d{1,2})(?::(\d{2}))?\s*" + AMPM + r"(?![a-z])", re.I)

DAYS = r"(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)"
SCHEDULE_RE = re.compile(
    r"\b(?:every|each)\s+(?:other\s+)?(?:" + DAYS + r"|day|week|month)\b"
    r"|\b" + DAYS + r"s\b(?:\s+(?:and|&)\s+" + DAYS + r"s\b)?|\b(?:weekly|monthly)\b",
    re.I)

LOC_LABEL_RE = re.compile(
    r"(?:location|where|address|venue|meet(?:ing)? (?:at|location))\s*[:\-–]\s*(?:\|\s*)?"
    r"([^|•;\n]{4,110})", re.I)
ADDR_RE = re.compile(
    r"\b\d{1,5}\s+[A-Z][\w.]*(?:\s+[A-Z][\w.]*){0,3}\s+"
    r"(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pkwy|Hwy)\b\.?"
    r"(?:,?\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,?\s+[A-Z]{2}\s+\d{5})?")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")


# ---------------------------------------------------------------- location

def get_location():
    info = requests.get("https://ipinfo.io/json", timeout=10).json()
    lat, lon = (float(x) for x in info["loc"].split(","))
    print(f"Location: {info['city']}, {info['region']} ({lat}, {lon})\n")
    return info["city"], info["region"], lat, lon


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


# --------------------------------------------------------------- discovery

def domain_of(url):
    return urlparse(url).netloc.lower().removeprefix("www.")


def is_skipped(url):
    d = domain_of(url)
    return any(d == s or d.endswith("." + s) for s in SKIP_DOMAINS)


_warned_missing_search = False


def search_web(query, max_results=8):
    """DuckDuckGo text search via the `ddgs` package (no API key)."""
    global _warned_missing_search
    try:
        from ddgs import DDGS
    except ImportError:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            if not _warned_missing_search:
                _warned_missing_search = True
                print(
                    "  Web search is unavailable: the 'ddgs' package isn't installed for this Python.\n"
                    f"  Fix it with:  {sys.executable} -m pip install ddgs"
                )
            return []
    try:
        return list(DDGS().text(query, max_results=max_results))
    except Exception as e:  # search backends are flaky; never crash the run
        print(f"  (web search failed for '{query[:50]}...': {e})")
        return []


def discover_via_web(city, region):
    found = {}
    for category, terms in CATEGORIES.items():
        print(f"Searching the web: {category}...")
        for r in search_web(f"{terms} volunteer opportunities {city} {region}"):
            url = r.get("href", "")
            d = domain_of(url)
            if not url.startswith("http") or is_skipped(url) or d in found:
                continue
            found[d] = {
                "name": (r.get("title") or d)[:90],
                "url": url,
                "category": category,
                "source": "web search",
            }
        time.sleep(1)  # be polite to the search backend
    return found


def post_with_retry(query):
    """POST to Overpass, retrying on 504 until success or a different error."""
    attempt = 0
    while True:
        attempt += 1
        resp = requests.post(OVERPASS_URL, data={"data": query}, headers=HEADERS, timeout=60)
        if resp.status_code == 504:
            wait = min(5 * attempt, 30)
            print(f"  504 from Overpass (attempt {attempt}), retrying in {wait}s...")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp


def discover_via_osm(city, region, lat, lon, radius_km):
    print("Querying OpenStreetMap for nearby organizations...")
    around = f"(around:{int(radius_km * 1000)},{lat},{lon})"
    query = (
        "[out:json][timeout:30];("
        f'nwr{around}["office"~"ngo|association|foundation|charity"]["name"];'
        f'nwr{around}["amenity"~"social_facility|community_centre|animal_shelter"]["name"];'
        f'nwr{around}["leisure"="nature_reserve"]["name"];'
        f'nwr{around}["leisure"="garden"]["garden:type"="community"]["name"];'
        ");out center tags 150;"
    )
    try:
        elements = post_with_retry(query).json().get("elements", [])
    except requests.RequestException as e:
        print(f"  OpenStreetMap lookup failed ({e}); continuing with web search only.")
        return {}

    places = []
    for el in elements:
        tags = el.get("tags", {})
        el_lat = el.get("lat") or el.get("center", {}).get("lat")
        el_lon = el.get("lon") or el.get("center", {}).get("lon")
        if not tags.get("name") or el_lat is None or el_lon is None:
            continue
        places.append((haversine_km(lat, lon, el_lat, el_lon), tags))
    places.sort(key=lambda p: p[0])

    found, lookups = {}, 0
    for dist, tags in places:
        site = tags.get("website") or tags.get("contact:website")
        if not site and lookups < 12:  # find a website for nearby groups lacking one
            lookups += 1
            for r in search_web(f'"{tags["name"]}" {city} {region}', max_results=3):
                if r.get("href", "").startswith("http") and not is_skipped(r["href"]):
                    site = r["href"]
                    break
            time.sleep(1)
        if not site:
            continue
        if not site.startswith("http"):
            site = "https://" + site
        found.setdefault(domain_of(site), {
            "name": tags["name"],
            "url": site,
            "category": "Nearby organizations (OpenStreetMap)",
            "source": f"OpenStreetMap, {dist:.1f} km away",
        })
    return found


# ----------------------------------------------------------------- fetching

_robots_cache = {}


def allowed_by_robots(url):
    p = urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots_cache:
        rp = None
        try:
            r = requests.get(base + "/robots.txt", headers=HEADERS, timeout=8)
            if r.status_code == 200 and "<html" not in r.text[:200].lower():
                rp = RobotFileParser()
                rp.parse(r.text.splitlines())
        except requests.RequestException:
            pass
        _robots_cache[base] = rp
    rp = _robots_cache[base]
    return True if rp is None else rp.can_fetch(USER_AGENT, url)


def fetch_html(url):
    if not allowed_by_robots(url):
        return None
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code != 200 or "html" not in r.headers.get("Content-Type", ""):
            return None
        return r.text[:600_000]
    except requests.RequestException:
        return None


# ------------------------------------------------------ detail parsing helpers

def clean(text):
    return " ".join(str(text).split())


def parse_date(text):
    """Return a date found in text, or None. Dates without a year are assumed to
    be the next occurrence (this year, or next year if more than 30 days past)."""
    found = []  # (position in text, date); the earliest mention wins

    for m in ISO_RE.finditer(text):
        try:
            found.append((m.start(), date(int(m.group(1)), int(m.group(2)), int(m.group(3)))))
            break
        except ValueError:
            continue
    for m in DATE_TEXT_RE.finditer(text):
        mon, day, yr = MONTH_NUM[m.group(1)[:3].lower()], int(m.group(2)), m.group(3)
        try:
            if yr:
                d = date(int(yr), mon, day)
            else:
                d = date(TODAY.year, mon, day)
                if d < TODAY - timedelta(days=30):
                    d = date(TODAY.year + 1, mon, day)
            found.append((m.start(), d))
            break
        except ValueError:
            continue
    for m in DATE_NUM_RE.finditer(text):
        yr = int(m.group(3))
        try:
            found.append((m.start(), date(yr + 2000 if yr < 100 else yr, int(m.group(1)), int(m.group(2)))))
            break
        except ValueError:
            continue
    return min(found, key=lambda p: p[0])[1] if found else None


def _ap(s):
    return s.replace(".", "").upper() if s else ""


def _fmt_time(h, m, ap):
    return f"{int(h)}:{int(m or 0):02d} {ap}"


def _minutes(h, m, ap):
    return (int(h) % 12 + (12 if ap == "PM" else 0)) * 60 + int(m or 0)


def parse_time(text):
    """Return (display string, minutes since midnight) or ("", None)."""
    m = TIME_RANGE_RE.search(text)
    if m:
        h1, m1, ap1, h2, m2, ap2 = m.groups()
        ap1, ap2 = _ap(ap1), _ap(ap2)
        if not ap1:
            ap1 = "AM" if ap2 == "PM" and int(h1) % 12 > int(h2) % 12 else ap2
        if 1 <= int(h1) <= 12 and 1 <= int(h2) <= 12:
            return f"{_fmt_time(h1, m1, ap1)} – {_fmt_time(h2, m2, ap2)}", _minutes(h1, m1, ap1)
    m = TIME_RE.search(text)
    if m and 1 <= int(m.group(1)) <= 12:
        ap = _ap(m.group(3))
        return _fmt_time(m.group(1), m.group(2), ap), _minutes(m.group(1), m.group(2), ap)
    return "", None


def parse_iso_time(s):
    """Time from an ISO datetime like 2026-11-02T09:00:00 (None if absent or midnight)."""
    m = re.search(r"T(\d{2}):(\d{2})", str(s))
    if not m or (m.group(1), m.group(2)) == ("00", "00"):
        return None
    h24, mins = int(m.group(1)), m.group(2)
    return _fmt_time(h24 % 12 or 12, mins, "PM" if h24 >= 12 else "AM"), h24 * 60 + int(mins)


def find_location(text):
    m = LOC_LABEL_RE.search(text)
    if m:
        return clean(m.group(1))
    m = ADDR_RE.search(text)
    return clean(m.group(0)) if m else ""


def details_from(*texts):
    """Pull date/time/schedule/location/contact from the first text that has each."""
    d = {"date": None, "time": "", "time_sort": None, "schedule": "",
         "location": "", "email": "", "phone": ""}
    for t in texts:
        if not t:
            continue
        if d["date"] is None:
            d["date"] = parse_date(t)
        if not d["time"]:
            d["time"], d["time_sort"] = parse_time(t)
        if not d["schedule"] and (m := SCHEDULE_RE.search(t)):
            d["schedule"] = m.group(0).lower()
        if not d["location"]:
            d["location"] = find_location(t)
        if not d["email"] and (m := EMAIL_RE.search(t)):
            d["email"] = m.group(0)
        if not d["phone"] and (m := PHONE_RE.search(t)):
            d["phone"] = m.group(0)
    return d


def new_opp(title, link, page, **kw):
    opp = {"title": title, "link": link, "page": page, "date": None, "time": "",
           "time_sort": None, "schedule": "", "location": "", "description": "",
           "email": "", "phone": ""}
    opp.update({k: v for k, v in kw.items() if v})
    return opp


def short(text, n=200):
    text = clean(text)
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


# ----------------------------------------------------------- page extraction

def _walk_jsonld(node):
    if isinstance(node, dict):
        yield node
        for v in node.values():
            yield from _walk_jsonld(v)
    elif isinstance(node, list):
        for v in node:
            yield from _walk_jsonld(v)


def _jsonld_blocks(soup):
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            yield json.loads(tag.string or "")
        except ValueError:
            continue


def _addr_string(addr):
    if isinstance(addr, dict):
        parts = [addr.get("streetAddress"), addr.get("addressLocality"),
                 addr.get("addressRegion"), addr.get("postalCode")]
        return ", ".join(str(p) for p in parts if p)
    return clean(addr) if isinstance(addr, str) else ""


def _jsonld_location(item):
    if "OnlineEventAttendanceMode" in str(item.get("eventAttendanceMode", "")):
        return "Online"
    loc = item.get("location")
    if isinstance(loc, list):
        loc = loc[0] if loc else None
    if isinstance(loc, str):
        return clean(loc)
    if isinstance(loc, dict):
        parts = [loc.get("name"), _addr_string(loc.get("address"))]
        return ", ".join(p for p in parts if p)
    return ""


def extract_jsonld_events(soup, page_url):
    out = []
    for block in _jsonld_blocks(soup):
        for item in _walk_jsonld(block):
            types = item.get("@type")
            types = types if isinstance(types, list) else [types]
            if not any(t in ("Event", "VolunteerAction") for t in types) or not item.get("name"):
                continue
            start, end = item.get("startDate", ""), item.get("endDate", "")
            t1, t2 = parse_iso_time(start), parse_iso_time(end)
            when = ""
            if t1 and t2 and t1[0] != t2[0]:
                when = f"{t1[0]} – {t2[0]}"
            elif t1:
                when = t1[0]
            out.append(new_opp(
                clean(item["name"]), item.get("url") or page_url, page_url,
                date=parse_date(str(start)), time=when,
                time_sort=t1[1] if t1 else None,
                location=_jsonld_location(item),
                description=short(BeautifulSoup(str(item.get("description", "")), "html.parser").get_text(" ")),
            ))
    return out


def extract_org_info(soup):
    """Group-level contact details (phone, email, address) from structured data or page text."""
    info = {"email": "", "phone": "", "address": ""}
    for block in _jsonld_blocks(soup):
        items = block.get("@graph", [block]) if isinstance(block, dict) else block
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict) or item.get("@type") in ("Event", "VolunteerAction"):
                continue
            info["phone"] = info["phone"] or str(item.get("telephone", "") or "")
            info["email"] = info["email"] or str(item.get("email", "") or "").replace("mailto:", "")
            info["address"] = info["address"] or _addr_string(item.get("address"))
    if not info["email"]:
        a = soup.find("a", href=re.compile(r"^mailto:", re.I))
        if a:
            info["email"] = a["href"][7:].split("?")[0]
    text = soup.get_text(" | ", strip=True)
    if not info["email"] and (m := EMAIL_RE.search(text)):
        info["email"] = m.group(0)
    if not info["phone"] and (m := PHONE_RE.search(text)):
        info["phone"] = m.group(0)
    if not info["address"] and (m := ADDR_RE.search(text)):
        info["address"] = clean(m.group(0))
    return info


def meta_description(soup):
    tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
    return short(tag["content"]) if tag and tag.get("content") else ""


def volunteer_links(soup, base_url):
    """Same-site links whose text or URL looks like a volunteering page."""
    host = urlparse(base_url).netloc
    scored = {}
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        url = urljoin(base_url, href).split("#")[0]
        if urlparse(url).netloc != host:
            continue
        text = a.get_text(" ", strip=True)
        if BOILER_RE.search(text) or BOILER_RE.search(urlparse(url).path):
            continue
        if LINK_RE.search(text) or LINK_RE.search(urlparse(url).path):
            score = 2 if re.search("volunteer", text + url, re.I) else 1
            scored[url] = max(score, scored.get(url, 0))
    return [u for u, _ in sorted(scored.items(), key=lambda kv: -kv[1])]


def _heading_context(h):
    """Text that follows a heading, up to the next heading (its 'card' body)."""
    parts, n = [], 0
    for sib in h.next_siblings:
        if getattr(sib, "name", None) in ("h1", "h2", "h3", "h4", "ul", "ol", "script", "style"):
            break
        t = sib.get_text(" | ", strip=True) if hasattr(sib, "get_text") else str(sib).strip()
        if t:
            parts.append(t)
            n += len(t)
        if n > 400:
            break
    return " | ".join(parts)[:500]


def extract_html_opportunities(soup, page_url):
    out = []
    for el in soup.find_all(["h2", "h3", "h4", "li", "a"]):
        if el.find_parent(["nav", "header", "footer"]):
            continue
        text = clean(el.get_text(" ", strip=True))
        if not (20 <= len(text) <= 160) or len(text.split()) < 3:
            continue
        if not OPP_RE.search(text) or BOILER_RE.search(text):
            continue

        if el.name in ("h2", "h3", "h4"):
            body = _heading_context(el)
        elif el.name == "li":
            body = el.get_text(" | ", strip=True)
        else:
            parent = el.parent
            body = parent.get_text(" | ", strip=True) if parent is not None and parent.name in ("p", "li") and len(parent.get_text()) < 300 else ""

        a = el if el.name == "a" else el.find("a")
        href = a.get("href") if a and a.get("href") else None
        link = urljoin(page_url, href) if href and not href.startswith(("mailto:", "javascript:", "tel:")) else page_url

        d = details_from(text, body)
        # Description = leftover body text once date/time/location/contact lines are removed.
        leftover = [
            seg for seg in body.split(" | ")
            if seg and seg != text
            and not (parse_date(seg) or parse_time(seg)[0] or LOC_LABEL_RE.search(seg)
                     or EMAIL_RE.search(seg) or PHONE_RE.search(seg)
                     or re.match(r"\s*(date|time|when|where|location|contact)\b", seg, re.I))
        ]
        out.append(new_opp(text, link, page_url, description=short(" ".join(leftover)), **d))
    return out


# ----------------------------------------------------------------- scanning

def scan_site(org):
    html = fetch_html(org["url"])
    if html is None:
        org.update(opportunities=[], contact={}, note="could not read site (blocked, offline, or disallowed by robots.txt)")
        return org

    pages = [(org["url"], BeautifulSoup(html, "html.parser"))]
    for link in volunteer_links(pages[0][1], org["url"])[:2]:
        if link != org["url"] and (h := fetch_html(link)):
            pages.append((link, BeautifulSoup(h, "html.parser")))

    contact = {"email": "", "phone": "", "address": ""}
    opps = []
    for url, soup in pages:
        for k, v in extract_org_info(soup).items():
            contact[k] = contact[k] or v
        opps += extract_jsonld_events(soup, url) + extract_html_opportunities(soup, url)

    seen, unique = set(), []
    for o in opps:
        key = re.sub(r"\W+", "", o["title"].lower())[:60]
        if key not in seen:
            seen.add(key)
            o.update(org=org["name"], category=org["category"], org_url=org["url"], org_address=contact["address"])
            o["email"] = o["email"] or contact["email"]
            o["phone"] = o["phone"] or contact["phone"]
            unique.append(o)
    unique.sort(key=lambda o: (o["date"] is None, o["date"] or TODAY))

    org["opportunities"] = unique[:8]
    org["contact"] = contact
    org["note"] = "" if unique else "no listings found; they may load via JavaScript, so check the site directly"
    return org


def enrich(opp):
    """Visit the opportunity's own page to fill in missing date/time/location."""
    html = fetch_html(opp["link"])
    if not html:
        return opp
    soup = BeautifulSoup(html, "html.parser")

    events = extract_jsonld_events(soup, opp["link"])
    if events:
        e = events[0]
        for k in ("date", "time", "time_sort", "location", "description"):
            if not opp[k] and e[k]:
                opp[k] = e[k]
    else:
        root = soup.find("main") or soup.find("article") or soup.body or soup
        d = details_from(root.get_text(" | ", strip=True)[:2500])
        for k in ("date", "time", "time_sort", "schedule", "location"):
            if not opp[k] and d[k]:
                opp[k] = d[k]
    if not opp["description"]:
        opp["description"] = meta_description(soup)
    return opp


def finalize(opps):
    """Drop past events and duplicates."""
    seen, out = set(), []
    for o in opps:
        if o["date"] and o["date"] < TODAY:
            continue
        key = (re.sub(r"\W+", "", o["title"].lower())[:60], o["date"])
        if key not in seen:
            seen.add(key)
            out.append(o)
    return out


def find_opportunities_near(lat, lon, city, region, radius_km=25, max_sites=20, max_details=15):
    """Return nearby volunteer listings for an API caller with browser-provided location."""
    orgs = discover_via_osm(city, region, lat, lon, radius_km)
    if city and region:
        for domain, org in discover_via_web(city, region).items():
            orgs.setdefault(domain, org)

    candidates = list(orgs.values())[:max_sites]
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(scan_site, candidates))

    opportunities = [opp for group in results for opp in group["opportunities"]]
    needs_detail = [opp for opp in opportunities
                    if opp["link"] != opp["page"] and not (opp["date"] and opp["time"] and opp["location"])]
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(enrich, needs_detail[:max_details]))

    opportunities = finalize(opportunities)
    opportunities.sort(key=lambda opp: (
        opp["date"] is None,
        opp["date"] or TODAY,
        opp["time_sort"] if opp["time_sort"] is not None else 1440,
    ))
    return opportunities, results


# ------------------------------------------------------------------ summary

def format_when(o):
    parts = []
    if o["date"]:
        parts.append(f"{o['date']:%a, %b} {o['date'].day}, {o['date'].year}")
    elif o["schedule"]:
        parts.append(o["schedule"].title())
    if o["time"]:
        parts.append(o["time"])
    return " • ".join(parts) or NOT_LISTED


def format_block(i, o):
    where = o["location"]
    if not where:
        where = f"{NOT_LISTED}" + (f"; group address: {o['org_address']}" if o.get("org_address") else "")
    lines = [
        f"{i}. {o['title']}",
        f"   Group:    {o['org']} ({o['category']})",
        f"   When:     {format_when(o)}",
        f"   Where:    {where}",
    ]
    if o["description"]:
        lines.append(f"   Details:  {o['description']}")
    contact = " • ".join(x for x in (o["email"], o["phone"]) if x)
    if contact:
        lines.append(f"   Contact:  {contact}")
    lines.append(f"   More info / sign up: {o['link']}")
    return lines


def build_summary(city, region, opps, orgs, max_ongoing):
    dated = sorted((o for o in opps if o["date"]),
                   key=lambda o: (o["date"], o["time_sort"] if o["time_sort"] is not None else 1440))
    ongoing = sorted((o for o in opps if not o["date"]),
                     key=lambda o: -sum(bool(o[k]) for k in ("schedule", "time", "location", "description")))
    empty = [g for g in orgs if not g["opportunities"]]
    bar = "=" * 66

    out = [bar, f"VOLUNTEER OPPORTUNITIES NEAR {city.upper()}, {region.upper()}",
           f"Generated {TODAY:%b} {TODAY.day}, {TODAY.year} • {len(orgs)} groups scanned • "
           f"{len(dated)} dated + {len(ongoing)} ongoing opportunities", bar,
           "Details are pulled automatically; confirm date, time, and location on each link."]

    out += ["", f"UPCOMING (with a date), soonest first: {len(dated)}", "-" * 66]
    if dated:
        for i, o in enumerate(dated, 1):
            out += format_block(i, o) + [""]
    else:
        out += ["None found with a specific date.", ""]

    out += [f"ONGOING / NO SPECIFIC DATE: {len(ongoing)}", "-" * 66]
    if ongoing:
        for i, o in enumerate(ongoing[:max_ongoing], 1):
            out += format_block(i, o) + [""]
        if len(ongoing) > max_ongoing:
            out += [f"...and {len(ongoing) - max_ongoing} more (raise --max-ongoing to see them).", ""]
    else:
        out += ["None found.", ""]

    if empty:
        out += [f"GROUPS TO CHECK BY HAND (no listings could be read): {len(empty)}", "-" * 66]
        for g in empty:
            c = g.get("contact") or {}
            extra = " • ".join(x for x in (c.get("email"), c.get("phone")) if x)
            out.append(f"- {g['name']} ({g['category']})")
            out.append(f"  {g['url']}" + (f"  |  {extra}" if extra else ""))
            if g["note"]:
                out.append(f"  note: {g['note']}")
        out.append("")

    listing_sites = [g for g in orgs if any(domain_of(g["url"]).endswith(a) for a in AGGREGATORS)]
    if listing_sites:
        out += ["LISTING SITES worth searching directly (live, filterable listings):"]
        out += [f"- {g['name']}: {g['url']}" for g in listing_sites] + [""]
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description="Find nearby volunteer opportunities.")
    parser.add_argument("--radius", type=float, default=25, help="OpenStreetMap search radius in km")
    parser.add_argument("--max-sites", type=int, default=30, help="max websites to scan")
    parser.add_argument("--max-details", type=int, default=25, help="max opportunity pages to open for extra details")
    parser.add_argument("--max-ongoing", type=int, default=50, help="max ongoing opportunities to list")
    parser.add_argument("--out", default="volunteer_summary.txt", help="file to save the summary to")
    args = parser.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

    city, region, lat, lon = get_location()

    orgs = discover_via_osm(city, region, lat, lon, args.radius)
    for d, o in discover_via_web(city, region).items():
        orgs.setdefault(d, o)

    candidates = list(orgs.values())[: args.max_sites]
    print(f"\nScanning {len(candidates)} websites for volunteer listings...")
    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(scan_site, o) for o in candidates]
        for i, f in enumerate(as_completed(futures), 1):
            results.append(f.result())
            print(f"  scanned {i}/{len(futures)}", end="\r")
    print()

    all_opps = [o for g in results for o in g["opportunities"]]
    needs_detail = [o for o in all_opps
                    if o["link"] != o["page"] and not (o["date"] and o["time"] and o["location"])]
    needs_detail = needs_detail[: args.max_details]
    if needs_detail:
        print(f"Opening {len(needs_detail)} opportunity pages for details...")
        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(enrich, needs_detail))

    final = finalize(all_opps)
    summary = build_summary(city, region, final, results, args.max_ongoing)

    print("\n" + summary)
    try:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(summary + "\n")
        print(f"\nSummary saved to {args.out}")
    except OSError as e:
        print(f"\n(could not save summary file: {e})")


if __name__ == "__main__":
    main()
