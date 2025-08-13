import re
from collections import Counter, defaultdict
from paragraphs.models import Paragraph

WORD_RE= re.compile(r"\b[\w']+\b", re.UNICODE)

def tokenize_with_positions(text):
    """
    Extracts lowercase words and their character start positions.
    Returns a list of (word, position) tuples.
    """
    return [(match.group().lower(), match.start()) for match in WORD_RE.finditer(text)]

def process_paragraphs(user, raw_input):
    """
    Splits input on double newlines into paragraphs,
    tokenizes each, computes word counts + positions,
    and persists Paragraph objects with enriched word data.
    """
    paragraphs_raw = [p for p in raw_input.strip().split("\n\n") if p.strip()]
    paragraphs = []

    for p in paragraphs_raw:
        word_data = defaultdict(lambda: {"count": 0, "positions": []})
        for word, pos in tokenize_with_positions(p):
            word_data[word]["count"] += 1
            word_data[word]["positions"].append(pos)

        # Convert defaultdict to normal dict for JSONField
        word_data = dict(word_data)

        paragraph = Paragraph.objects.create(
            user=user,
            content=p,
            word_counts=word_data  # now includes both count and positions
        )
        paragraphs.append(paragraph)

    return paragraphs